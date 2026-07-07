import { httpClient } from "./httpClient";
import type { DashboardSummary } from "../types/api.types";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await httpClient.get<DashboardSummary>("/admin/dashboard");
  return data;
}
