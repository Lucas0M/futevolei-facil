import { httpClient } from "./httpClient";
import type { AuthResponse } from "../types/api.types";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function registerRequest(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const { data } = await httpClient.post<AuthResponse>(
    "/auth/register",
    payload,
  );
  return data;
}

export async function loginRequest(
  payload: LoginPayload,
): Promise<AuthResponse> {
  const { data } = await httpClient.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function getCurrentUserRequest(): Promise<AuthResponse["user"]> {
  const { data } = await httpClient.get<AuthResponse["user"]>("/users/me");
  return data;
}

export async function forgotPasswordRequest(email: string): Promise<void> {
  await httpClient.post("/auth/forgot-password", { email });
}

export async function logoutRequest(): Promise<void> {
  await httpClient.post("/auth/logout");
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export async function resetPasswordRequest(payload: ResetPasswordPayload): Promise<void> {
  await httpClient.post("/auth/reset-password", payload);
}

