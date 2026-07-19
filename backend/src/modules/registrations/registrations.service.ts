import { Prisma, RegistrationStatus, TeamRegistrationStatus, EntityStatus } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AppError } from "../../shared/errors/AppError";
import { CreateTeamRegistrationInput, UpdateTeamPartnerInput } from "./registrations.schema";

// ---------------------------------------------------------------------------
// CREATE (RF10, RF11, RF14, RN01, RN03, RN08, RN09)
// ---------------------------------------------------------------------------

export async function createRegistration(categoryId: string, userId: string, userRole: string, body: { partnerName?: string, customOwnerName?: string, customPlayerName?: string }) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new AppError("Categoria não encontrada.", 404, "CATEGORY_NOT_FOUND");
  }

  if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    assertCategoryIsOpenForRegistration(category.status, category.registrationDeadline);
  }

  let targetUserId = userId;
  if (userRole === "ADMIN" || userRole === "SUPERADMIN") {
    const dummyEmail = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}@ares.com`;
    const dummyUser = await prisma.user.create({
      data: {
        email: dummyEmail,
        passwordHash: "manual-registration",
        name: body.customPlayerName || body.customOwnerName || "Jogador Manual",
        role: "PLAYER"
      }
    });
    targetUserId = dummyUser.id;
  }

  if (category.format === "DUO_FIXED") {
    if (!body.partnerName) {
      throw new AppError("Nome do parceiro é obrigatório para esta categoria.", 422, "PARTNER_NAME_REQUIRED");
    }
    return createTeamRegistration(category, targetUserId, userRole, { partnerName: body.partnerName, customOwnerName: body.customOwnerName || body.customPlayerName });
  }

  return createIndividualRegistration(category, targetUserId, userRole, { customPlayerName: body.customPlayerName });
}

async function createIndividualRegistration(
  category: { id: string; entryFee: Prisma.Decimal; maxSlots: number; reservationTtlMinutes: number },
  userId: string,
  userRole: string,
  input: { customPlayerName?: string }
) {
  const existing = await prisma.registration.findUnique({
    where: { categoryId_userId: { categoryId: category.id, userId } },
  });
  if (existing && existing.status !== "CANCELLED" && existing.status !== "EXPIRED") {
    throw new AppError("Você já está inscrito nesta categoria.", 409, "ALREADY_REGISTERED");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const nameToCheck = input.customPlayerName || user?.name || "";
  const normalized = normalizeName(nameToCheck);

  // Check duplicate name in registrations
  const activeRegs = await prisma.registration.findMany({
    where: { categoryId: category.id, status: { notIn: ["CANCELLED", "EXPIRED"] } },
    include: { user: true }
  });
  for (const r of activeRegs) {
    if (r.id !== existing?.id && normalizeName(r.customPlayerName || r.user.name) === normalized) {
      throw new AppError(`O jogador "${nameToCheck}" já está inscrito nesta categoria.`, 409, "DUPLICATE_PLAYER_NAME");
    }
  }

  // Check duplicate name in teams
  const activeTeams = await prisma.team.findMany({
    where: { categoryId: category.id, status: { notIn: ["CANCELLED", "EXPIRED"] } },
    include: { ownerUser: true }
  });
  for (const t of activeTeams) {
    if (normalizeName(t.customOwnerName || t.ownerUser.name) === normalized || normalizeName(t.partnerName) === normalized) {
      throw new AppError(`O jogador "${nameToCheck}" já está inscrito em uma dupla nesta categoria.`, 409, "DUPLICATE_PLAYER_NAME");
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM categories WHERE id = ${category.id} FOR UPDATE`;

    await expireStaleReservations(tx, category.id);

    const occupiedSlots = await tx.registration.count({
      where: { categoryId: category.id, status: { in: ["PENDING_PAYMENT", "CONFIRMED"] } },
    });

    if (occupiedSlots >= category.maxSlots) {
      throw new AppError("Esta categoria já atingiu o limite de vagas.", 409, "CATEGORY_FULL");
    }

    const reservedUntil = new Date(Date.now() + category.reservationTtlMinutes * 60 * 1000);

    if (existing) {
      // Clear out any payment from the row's previous life (e.g. an old
      // APPROVED payment from a prior confirmed-then-cancelled cycle).
      await tx.payment.deleteMany({ where: { registrationId: existing.id } });

      return tx.registration.update({
        where: { id: existing.id },
        data: { 
          amountDue: category.entryFee, 
          status: RegistrationStatus.PENDING_PAYMENT, 
          reservedUntil,
          customPlayerName: (userRole === "ADMIN" || userRole === "SUPERADMIN") ? input.customPlayerName : null,
        },
      });
    }

    return tx.registration.create({
      data: {
        categoryId: category.id,
        userId,
        amountDue: category.entryFee,
        status: RegistrationStatus.PENDING_PAYMENT,
        reservedUntil,
        customPlayerName: (userRole === "ADMIN" || userRole === "SUPERADMIN") ? input.customPlayerName : null,
      },
    });
  });
}

async function createTeamRegistration(
  category: { id: string; entryFee: Prisma.Decimal; maxSlots: number; reservationTtlMinutes: number },
  ownerUserId: string,
  userRole: string,
  input: CreateTeamRegistrationInput
) {
  const owner = await prisma.user.findUnique({ where: { id: ownerUserId } });
  if (!owner) {
    throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
  }

  const ownerNameToCheck = input.customOwnerName || owner.name;
  if (normalizeName(input.partnerName) === normalizeName(ownerNameToCheck)) {
    throw new AppError("O parceiro não pode ser você mesmo.", 422, "INVALID_PARTNER");
  }

  const existing = await prisma.team.findUnique({
    where: { categoryId_ownerUserId: { categoryId: category.id, ownerUserId } },
  });
  if (existing && existing.status !== "CANCELLED" && existing.status !== "EXPIRED") {
    throw new AppError("Você já inscreveu uma dupla nesta categoria.", 409, "ALREADY_REGISTERED");
  }

  const normalizedOwner = normalizeName(ownerNameToCheck);
  const normalizedPartner = normalizeName(input.partnerName);

  // Check duplicate name in registrations
  const activeRegs = await prisma.registration.findMany({
    where: { categoryId: category.id, status: { notIn: ["CANCELLED", "EXPIRED"] } },
    include: { user: true }
  });
  for (const r of activeRegs) {
    const rName = normalizeName(r.customPlayerName || r.user.name);
    if (rName === normalizedOwner) {
      throw new AppError(`O jogador "${ownerNameToCheck}" já está inscrito nesta categoria.`, 409, "DUPLICATE_PLAYER_NAME");
    }
    if (rName === normalizedPartner) {
      throw new AppError(`O jogador "${input.partnerName}" já está inscrito nesta categoria.`, 409, "DUPLICATE_PLAYER_NAME");
    }
  }

  // Check duplicate name in teams
  const activeTeams = await prisma.team.findMany({
    where: { categoryId: category.id, status: { notIn: ["CANCELLED", "EXPIRED"] } },
    include: { ownerUser: true }
  });
  for (const t of activeTeams) {
    if (t.id === existing?.id) continue;
    const tOwner = normalizeName(t.customOwnerName || t.ownerUser.name);
    const tPartner = normalizeName(t.partnerName);

    if (tOwner === normalizedOwner || tPartner === normalizedOwner) {
      throw new AppError(`O jogador "${ownerNameToCheck}" já está inscrito em outra dupla nesta categoria.`, 409, "DUPLICATE_PLAYER_NAME");
    }
    if (tOwner === normalizedPartner || tPartner === normalizedPartner) {
      throw new AppError(`O jogador "${input.partnerName}" já está inscrito em outra dupla nesta categoria.`, 409, "DUPLICATE_PLAYER_NAME");
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM categories WHERE id = ${category.id} FOR UPDATE`;

    await expireStaleReservations(tx, category.id);

    const occupiedSlots = await tx.team.count({
      where: { categoryId: category.id, status: { in: ["PENDING_PAYMENT", "CONFIRMED"] } },
    });

    if (occupiedSlots >= category.maxSlots) {
      throw new AppError("Esta categoria já atingiu o limite de vagas.", 409, "CATEGORY_FULL");
    }

    const reservedUntil = new Date(Date.now() + category.reservationTtlMinutes * 60 * 1000);

    if (existing) {
      await tx.payment.deleteMany({ where: { teamId: existing.id } });

      return tx.team.update({
        where: { id: existing.id },
        data: {
          partnerName: input.partnerName,
          amountDue: category.entryFee,
          status: TeamRegistrationStatus.PENDING_PAYMENT,
          reservedUntil,
          customOwnerName: (userRole === "ADMIN" || userRole === "SUPERADMIN") ? input.customOwnerName : null,
        },
      });
    }

    return tx.team.create({
      data: {
        categoryId: category.id,
        ownerUserId,
        partnerName: input.partnerName,
        amountDue: category.entryFee,
        status: TeamRegistrationStatus.PENDING_PAYMENT,
        reservedUntil,
        customOwnerName: (userRole === "ADMIN" || userRole === "SUPERADMIN") ? input.customOwnerName : null,
      },
    });
  });
}

function assertCategoryIsOpenForRegistration(status: EntityStatus, registrationDeadline: Date) {
  if (status !== EntityStatus.PUBLISHED) {
    throw new AppError("Esta categoria não está com inscrições abertas.", 400, "CATEGORY_NOT_OPEN");
  }
  if (registrationDeadline < new Date()) {
    throw new AppError("O prazo de inscrição para esta categoria já encerrou.", 400, "REGISTRATION_DEADLINE_PASSED");
  }
}

async function expireStaleReservations(tx: Prisma.TransactionClient, categoryId: string) {
  const now = new Date();

  await tx.registration.updateMany({
    where: { categoryId, status: "PENDING_PAYMENT", reservedUntil: { lt: now } },
    data: { status: "EXPIRED" },
  });

  await tx.team.updateMany({
    where: { categoryId, status: "PENDING_PAYMENT", reservedUntil: { lt: now } },
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
    include: { category: true },
  });
  if (!registration) {
    throw new AppError("Inscrição não encontrada.", 404, "REGISTRATION_NOT_FOUND");
  }
  if (registration.userId !== userId) {
    throw new AppError("Você não pode cancelar uma inscrição que não é sua.", 403, "FORBIDDEN");
  }

  assertNotYetConfirmed(registration.status);
  await assertWithinCancellationWindow(registration.category.tournamentId, registration.category.cancellationDeadlineHours);

  return prisma.registration.update({ where: { id: registrationId }, data: { status: "CANCELLED" } });
}

export async function cancelOwnTeam(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId }, include: { category: true } });
  if (!team) {
    throw new AppError("Inscrição de dupla não encontrada.", 404, "TEAM_NOT_FOUND");
  }
  if (team.ownerUserId !== userId) {
    throw new AppError("Você não pode cancelar uma inscrição que não é sua.", 403, "FORBIDDEN");
  }

  assertNotYetConfirmed(team.status);
  await assertWithinCancellationWindow(team.category.tournamentId, team.category.cancellationDeadlineHours);

  return prisma.team.update({ where: { id: teamId }, data: { status: "CANCELLED" } });
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

async function assertWithinCancellationWindow(tournamentId: string, cancellationDeadlineHours: number) {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return;
  const deadline = new Date(tournament.eventDate.getTime() - cancellationDeadlineHours * 60 * 60 * 1000);
  if (new Date() > deadline) {
    throw new AppError(
      "O prazo para cancelamento já passou. Entre em contato com o organizador.",
      400,
      "CANCELLATION_DEADLINE_PASSED"
    );
  }
}

// ---------------------------------------------------------------------------
// ADMIN REMOVAL (RF13)
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

export async function updateTeamPartnerName(teamId: string, input: { partnerName?: string; customOwnerName?: string }) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    throw new AppError("Inscrição de dupla não encontrada.", 404, "TEAM_NOT_FOUND");
  }
  return prisma.team.update({
    where: { id: teamId },
    data: {
      partnerName: input.partnerName !== undefined ? input.partnerName : team.partnerName,
      customOwnerName: input.customOwnerName !== undefined ? input.customOwnerName : team.customOwnerName,
    }
  });
}

export async function updateRegistrationPlayerName(registrationId: string, input: { customPlayerName: string }) {
  const registration = await prisma.registration.findUnique({ where: { id: registrationId } });
  if (!registration) {
    throw new AppError("Inscrição não encontrada.", 404, "REGISTRATION_NOT_FOUND");
  }
  return prisma.registration.update({
    where: { id: registrationId },
    data: {
      customPlayerName: input.customPlayerName,
    }
  });
}

// ---------------------------------------------------------------------------
// LIST MY REGISTRATIONS
// ---------------------------------------------------------------------------

export async function listMyRegistrations(userId: string) {
  const [registrations, teams] = await prisma.$transaction([
    prisma.registration.findMany({
      where: { userId },
      include: {
        category: {
          select: { id: true, name: true, format: true, tournament: { select: { id: true, name: true, eventDate: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.team.findMany({
      where: { ownerUserId: userId },
      include: {
        category: {
          select: { id: true, name: true, format: true, tournament: { select: { id: true, name: true, eventDate: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { registrations, teams };
}
