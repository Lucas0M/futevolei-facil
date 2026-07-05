import { httpClient } from "./httpClient";
import type { Registration, Team } from "../types/api.types";

export async function createRegistration(
  tournamentId: string,
  body: { partnerName?: string } = {}
): Promise<Registration | Team> {
  const { data } = await httpClient.post(`/tournaments/${tournamentId}/registrations`, body);
  return data;
}

export async function listMyRegistrations(): Promise<{ registrations: Registration[]; teams: Team[] }> {
  const { data } = await httpClient.get("/registrations/me");
  return data;
}

export async function cancelRegistration(registrationId: string): Promise<Registration> {
  const { data } = await httpClient.delete(`/registrations/${registrationId}`);
  return data;
}

export async function cancelTeam(teamId: string): Promise<Team> {
  const { data } = await httpClient.delete(`/teams/${teamId}`);
  return data;
}
