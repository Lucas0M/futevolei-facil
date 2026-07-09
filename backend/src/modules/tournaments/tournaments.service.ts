import { Prisma, EntityStatus, UserRole } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AppError } from "../../shared/errors/AppError";
import { CreateTournamentInput, UpdateTournamentInput, ListTournamentsQuery } from "./tournaments.schema";

// Tournaments are now just the umbrella event - all competition rules
// (format, fee, slots, deadlines) live on Category. See categories.service.ts.

export async function createTournament(adminId: string, input: CreateTournamentInput) {
  return prisma.tournament.create({
    data: {
      ...input,
      status: EntityStatus.DRAFT,
      createdById: adminId,
    },
  });
}

export async function updateTournament(tournamentId: string, input: UpdateTournamentInput) {
  const tournament = await findTournamentOrThrow(tournamentId);

  if (tournament.status === EntityStatus.CANCELLED) {
    throw new AppError("Não é possível editar um torneio cancelado.", 400, "TOURNAMENT_CANCELLED");
  }

  return prisma.tournament.update({ where: { id: tournamentId }, data: input });
}

export async function cancelTournament(tournamentId: string) {
  const tournament = await findTournamentOrThrow(tournamentId);

  if (tournament.status === EntityStatus.CANCELLED) {
    throw new AppError("Este torneio já está cancelado.", 400, "TOURNAMENT_ALREADY_CANCELLED");
  }

  // Cancelling the whole event also cancels every category inside it, so
  // registrations/teams don't remain open on a tournament that no longer exists.
  return prisma.$transaction(async (tx) => {
    await tx.category.updateMany({
      where: { tournamentId, status: { not: EntityStatus.CANCELLED } },
      data: { status: EntityStatus.CANCELLED },
    });

    return tx.tournament.update({ where: { id: tournamentId }, data: { status: EntityStatus.CANCELLED } });
  });
}

export async function publishTournament(tournamentId: string) {
  const tournament = await findTournamentOrThrow(tournamentId);

  if (tournament.status !== EntityStatus.DRAFT) {
    throw new AppError("Apenas torneios em rascunho podem ser publicados.", 400, "INVALID_STATUS_TRANSITION");
  }

  return prisma.tournament.update({ where: { id: tournamentId }, data: { status: EntityStatus.PUBLISHED } });
}

interface ListTournamentsParams extends ListTournamentsQuery {
  requesterRole: UserRole;
}

export async function listTournaments({ page, pageSize, status, fromDate, toDate, requesterRole }: ListTournamentsParams) {
  const where: Prisma.TournamentWhereInput = {};

  if (requesterRole !== "ADMIN") {
    where.status = { not: EntityStatus.DRAFT };
  }
  if (status) {
    where.status = status;
  }
  if (fromDate || toDate) {
    where.eventDate = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {}),
    };
  }

  const [tournaments, total] = await prisma.$transaction([
    prisma.tournament.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { eventDate: "asc" } }),
    prisma.tournament.count({ where }),
  ]);

  return { data: tournaments, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

// Detail view includes the list of categories (each with basic slot info),
// so the player can pick which category to register for.
export async function getTournamentDetail(tournamentId: string, requesterRole: UserRole) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      categories: {
        include: { registrations: { select: { status: true } }, teams: { select: { status: true } } },
      },
    },
  });

  if (!tournament) {
    throw new AppError("Torneio não encontrado.", 404, "TOURNAMENT_NOT_FOUND");
  }
  if (tournament.status === EntityStatus.DRAFT && requesterRole !== "ADMIN") {
    throw new AppError("Torneio não encontrado.", 404, "TOURNAMENT_NOT_FOUND");
  }

  const visibleCategories =
    requesterRole === "ADMIN"
      ? tournament.categories
      : tournament.categories.filter((c) => c.status !== EntityStatus.DRAFT);

  return {
    id: tournament.id,
    name: tournament.name,
    description: tournament.description,
    eventDate: tournament.eventDate,
    location: tournament.location,
    status: tournament.status,
    categories: visibleCategories.map((c) => {
      const occupiedSlots =
        c.format === "DUO_FIXED"
          ? c.teams.filter((t) => t.status === "PENDING_PAYMENT" || t.status === "CONFIRMED").length
          : c.registrations.filter((r) => r.status === "PENDING_PAYMENT" || r.status === "CONFIRMED").length;

      return {
        id: c.id,
        name: c.name,
        format: c.format,
        entryFee: c.entryFee,
        maxSlots: c.maxSlots,
        occupiedSlots,
        availableSlots: Math.max(c.maxSlots - occupiedSlots, 0),
        registrationDeadline: c.registrationDeadline,
        status: c.status,
      };
    }),
  };
}

async function findTournamentOrThrow(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) {
    throw new AppError("Torneio não encontrado.", 404, "TOURNAMENT_NOT_FOUND");
  }
  return tournament;
}

export async function getTournamentPendingPayments(tournamentId: string) {
  const tournament = await findTournamentOrThrow(tournamentId);

  const [pendingRegistrations, pendingTeams] = await prisma.$transaction([
    prisma.registration.findMany({
      where: { 
        status: "PENDING_PAYMENT",
        category: { tournamentId }
      },
      include: {
        user: { select: { name: true } },
        category: {
          select: { name: true, tournament: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.team.findMany({
      where: { 
        status: "PENDING_PAYMENT",
        category: { tournamentId }
      },
      include: {
        ownerUser: { select: { name: true } },
        category: {
          select: { name: true, tournament: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const pendingConfirmations = [
    ...pendingRegistrations.map((r) => ({
      kind: "registration" as const,
      id: r.id,
      tournamentName: `${r.category.tournament.name} - ${r.category.name}`,
      playerName: r.user.name,
      amountDue: r.amountDue,
      createdAt: r.createdAt,
    })),
    ...pendingTeams.map((t) => ({
      kind: "team" as const,
      id: t.id,
      tournamentName: `${t.category.tournament.name} - ${t.category.name}`,
      playerName: `${t.ownerUser.name} + ${t.partnerName}`,
      amountDue: t.amountDue,
      createdAt: t.createdAt,
    })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return pendingConfirmations;
}
