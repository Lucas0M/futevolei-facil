"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = getDashboardSummary;
const client_1 = require("@prisma/client");
const client_2 = require("../../prisma/client");
// RF20 - aggregated metrics for the admin dashboard. Covers the WHOLE
// platform, since there is no admin hierarchy.
async function getDashboardSummary() {
    const [activeTournaments, confirmedRegistrationsCount, confirmedTeamsCount, confirmedRevenueAgg, pendingRegistrationRevenueAgg, pendingTeamRevenueAgg, pendingRegistrations, pendingTeams, bracketCategoriesSource,] = await client_2.prisma.$transaction([
        client_2.prisma.tournament.count({
            where: {
                status: {
                    in: [client_1.EntityStatus.PUBLISHED, client_1.EntityStatus.REGISTRATIONS_CLOSED],
                },
            },
        }),
        client_2.prisma.registration.count({ where: { status: "CONFIRMED" } }),
        client_2.prisma.team.count({ where: { status: "CONFIRMED" } }),
        client_2.prisma.payment.aggregate({
            _sum: { amount: true },
            where: { status: "APPROVED" },
        }),
        client_2.prisma.registration.aggregate({
            _sum: { amountDue: true },
            where: { status: "PENDING_PAYMENT" },
        }),
        client_2.prisma.team.aggregate({
            _sum: { amountDue: true },
            where: { status: "PENDING_PAYMENT" },
        }),
        client_2.prisma.registration.findMany({
            where: { status: "PENDING_PAYMENT" },
            include: {
                user: { select: { name: true } },
                category: {
                    select: { name: true, tournament: { select: { name: true } } },
                },
            },
            orderBy: { createdAt: "asc" },
        }),
        client_2.prisma.team.findMany({
            where: { status: "PENDING_PAYMENT" },
            include: {
                ownerUser: { select: { name: true } },
                category: {
                    select: { name: true, tournament: { select: { name: true } } },
                },
            },
            orderBy: { createdAt: "asc" },
        }),
        client_2.prisma.category.findMany({
            where: {
                status: {
                    in: [client_1.EntityStatus.PUBLISHED, client_1.EntityStatus.REGISTRATIONS_CLOSED],
                },
            },
            include: {
                tournament: { select: { name: true, eventDate: true } },
                registrations: { where: { status: "CONFIRMED" }, select: { id: true } },
                teams: { where: { status: "CONFIRMED" }, select: { id: true } },
            },
            orderBy: [{ tournament: { eventDate: "asc" } }, { name: "asc" }],
        }),
    ]);
    const confirmedRevenue = confirmedRevenueAgg._sum.amount ?? 0;
    const pendingRevenue = (pendingRegistrationRevenueAgg._sum.amountDue ?? 0).valueOf();
    const pendingTeamRevenue = (pendingTeamRevenueAgg._sum.amountDue ?? 0).valueOf();
    const bracketCandidates = bracketCategoriesSource
        .map((category) => {
        const confirmedEntriesCount = category.registrations.length + category.teams.length;
        return {
            id: category.id,
            tournamentName: category.tournament.name,
            tournamentDate: category.tournament.eventDate,
            categoryName: category.name,
            format: category.format,
            status: category.status,
            confirmedEntriesCount,
            isReady: confirmedEntriesCount >= 2,
        };
    })
        .filter((category) => category.isReady);
    const pendingConfirmations = [
        ...pendingRegistrations.map((r) => ({
            kind: "registration",
            id: r.id,
            tournamentName: `${r.category.tournament.name} - ${r.category.name}`,
            playerName: r.customPlayerName ?? r.user.name,
            amountDue: r.amountDue,
            createdAt: r.createdAt,
        })),
        ...pendingTeams.map((t) => ({
            kind: "team",
            id: t.id,
            tournamentName: `${t.category.tournament.name} - ${t.category.name}`,
            playerName: `${t.customOwnerName ?? t.ownerUser.name} + ${t.partnerName}`,
            amountDue: t.amountDue,
            createdAt: t.createdAt,
        })),
    ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return {
        activeTournaments,
        confirmedEntriesCount: confirmedRegistrationsCount + confirmedTeamsCount,
        confirmedRevenue,
        pendingRevenue: Number(pendingRevenue) + Number(pendingTeamRevenue),
        pendingConfirmations,
        bracketCandidates,
    };
}
//# sourceMappingURL=dashboard.service.js.map