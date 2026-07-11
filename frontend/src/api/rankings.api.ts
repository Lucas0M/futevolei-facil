import { httpClient } from "./httpClient";

export interface DuoRankingEntry {
  id: string;
  playerAName: string;
  playerBName: string;
  wins: number;
  points: number;
  updatedAt: string;
}

export interface IndividualRankingEntry {
  id: string;
  playerName: string;
  wins: number;
  points: number;
  updatedAt: string;
}

export async function getDuoRankings(): Promise<DuoRankingEntry[]> {
  const { data } = await httpClient.get<DuoRankingEntry[]>("/rankings/duo");
  return data;
}

export async function getIndividualRankings(): Promise<IndividualRankingEntry[]> {
  const { data } = await httpClient.get<IndividualRankingEntry[]>("/rankings/individual");
  return data;
}
