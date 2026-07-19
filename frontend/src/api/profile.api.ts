import { httpClient } from "./httpClient";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "PLAYER";
  avatarUrl?: string | null;
  createdAt: string;
}

export async function getProfile(): Promise<UserProfile> {
  const { data } = await httpClient.get<UserProfile>("/profile");
  return data;
}

export async function updateProfile(data: {
  name: string;
  email: string;
  avatarUrl?: string | null;
}): Promise<UserProfile> {
  const { data: responseData } = await httpClient.put<UserProfile>("/profile", data);
  return responseData;
}

export async function updatePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await httpClient.put("/profile/password", data);
}
