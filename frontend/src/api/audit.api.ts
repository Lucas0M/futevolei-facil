import { httpClient } from "./httpClient";
import type { AuditLog, PaginatedResult } from "../types/api.types";

export interface GetAuditLogsParams {
  userId?: string;
  action?: string;
  module?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export async function getAuditLogsRequest(
  params: GetAuditLogsParams,
): Promise<PaginatedResult<AuditLog>> {
  const { data } = await httpClient.get<PaginatedResult<AuditLog>>(
    "/admin/audit-logs",
    { params },
  );
  return data;
}
