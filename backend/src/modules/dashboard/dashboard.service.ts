import { EntityStatus } from "@prisma/client";
import { prisma } from "../../prisma/client";

// RF20 - aggregated metrics for the admin dashboard. Covers the WHOLE
// platform, since there is no admin hierarchy.
export async function getDashboardSummary() {
  const [
    activeTournaments,
    confirmedRegistrationsCount,
    confirmedTeamsCount,
    confirmedRevenueAgg,
    pendingRegistrationRevenueAgg,
    pendingTeamRevenueAgg,
    pendingRegistrations,
    pendingTeams,
    bracketCategoriesSource,
  ] = await prisma.$transaction([
    prisma.tournament.count({
      where: {
        status: {
          in: [EntityStatus.PUBLISHED, EntityStatus.REGISTRATIONS_CLOSED],
        },
      },
    }),
    prisma.registration.count({ where: { status: "CONFIRMED" } }),
    prisma.team.count({ where: { status: "CONFIRMED" } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "APPROVED" },
    }),
    prisma.registration.aggregate({
      _sum: { amountDue: true },
      where: { status: "PENDING_PAYMENT" },
    }),
    prisma.team.aggregate({
      _sum: { amountDue: true },
      where: { status: "PENDING_PAYMENT" },
    }),
    prisma.registration.findMany({
      where: { status: "PENDING_PAYMENT" },
      include: {
        user: { select: { name: true } },
        category: {
          select: { name: true, tournament: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.team.findMany({
      where: { status: "PENDING_PAYMENT" },
      include: {
        ownerUser: { select: { name: true } },
        category: {
          select: { name: true, tournament: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.category.findMany({
      where: {
        status: {
          in: [EntityStatus.PUBLISHED, EntityStatus.REGISTRATIONS_CLOSED],
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
  const pendingRevenue = (
    pendingRegistrationRevenueAgg._sum.amountDue ?? 0
  ).valueOf();
  const pendingTeamRevenue = (
    pendingTeamRevenueAgg._sum.amountDue ?? 0
  ).valueOf();

  const bracketCandidates = bracketCategoriesSource
    .map((category) => {
      const confirmedEntriesCount =
        category.registrations.length + category.teams.length;

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
      kind: "registration" as const,
      id: r.id,
      tournamentName: `${r.category.tournament.name} - ${r.category.name}`,
      playerName: r.customPlayerName ?? r.user.name,
      amountDue: r.amountDue,
      createdAt: r.createdAt,
    })),
    ...pendingTeams.map((t) => ({
      kind: "team" as const,
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
