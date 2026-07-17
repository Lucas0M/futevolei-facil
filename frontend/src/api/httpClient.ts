import axios from "axios";
import type { ApiErrorResponse } from "../types/api.types";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export const httpClient = axios.create({
  baseURL: `${API_URL}/api`,
});

// Attaches the JWT (if present) to every outgoing request.
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Extracts the standardized error message from the backend's error format,
// so components can just show `error.message` without repeating this logic.
export function getApiErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro inesperado.",
): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.error?.message ?? fallback;
  }
  return fallback;
}
