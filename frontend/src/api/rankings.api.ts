import { httpClient } from "./httpClient";

export interface DuoRankingEntry {
  id: string;
  playerAName: string;
  playerBName: string;
  wins: number;
  points: number;
  duoType: "MALE" | "FEMALE" | "MIXED";
  photoUrlA?: string | null;
  photoUrlB?: string | null;
  updatedAt: string;
}

export interface IndividualRankingEntry {
  id: string;
  playerName: string;
  wins: number;
  points: number;
  gender: "MALE" | "FEMALE";
  photoUrl?: string | null;
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

export async function saveDuoRankingManual(
  playerAName: string,
  playerBName: string,
  wins: number,
  points: number,
): Promise<any> {
  const { data } = await httpClient.post<any>("/rankings/duo/manual", {
    playerAName,
    playerBName,
    wins,
    points,
  });
  return data;
}

export async function saveIndividualRankingManual(
  playerName: string,
  wins: number,
  points: number,
): Promise<any> {
  const { data } = await httpClient.post<any>("/rankings/individual/manual", {
    playerName,
    wins,
    points,
  });
  return data;
}

export async function getFeminineRankings(): Promise<IndividualRankingEntry[]> {
  const { data } = await httpClient.get<IndividualRankingEntry[]>("/rankings/feminine");
  return data;
}

export async function saveFeminineRankingManual(
  playerName: string,
  wins: number,
  points: number,
): Promise<any> {
  const { data } = await httpClient.post<any>("/rankings/feminine/manual", {
    playerName,
    wins,
    points,
  });
  return data;
}

export async function deleteDuoRanking(id: string): Promise<void> {
  await httpClient.delete(`/rankings/duo/${id}`);
}

export async function deleteIndividualRanking(id: string): Promise<void> {
  await httpClient.delete(`/rankings/individual/${id}`);
}

export async function deleteFeminineRanking(id: string): Promise<void> {
  await httpClient.delete(`/rankings/feminine/${id}`);
}
