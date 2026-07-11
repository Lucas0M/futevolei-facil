import { httpClient } from "./httpClient";
import type { Registration, Team } from "../types/api.types";

export type TeamPaymentPortion = "FULL" | "OWNER_SHARE" | "PARTNER_SHARE";

export async function confirmRegistrationPayment(registrationId: string): Promise<Registration> {
  const { data } = await httpClient.post(`/registrations/${registrationId}/confirm-payment`);
  return data;
}

export async function confirmTeamPayment(teamId: string, portion: TeamPaymentPortion): Promise<Team> {
  const { data } = await httpClient.post(`/teams/${teamId}/confirm-payment`, { portion });
  return data;
}

export async function checkoutRegistration(registrationId: string): Promise<{ checkoutUrl: string }> {
  const { data } = await httpClient.post<{ checkoutUrl: string }>(`/registrations/${registrationId}/checkout`);
  return data;
}

export async function checkoutTeam(teamId: string, portion: TeamPaymentPortion): Promise<{ checkoutUrl: string }> {
  const { data } = await httpClient.post<{ checkoutUrl: string }>(`/teams/${teamId}/checkout`, { portion });
  return data;
}
