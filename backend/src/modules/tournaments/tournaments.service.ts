import { Prisma, TournamentStatus, UserRole } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AppError } from "../../shared/errors/AppError";
import { CreateTournamentInput, UpdateTournamentInput, ListTournamentsQuery } from "./tournaments.schema";

// RF06 - a tournament is always created as DRAFT; the admin publishes it
// explicitly later via publishTournament().
export async function createTournament(adminId: string, input: CreateTournamentInput) {
  const tournament = await prisma.tournament.create({
    data: {
      ...input,
      status: TournamentStatus.DRAFT,
      createdById: adminId,
    },
  });

  return tournament;
}

// RF07 - editing a tournament. The `format` field is intentionally not
// accepted here: it is fixed at creation time and can never change,
// since changing it after registrations exist would break slot-counting logic.
export async function updateTournament(tournamentId: string, input: UpdateTournamentInput) {
  const tournament = await findTournamentOrThrow(tournamentId);

  if (tournament.status === TournamentStatus.CANCELLED) {
    throw new AppError("Não é possível editar um torneio cancelado.", 400, "TOURNAMENT_CANCELLED");
  }

  const updated = await prisma.tournament.update({
    where: { id: tournamentId },
    data: input,
  });

  return updated;
}

// RF07 - cancelling a tournament (soft: status = CANCELLED, record is kept).
export async function cancelTournament(tournamentId: string) {
  const tournament = await findTournamentOrThrow(tournamentId);

  if (tournament.status === TournamentStatus.CANCELLED) {
    throw new AppError("Este torneio já está cancelado.", 400, "TOURNAMENT_ALREADY_CANCELLED");
  }

  // RN07 (marking confirmed registrations for refund + notifying players)
  // will be implemented together with the Payments module. For now we only
  // flip the tournament status.
  const updated = await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: TournamentStatus.CANCELLED },
  });

  return updated;
}

// Admin-only action: DRAFT -> PUBLISHED, making the tournament visible to players.
export async function publishTournament(tournamentId: string) {
  const tournament = await findTournamentOrThrow(tournamentId);

  if (tournament.status !== TournamentStatus.DRAFT) {
    throw new AppError("Apenas torneios em rascunho podem ser publicados.", 400, "INVALID_STATUS_TRANSITION");
  }

  return prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: TournamentStatus.PUBLISHED },
  });
}

interface ListTournamentsParams extends ListTournamentsQuery {
  requesterRole: UserRole;
}

// RF08 - paginated listing with filters (RNF10).
// Non-admin users never see DRAFT tournaments (those are only visible to admins).
export async function listTournaments({
  page,
  pageSize,
  status,
  category,
  fromDate,
  toDate,
  requesterRole,
}: ListTournamentsParams) {
  const where: Prisma.TournamentWhereInput = {};

  if (requesterRole !== "ADMIN") {
    where.status = { not: TournamentStatus.DRAFT };
  }

  // If a specific status was requested, it narrows down (or overrides,
  // for admins) the visibility filter above.
  if (status) {
    where.status = status;
  }

  if (category) {
    where.category = { contains: category, mode: "insensitive" };
  }

  if (fromDate || toDate) {
    where.eventDate = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {}),
    };
  }

  const [tournaments, total] = await prisma.$transaction([
    prisma.tournament.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { eventDate: "asc" },
    }),
    prisma.tournament.count({ where }),
  ]);

  return {
    data: tournaments,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

// RF09 - public detail view. Registrant list is intentionally minimal
// (name + confirmation status only) to comply with RN10 (no email/phone exposed).
export async function getTournamentDetail(tournamentId: string, requesterRole: UserRole) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      registrations: {
        select: {
          status: true,
          user: { select: { name: true } },
        },
      },
      teams: {
        select: {
          status: true,
          partnerName: true,
          ownerUser: { select: { name: true } },
        },
      },
    },
  });

  if (!tournament) {
    throw new AppError("Torneio não encontrado.", 404, "TOURNAMENT_NOT_FOUND");
  }

  if (tournament.status === TournamentStatus.DRAFT && requesterRole !== "ADMIN") {
    throw new AppError("Torneio não encontrado.", 404, "TOURNAMENT_NOT_FOUND");
  }

  const occupiedSlots =
    tournament.format === "DUO_FIXED"
      ? tournament.teams.filter((t) => t.status === "PENDING_PAYMENT" || t.status === "CONFIRMED").length
      : tournament.registrations.filter((r) => r.status === "PENDING_PAYMENT" || r.status === "CONFIRMED").length;

  return {
    id: tournament.id,
    name: tournament.name,
    description: tournament.description,
    eventDate: tournament.eventDate,
    location: tournament.location,
    category: tournament.category,
    format: tournament.format,
    entryFee: tournament.entryFee,
    maxSlots: tournament.maxSlots,
    occupiedSlots,
    availableSlots: Math.max(tournament.maxSlots - occupiedSlots, 0), // RN08
    registrationDeadline: tournament.registrationDeadline,
    status: tournament.status,
    // Minimal, non-sensitive registrant info only (RN10).
    registrants:
      tournament.format === "DUO_FIXED"
        ? tournament.teams.map((t) => ({
            ownerName: t.ownerUser.name,
            partnerName: t.partnerName,
            status: t.status,
          }))
        : tournament.registrations.map((r) => ({
            name: r.user.name,
            status: r.status,
          })),
  };
}

async function findTournamentOrThrow(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) {
    throw new AppError("Torneio não encontrado.", 404, "TOURNAMENT_NOT_FOUND");
  }
  return tournament;
}
