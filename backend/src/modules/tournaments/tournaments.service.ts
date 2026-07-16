import { Prisma, EntityStatus, UserRole } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AppError } from "../../shared/errors/AppError";
import { CreateTournamentInput, UpdateTournamentInput, ListTournamentsQuery } from "./tournaments.schema";
import { formatMatchupNames } from "../categories/categories.service";

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

export async function deleteTournament(tournamentId: string) {
  const tournament = await findTournamentOrThrow(tournamentId);

  return prisma.$transaction(async (tx) => {
    // 1. Get all categories
    const categories = await tx.category.findMany({
      where: { tournamentId },
      select: { id: true },
    });
    const categoryIds = categories.map((c) => c.id);

    if (categoryIds.length > 0) {
      // 2. Get all registrations and teams
      const registrations = await tx.registration.findMany({
        where: { categoryId: { in: categoryIds } },
        select: { id: true },
      });
      const registrationIds = registrations.map((r) => r.id);

      const teams = await tx.team.findMany({
        where: { categoryId: { in: categoryIds } },
        select: { id: true },
      });
      const teamIds = teams.map((t) => t.id);

      // 3. Get all payments
      const payments = await tx.payment.findMany({
        where: {
          OR: [
            { registrationId: { in: registrationIds } },
            { teamId: { in: teamIds } },
          ],
        },
        select: { id: true },
      });
      const paymentIds = payments.map((p) => p.id);

      if (paymentIds.length > 0) {
        // 4. Delete webhook events
        await tx.webhookEvent.deleteMany({
          where: { paymentId: { in: paymentIds } },
        });
        // 5. Delete payments
        await tx.payment.deleteMany({
          where: { id: { in: paymentIds } },
        });
      }

      if (registrationIds.length > 0) {
        await tx.registration.deleteMany({
          where: { id: { in: registrationIds } },
        });
      }

      if (teamIds.length > 0) {
        await tx.team.deleteMany({
          where: { id: { in: teamIds } },
        });
      }

      // 6. Delete categories
      await tx.category.deleteMany({
        where: { id: { in: categoryIds } },
      });
    }

    // 7. Delete tournament
    return tx.tournament.delete({
      where: { id: tournamentId },
    });
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
    if (status) {
      if (status === EntityStatus.DRAFT) {
        where.status = { in: [] }; // Return empty
      } else {
        where.status = status;
      }
    } else {
      where.status = { notIn: [EntityStatus.DRAFT, EntityStatus.CANCELLED] };
    }
  } else {
    if (status) {
      where.status = status;
    }
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
        include: {
          registrations: {
            include: { user: { select: { name: true, email: true } } },
          },
          teams: {
            include: { ownerUser: { select: { name: true, email: true } } },
          },
          matches: {
            orderBy: [{ round: "asc" }, { position: "asc" }],
          },
        },
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
        winnerName: c.winnerName,
        bracketStyle: c.bracketStyle,
        matches: formatMatchupNames(c.matches),
        registrations: requesterRole === "ADMIN" ? c.registrations.map(r => ({
          id: r.id,
          playerName: r.customPlayerName ?? r.user.name,
          email: r.user.email,
          status: r.status,
          amountDue: r.amountDue,
          createdAt: r.createdAt,
        })) : [],
        teams: requesterRole === "ADMIN" ? c.teams.map(t => ({
          id: t.id,
          ownerName: t.customOwnerName ?? t.ownerUser.name,
          partnerName: t.partnerName,
          email: t.ownerUser.email,
          status: t.status,
          amountDue: t.amountDue,
          createdAt: t.createdAt,
        })) : [],
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
