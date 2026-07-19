import { AsyncLocalStorage } from "async_hooks";
import { UserRole } from "@prisma/client";

export interface RequestContext {
  userId?: string;
  userRole?: UserRole;
  ip?: string;
  userAgent?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}
