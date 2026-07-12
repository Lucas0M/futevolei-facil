import { httpClient } from "./httpClient";
import type { Registration, Team } from "../types/api.types";

export async function createRegistration(
  categoryId: string,
  body: { partnerName?: string; customOwnerName?: string; customPlayerName?: string } = {},
): Promise<Registration | Team> {
  const { data } = await httpClient.post(
    `/categories/${categoryId}/registrations`,
    body,
  );
  return data;
}

export async function listMyRegistrations(): Promise<{
  registrations: Registration[];
  teams: Team[];
}> {
  const { data } = await httpClient.get("/registrations/me");
  return data;
}

export async function cancelRegistration(
  registrationId: string,
): Promise<Registration> {
  const { data } = await httpClient.delete(`/registrations/${registrationId}`);
  return data;
}

export async function cancelTeam(teamId: string): Promise<Team> {
  const { data } = await httpClient.delete(`/teams/${teamId}`);
  return data;
}

export async function adminCancelTeam(teamId: string): Promise<Team> {
  const { data } = await httpClient.delete(`/teams/${teamId}/admin`);
  return data;
}

export async function adminCancelRegistration(registrationId: string): Promise<Registration> {
  const { data } = await httpClient.delete(`/registrations/${registrationId}/admin`);
  return data;
}

export async function adminUpdateTeam(
  teamId: string,
  body: { partnerName?: string; customOwnerName?: string }
): Promise<Team> {
  const { data } = await httpClient.patch(`/teams/${teamId}/admin`, body);
  return data;
}

export async function adminUpdateRegistration(
  registrationId: string,
  body: { customPlayerName: string }
): Promise<Registration> {
  const { data } = await httpClient.patch(`/registrations/${registrationId}/admin`, body);
  return data;
}
