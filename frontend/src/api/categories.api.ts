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
