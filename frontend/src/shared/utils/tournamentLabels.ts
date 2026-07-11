import type { TournamentFormat, TournamentStatus } from "../../types/api.types";

// Centralizes the Portuguese labels shown in the UI, so every screen
// (list, detail, admin forms) uses the exact same wording.
export function formatLabel(format: TournamentFormat): string {
  switch (format) {
    case "INDIVIDUAL":
      return "Individual";
    case "DUO_FIXED":
      return "Dupla formada";
    case "DUO_RANDOM":
      return "Dupla sorteada";
  }
}

// maxSlots/occupiedSlots represent PLAYERS for INDIVIDUAL/DUO_RANDOM,
// but TEAMS for DUO_FIXED - see tournaments.service.ts on the backend.
export function slotsUnitLabel(format: TournamentFormat, count: number): string {
  const isPlural = count !== 1;
  if (format === "DUO_FIXED") {
    return isPlural ? "duplas" : "dupla";
  }
  return isPlural ? "jogadores" : "jogador";
}

export function statusLabel(status: TournamentStatus): string {
  switch (status) {
    case "DRAFT":
      return "Rascunho";
    case "PUBLISHED":
      return "Inscrições abertas";
    case "REGISTRATIONS_CLOSED":
      return "Inscrições encerradas";
    case "CANCELLED":
      return "Cancelado";
    case "FINISHED":
      return "Finalizado";
  }
}

export function statusBadgeClasses(status: TournamentStatus): string {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-700";
    case "PUBLISHED":
      return "bg-green-100 text-green-700";
    case "REGISTRATIONS_CLOSED":
      return "bg-yellow-100 text-yellow-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "FINISHED":
      return "bg-blue-100 text-blue-700";
  }
}
