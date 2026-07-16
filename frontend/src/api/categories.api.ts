import { httpClient } from "./httpClient";
import type { GeneratedBracket } from "../types/api.types";
import type { TournamentDetailCategory } from "../types/api.types";

export interface CreateCategoryPayload {
  name: string;
  format: "INDIVIDUAL" | "DUO_FIXED" | "DUO_RANDOM";
  entryFee: number;
  maxSlots: number;
  registrationDeadline: string;
  reservationTtlMinutes?: number;
  refundFullBeforeDays?: number;
  refundPartialBeforeDays?: number;
  refundPartialPercent?: number;
  cancellationDeadlineHours?: number;
}

export async function getCategoryDetail(
  categoryId: string,
): Promise<TournamentDetailCategory> {
  const { data } = await httpClient.get<TournamentDetailCategory>(
    `/categories/${categoryId}`,
  );
  return data;
}

export async function createCategory(
  tournamentId: string,
  payload: CreateCategoryPayload,
): Promise<TournamentDetailCategory> {
  const { data } = await httpClient.post<TournamentDetailCategory>(
    `/tournaments/${tournamentId}/categories`,
    payload,
  );
  return data;
}

export async function publishCategory(
  categoryId: string,
): Promise<TournamentDetailCategory> {
  const { data } = await httpClient.post<TournamentDetailCategory>(
    `/categories/${categoryId}/publish`,
  );
  return data;
}

export async function generateCategoryBracket(
  categoryId: string,
): Promise<GeneratedBracket> {
  const { data } = await httpClient.get<GeneratedBracket>(
    `/categories/${categoryId}/bracket`,
  );
  return data;
}

export async function updateCategory(
  categoryId: string,
  payload: CreateCategoryPayload,
): Promise<TournamentDetailCategory> {
  const { data } = await httpClient.patch<TournamentDetailCategory>(
    `/categories/${categoryId}`,
    payload,
  );
  return data;
}

export async function deleteCategory(
  categoryId: string,
): Promise<TournamentDetailCategory> {
  const { data } = await httpClient.delete<TournamentDetailCategory>(
    `/categories/${categoryId}`,
  );
  return data;
}

export async function generatePersistentBracket(
  categoryId: string,
  bracketStyle?: string,
  numGroups?: number,
): Promise<any> {
  const { data } = await httpClient.post<any>(
    `/categories/${categoryId}/bracket`,
    { bracketStyle, numGroups },
  );
  return data;
}

export async function updateMatchWinner(
  matchId: string,
  winnerId: string,
  score: string,
): Promise<any> {
  const { data } = await httpClient.patch<any>(
    `/categories/matches/${matchId}`,
    { winnerId, score },
  );
  return data;
}

export async function updateMatchManual(
  matchId: string,
  payload: {
    competitorAId?: string | null;
    competitorAName?: string | null;
    competitorBId?: string | null;
    competitorBName?: string | null;
    winnerId?: string | null;
    score?: string | null;
  },
): Promise<any> {
  const { data } = await httpClient.patch<any>(
    `/categories/matches/${matchId}/manual`,
    payload,
  );
  return data;
}

