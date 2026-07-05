import { httpClient } from "./httpClient";
import type { PaginatedResult, Tournament, TournamentDetail, TournamentStatus } from "../types/api.types";

export interface ListTournamentsParams {
  page?: number;
  pageSize?: number;
  status?: TournamentStatus;
  category?: string;
  fromDate?: string;
  toDate?: string;
}

export async function listTournaments(params: ListTournamentsParams): Promise<PaginatedResult<Tournament>> {
  const { data } = await httpClient.get<PaginatedResult<Tournament>>("/tournaments", { params });
  return data;
}

export async function getTournamentDetail(tournamentId: string): Promise<TournamentDetail> {
  const { data } = await httpClient.get<TournamentDetail>(`/tournaments/${tournamentId}`);
  return data;
}
