import { prisma } from "../../prisma/client";

// RF20 - aggregated metrics for the admin dashboard. Since there is no admin
// hierarchy (decision already made), these numbers cover the WHOLE platform,
// not just tournaments created by the requesting admin.
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
  ] = await prisma.$transaction([
    prisma.tournament.count({ where: { status: "PUBLISHED" } }),
    prisma.registration.count({ where: { status: "CONFIRMED" } }),
    prisma.team.count({ where: { status: "CONFIRMED" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "APPROVED" } }),
    prisma.registration.aggregate({ _sum: { amountDue: true }, where: { status: "PENDING_PAYMENT" } }),
    prisma.team.aggregate({ _sum: { amountDue: true }, where: { status: "PENDING_PAYMENT" } }),
    // RF20 - "lista de inscrições aguardando confirmação manual": every
    // PENDING_PAYMENT entry is a candidate the admin might confirm manually.
    prisma.registration.findMany({
      where: { status: "PENDING_PAYMENT" },
      include: { user: { select: { name: true } }, tournament: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.team.findMany({
      where: { status: "PENDING_PAYMENT" },
      include: { ownerUser: { select: { name: true } }, tournament: { select: { name: true } } },
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
      tournamentName: r.tournament.name,
      playerName: r.user.name,
      amountDue: r.amountDue,
      createdAt: r.createdAt,
    })),
    ...pendingTeams.map((t) => ({
      kind: "team" as const,
      id: t.id,
      tournamentName: t.tournament.name,
      playerName: `${t.ownerUser.name} + ${t.partnerName}`,
      amountDue: t.amountDue,
      createdAt: t.createdAt,
    })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return {
    activeTournaments,
    confirmedEntriesCount: confirmedRegistrationsCount + confirmedTeamsCount,
    confirmedRevenue,
    // Total money still expected to come in from entries that haven't paid yet.
    pendingRevenue: Number(pendingRevenue) + Number(pendingTeamRevenue),
    pendingConfirmations,
  };
}
