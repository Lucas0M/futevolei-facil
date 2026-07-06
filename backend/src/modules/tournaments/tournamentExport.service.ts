import { prisma } from "../../prisma/client";
import { AppError } from "../../shared/errors/AppError";

// RF21 - CSV export of a tournament's registrants, for use on event day
// (check-in, bracket draw, etc). Returns the raw CSV as a string; the
// controller is responsible for setting the right response headers.
export async function exportTournamentRegistrantsCsv(tournamentId: string): Promise<string> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      registrations: { include: { user: true } },
      teams: { include: { ownerUser: true } },
    },
  });

  if (!tournament) {
    throw new AppError("Torneio não encontrado.", 404, "TOURNAMENT_NOT_FOUND");
  }

  const rows: string[] = [];

  if (tournament.format === "DUO_FIXED") {
    rows.push("Dono da dupla,E-mail do dono,Telefone do dono,Nome do parceiro,Status,Valor devido");
    for (const team of tournament.teams) {
      rows.push(
        [
          team.ownerUser.name,
          team.ownerUser.email,
          team.ownerUser.phone ?? "",
          team.partnerName,
          team.status,
          team.amountDue.toString(),
        ]
          .map(escapeCsvField)
          .join(",")
      );
    }
  } else {
    rows.push("Nome,E-mail,Telefone,Status,Valor devido");
    for (const registration of tournament.registrations) {
      rows.push(
        [
          registration.user.name,
          registration.user.email,
          registration.user.phone ?? "",
          registration.status,
          registration.amountDue.toString(),
        ]
          .map(escapeCsvField)
          .join(",")
      );
    }
  }

  return rows.join("\n");
}

// Wraps a field in quotes if it contains a comma, quote, or newline -
// otherwise a name like "Silva, João" would break the CSV columns.
function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
