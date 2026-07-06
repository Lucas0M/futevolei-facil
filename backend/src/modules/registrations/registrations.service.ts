import { Prisma, RegistrationStatus, TeamRegistrationStatus, TournamentStatus } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AppError } from "../../shared/errors/AppError";
import { CreateTeamRegistrationInput, UpdateTeamPartnerInput } from "./registrations.schema";

// ---------------------------------------------------------------------------
// CREATE (RF10, RF11, RF14, RN01, RN03, RN08, RN09)
// ---------------------------------------------------------------------------

// Entry point used by the controller: dispatches to the right creation
// logic depending on the tournament's format.
export async function createRegistration(
  tournamentId: string,
  userId: string,
  body: { partnerName?: string }
) {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) {
    throw new AppError("Torneio não encontrado.", 404, "TOURNAMENT_NOT_FOUND");
  }

  assertTournamentIsOpenForRegistration(tournament.status, tournament.registrationDeadline);

  if (tournament.format === "DUO_FIXED") {
    if (!body.partnerName) {
      throw new AppError("Nome do parceiro é obrigatório para este torneio.", 422, "PARTNER_NAME_REQUIRED");
    }
    return createTeamRegistration(tournament, userId, { partnerName: body.partnerName });
  }

  return createIndividualRegistration(tournament, userId);
}

async function createIndividualRegistration(
  tournament: { id: string; entryFee: Prisma.Decimal; maxSlots: number; reservationTtlMinutes: number },
  userId: string
) {
  // RN01 - a player cannot register twice for the same tournament.
  const existing = await prisma.registration.findUnique({
    where: { tournamentId_userId: { tournamentId: tournament.id, userId } },
  });
  if (existing && existing.status !== "CANCELLED" && existing.status !== "EXPIRED") {
    throw new AppError("Você já está inscrito neste torneio.", 409, "ALREADY_REGISTERED");
  }

  return prisma.$transaction(async (tx) => {
    // Locks the tournament row for the duration of this transaction, so two
    // concurrent registrations can't both "see" the same free slot (RNF03).
    await tx.$queryRaw`SELECT id FROM tournaments WHERE id = ${tournament.id} FOR UPDATE`;

    await expireStaleReservations(tx, tournament.id);

    const occupiedSlots = await tx.registration.count({
      where: {
        tournamentId: tournament.id,
        status: { in: ["PENDING_PAYMENT", "CONFIRMED"] },
      },
    });

    if (occupiedSlots >= tournament.maxSlots) {
      throw new AppError("Este torneio já atingiu o limite de vagas.", 409, "TOURNAMENT_FULL");
    }

    const reservedUntil = new Date(Date.now() + tournament.reservationTtlMinutes * 60 * 1000);

    // A CANCELLED/EXPIRED row for this (tournament, user) pair already exists
    // due to the unique constraint - reuse and reset it instead of inserting
    // a new row, which would violate that same constraint.
    if (existing) {
      return tx.registration.update({
        where: { id: existing.id },
        data: {
          amountDue: tournament.entryFee,
          status: RegistrationStatus.PENDING_PAYMENT,
          reservedUntil,
        },
      });
    }

    return tx.registration.create({
      data: {
        tournamentId: tournament.id,
        userId,
        amountDue: tournament.entryFee,
        status: RegistrationStatus.PENDING_PAYMENT,
        reservedUntil,
      },
    });
  });
}

async function createTeamRegistration(
  tournament: { id: string; entryFee: Prisma.Decimal; maxSlots: number; reservationTtlMinutes: number },
  ownerUserId: string,
  input: CreateTeamRegistrationInput
) {
  const owner = await prisma.user.findUnique({ where: { id: ownerUserId } });
  if (!owner) {
    throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
  }

  // RN09 - a user cannot be their own partner. Since the partner has no
  // account, we can only check this by comparing names.
  if (normalizeName(input.partnerName) === normalizeName(owner.name)) {
    throw new AppError("O parceiro não pode ser você mesmo.", 422, "INVALID_PARTNER");
  }

  // RN01 (adapted) - the owner cannot have two teams in the same tournament.
  const existing = await prisma.team.findUnique({
    where: { tournamentId_ownerUserId: { tournamentId: tournament.id, ownerUserId } },
  });
  if (existing && existing.status !== "CANCELLED" && existing.status !== "EXPIRED") {
    throw new AppError("Você já inscreveu uma dupla neste torneio.", 409, "ALREADY_REGISTERED");
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM tournaments WHERE id = ${tournament.id} FOR UPDATE`;

    await expireStaleReservations(tx, tournament.id);

    // maxSlots counts TEAMS for DUO_FIXED, per product decision.
    const occupiedSlots = await tx.team.count({
      where: {
        tournamentId: tournament.id,
        status: { in: ["PENDING_PAYMENT", "CONFIRMED"] },
      },
    });

    if (occupiedSlots >= tournament.maxSlots) {
      throw new AppError("Este torneio já atingiu o limite de vagas.", 409, "TOURNAMENT_FULL");
    }

    const reservedUntil = new Date(Date.now() + tournament.reservationTtlMinutes * 60 * 1000);

    // Same reasoning as in createIndividualRegistration: reuse the existing
    // CANCELLED/EXPIRED row instead of inserting a new one (unique constraint).
    if (existing) {
      return tx.team.update({
        where: { id: existing.id },
        data: {
          partnerName: input.partnerName,
          amountDue: tournament.entryFee,
          status: TeamRegistrationStatus.PENDING_PAYMENT,
          reservedUntil,
        },
      });
    }

    return tx.team.create({
      data: {
        tournamentId: tournament.id,
        ownerUserId,
        partnerName: input.partnerName,
        amountDue: tournament.entryFee, // full pair price - see Team model comments
        status: TeamRegistrationStatus.PENDING_PAYMENT,
        reservedUntil,
      },
    });
  });
}

function assertTournamentIsOpenForRegistration(status: TournamentStatus, registrationDeadline: Date) {
  if (status !== TournamentStatus.PUBLISHED) {
    throw new AppError("Este torneio não está com inscrições abertas.", 400, "TOURNAMENT_NOT_OPEN");
  }
  // RF14
  if (registrationDeadline < new Date()) {
    throw new AppError("O prazo de inscrição para este torneio já encerrou.", 400, "REGISTRATION_DEADLINE_PASSED");
  }
}

// RN03 - releases slots held by reservations that expired without payment.
// Called lazily (on demand) before every slot-count check, since we agreed
// to skip a background cron job for this MVP step.
async function expireStaleReservations(tx: Prisma.TransactionClient, tournamentId: string) {
  const now = new Date();

  await tx.registration.updateMany({
    where: { tournamentId, status: "PENDING_PAYMENT", reservedUntil: { lt: now } },
    data: { status: "EXPIRED" },
  });

  await tx.team.updateMany({
    where: { tournamentId, status: "PENDING_PAYMENT", reservedUntil: { lt: now } },
    data: { status: "EXPIRED" },
  });
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// CANCEL BY PLAYER (RF12, RN04)
// ---------------------------------------------------------------------------

export async function cancelOwnRegistration(registrationId: string, userId: string) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { tournament: true },
  });
  if (!registration) {
    throw new AppError("Inscrição não encontrada.", 404, "REGISTRATION_NOT_FOUND");
  }
  if (registration.userId !== userId) {
    throw new AppError("Você não pode cancelar uma inscrição que não é sua.", 403, "FORBIDDEN");
  }

  assertNotYetConfirmed(registration.status);
  assertWithinCancellationWindow(registration.tournament.eventDate, registration.tournament.cancellationDeadlineHours);

  return prisma.registration.update({
    where: { id: registrationId },
    data: { status: "CANCELLED" },
  });
}

export async function cancelOwnTeam(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { tournament: true },
  });
  if (!team) {
    throw new AppError("Inscrição de dupla não encontrada.", 404, "TEAM_NOT_FOUND");
  }
  if (team.ownerUserId !== userId) {
    throw new AppError("Você não pode cancelar uma inscrição que não é sua.", 403, "FORBIDDEN");
  }

  assertNotYetConfirmed(team.status);
  assertWithinCancellationWindow(team.tournament.eventDate, team.tournament.cancellationDeadlineHours);

  // Cancels the whole pair at once - the partner has no account to manage this themselves.
  return prisma.team.update({
    where: { id: teamId },
    data: { status: "CANCELLED" },
  });
}

function assertNotYetConfirmed(status: string) {
  if (status === "CONFIRMED") {
    throw new AppError(
      "Sua inscrição já está confirmada e paga. Para cancelar, entre em contato diretamente com o organizador.",
      400,
      "CANNOT_SELF_CANCEL_CONFIRMED"
    );
  }
}

function assertWithinCancellationWindow(eventDate: Date, cancellationDeadlineHours: number) {
  const deadline = new Date(eventDate.getTime() - cancellationDeadlineHours * 60 * 60 * 1000);
  if (new Date() > deadline) {
    throw new AppError(
      "O prazo para cancelamento já passou. Entre em contato com o organizador.",
      400,
      "CANCELLATION_DEADLINE_PASSED"
    );
  }
}

// ---------------------------------------------------------------------------
// ADMIN REMOVAL (RF13) - no deadline restriction
// ---------------------------------------------------------------------------

export async function adminCancelRegistration(registrationId: string) {
  const registration = await prisma.registration.findUnique({ where: { id: registrationId } });
  if (!registration) {
    throw new AppError("Inscrição não encontrada.", 404, "REGISTRATION_NOT_FOUND");
  }
  return prisma.registration.update({ where: { id: registrationId }, data: { status: "CANCELLED" } });
}

export async function adminCancelTeam(teamId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    throw new AppError("Inscrição de dupla não encontrada.", 404, "TEAM_NOT_FOUND");
  }
  return prisma.team.update({ where: { id: teamId }, data: { status: "CANCELLED" } });
}

// Admin can fix the partner's name after the fact (e.g. partner swap).
export async function updateTeamPartnerName(teamId: string, input: UpdateTeamPartnerInput) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    throw new AppError("Inscrição de dupla não encontrada.", 404, "TEAM_NOT_FOUND");
  }
  return prisma.team.update({ where: { id: teamId }, data: { partnerName: input.partnerName } });
}

// ---------------------------------------------------------------------------
// LIST MY REGISTRATIONS (RF19-adjacent / player history)
// ---------------------------------------------------------------------------

export async function listMyRegistrations(userId: string) {
  const [registrations, teams] = await prisma.$transaction([
    prisma.registration.findMany({
      where: { userId },
      include: { tournament: { select: { id: true, name: true, eventDate: true, format: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.team.findMany({
      where: { ownerUserId: userId },
      include: { tournament: { select: { id: true, name: true, eventDate: true, format: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { registrations, teams };
}
