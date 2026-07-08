"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTournament = createTournament;
exports.updateTournament = updateTournament;
exports.cancelTournament = cancelTournament;
exports.publishTournament = publishTournament;
exports.listTournaments = listTournaments;
exports.getTournamentDetail = getTournamentDetail;
const client_1 = require("@prisma/client");
const client_2 = require("../../prisma/client");
const AppError_1 = require("../../shared/errors/AppError");
// Tournaments are now just the umbrella event - all competition rules
// (format, fee, slots, deadlines) live on Category. See categories.service.ts.
async function createTournament(adminId, input) {
    return client_2.prisma.tournament.create({
        data: {
            ...input,
            status: client_1.EntityStatus.DRAFT,
            createdById: adminId,
        },
    });
}
async function updateTournament(tournamentId, input) {
    const tournament = await findTournamentOrThrow(tournamentId);
    if (tournament.status === client_1.EntityStatus.CANCELLED) {
        throw new AppError_1.AppError("Não é possível editar um torneio cancelado.", 400, "TOURNAMENT_CANCELLED");
    }
    return client_2.prisma.tournament.update({ where: { id: tournamentId }, data: input });
}
async function cancelTournament(tournamentId) {
    const tournament = await findTournamentOrThrow(tournamentId);
    if (tournament.status === client_1.EntityStatus.CANCELLED) {
        throw new AppError_1.AppError("Este torneio já está cancelado.", 400, "TOURNAMENT_ALREADY_CANCELLED");
    }
    // Cancelling the whole event also cancels every category inside it, so
    // registrations/teams don't remain open on a tournament that no longer exists.
    return client_2.prisma.$transaction(async (tx) => {
        await tx.category.updateMany({
            where: { tournamentId, status: { not: client_1.EntityStatus.CANCELLED } },
            data: { status: client_1.EntityStatus.CANCELLED },
        });
        return tx.tournament.update({ where: { id: tournamentId }, data: { status: client_1.EntityStatus.CANCELLED } });
    });
}
async function publishTournament(tournamentId) {
    const tournament = await findTournamentOrThrow(tournamentId);
    if (tournament.status !== client_1.EntityStatus.DRAFT) {
        throw new AppError_1.AppError("Apenas torneios em rascunho podem ser publicados.", 400, "INVALID_STATUS_TRANSITION");
    }
    return client_2.prisma.tournament.update({ where: { id: tournamentId }, data: { status: client_1.EntityStatus.PUBLISHED } });
}
async function listTournaments({ page, pageSize, status, fromDate, toDate, requesterRole }) {
    const where = {};
    if (requesterRole !== "ADMIN") {
        where.status = { not: client_1.EntityStatus.DRAFT };
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
    const [tournaments, total] = await client_2.prisma.$transaction([
        client_2.prisma.tournament.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { eventDate: "asc" } }),
        client_2.prisma.tournament.count({ where }),
    ]);
    return { data: tournaments, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}
// Detail view includes the list of categories (each with basic slot info),
// so the player can pick which category to register for.
async function getTournamentDetail(tournamentId, requesterRole) {
    const tournament = await client_2.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            categories: {
                include: { registrations: { select: { status: true } }, teams: { select: { status: true } } },
            },
        },
    });
    if (!tournament) {
        throw new AppError_1.AppError("Torneio não encontrado.", 404, "TOURNAMENT_NOT_FOUND");
    }
    if (tournament.status === client_1.EntityStatus.DRAFT && requesterRole !== "ADMIN") {
        throw new AppError_1.AppError("Torneio não encontrado.", 404, "TOURNAMENT_NOT_FOUND");
    }
    const visibleCategories = requesterRole === "ADMIN"
        ? tournament.categories
        : tournament.categories.filter((c) => c.status !== client_1.EntityStatus.DRAFT);
    return {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        eventDate: tournament.eventDate,
        location: tournament.location,
        status: tournament.status,
        categories: visibleCategories.map((c) => {
            const occupiedSlots = c.format === "DUO_FIXED"
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
async function findTournamentOrThrow(tournamentId) {
    const tournament = await client_2.prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
        throw new AppError_1.AppError("Torneio não encontrado.", 404, "TOURNAMENT_NOT_FOUND");
    }
    return tournament;
}
//# sourceMappingURL=tournaments.service.js.map