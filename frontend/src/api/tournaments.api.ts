import { httpClient } from "./httpClient";
import type {
  PaginatedResult,
  Tournament,
  TournamentDetail,
  TournamentFormInput,
  TournamentStatus,
  PendingConfirmationEntry,
} from "../types/api.types";

export interface ListTournamentsParams {
  page?: number;
  pageSize?: number;
  status?: TournamentStatus;
  category?: string;
  fromDate?: string;
  toDate?: string;
}

export async function listTournaments(
  params: ListTournamentsParams,
): Promise<PaginatedResult<Tournament>> {
  const { data } = await httpClient.get<PaginatedResult<Tournament>>(
    "/tournaments",
    { params },
  );
  return data;
}

export async function getTournamentDetail(
  tournamentId: string,
): Promise<TournamentDetail> {
  const { data } = await httpClient.get<TournamentDetail>(
    `/tournaments/${tournamentId}`,
  );
  return data;
}

export async function createTournament(
  payload: TournamentFormInput,
): Promise<Tournament> {
  const { data } = await httpClient.post<Tournament>("/tournaments", payload);
  return data;
}

export async function updateTournament(
  tournamentId: string,
  payload: TournamentFormInput,
): Promise<Tournament> {
  const { data } = await httpClient.patch<Tournament>(
    `/tournaments/${tournamentId}`,
    payload,
  );
  return data;
}

export async function deleteTournament(
  tournamentId: string,
): Promise<Tournament> {
  const { data } = await httpClient.delete<Tournament>(
    `/tournaments/${tournamentId}`,
  );
  return data;
}

export async function publishTournament(
  tournamentId: string,
): Promise<Tournament> {
  const { data } = await httpClient.post<Tournament>(
    `/tournaments/${tournamentId}/publish`,
  );
  return data;
}

export async function getTournamentPendingPayments(
  tournamentId: string,
): Promise<PendingConfirmationEntry[]> {
  const { data } = await httpClient.get<PendingConfirmationEntry[]>(
    `/tournaments/${tournamentId}/pending-payments`,
  );
  return data;
}
