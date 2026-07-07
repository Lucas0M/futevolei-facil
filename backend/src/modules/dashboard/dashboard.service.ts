import { prisma } from "../../prisma/client";

// RF20 - aggregated metrics for the admin dashboard. Covers the WHOLE
// platform, since there is no admin hierarchy.
export async function getDashboardSummary() {
  const [
    activeCategories,
    confirmedRegistrationsCount,
    confirmedTeamsCount,
    confirmedRevenueAgg,
    pendingRegistrationRevenueAgg,
    pendingTeamRevenueAgg,
    pendingRegistrations,
    pendingTeams,
  ] = await prisma.$transaction([
    prisma.category.count({ where: { status: "PUBLISHED" } }),
    prisma.registration.count({ where: { status: "CONFIRMED" } }),
    prisma.team.count({ where: { status: "CONFIRMED" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "APPROVED" } }),
    prisma.registration.aggregate({ _sum: { amountDue: true }, where: { status: "PENDING_PAYMENT" } }),
    prisma.team.aggregate({ _sum: { amountDue: true }, where: { status: "PENDING_PAYMENT" } }),
    prisma.registration.findMany({
      where: { status: "PENDING_PAYMENT" },
      include: { user: { select: { name: true } }, category: { select: { name: true, tournament: { select: { name: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.team.findMany({
      where: { status: "PENDING_PAYMENT" },
      include: {
        ownerUser: { select: { name: true } },
        category: { select: { name: true, tournament: { select: { name: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const confirmedRevenue = confirmedRevenueAgg._sum.amount ?? 0;
  const pendingRevenue = (pendingRegistrationRevenueAgg._sum.amountDue ?? 0).valueOf();
  const pendingTeamRevenue = (pendingTeamRevenueAgg._sum.amountDue ?? 0).valueOf();

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

  return {
    activeCategories,
    confirmedEntriesCount: confirmedRegistrationsCount + confirmedTeamsCount,
    confirmedRevenue,
    pendingRevenue: Number(pendingRevenue) + Number(pendingTeamRevenue),
    pendingConfirmations,
  };
}
