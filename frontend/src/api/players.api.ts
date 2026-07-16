import { httpClient } from "./httpClient";

export interface Player {
  id: string;
  name: string;
  gender: "MALE" | "FEMALE";
  photoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getPlayers(): Promise<Player[]> {
  const { data } = await httpClient.get<Player[]>("/players");
  return data;
}

export async function createPlayer(name: string, gender: "MALE" | "FEMALE", photoUrl?: string | null): Promise<Player> {
  const { data } = await httpClient.post<Player>("/players", { name, gender, photoUrl });
  return data;
}

export async function updatePlayer(id: string, name: string, gender: "MALE" | "FEMALE", photoUrl?: string | null): Promise<Player> {
  const { data } = await httpClient.put<Player>(`/players/${id}`, { name, gender, photoUrl });
  return data;
}

export async function deletePlayer(id: string): Promise<void> {
  await httpClient.delete(`/players/${id}`);
}
