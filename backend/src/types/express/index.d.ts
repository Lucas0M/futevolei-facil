import { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
      context?: {
        userId?: string;
        userRole?: UserRole;
        ip?: string;
        userAgent?: string;
      };
    }
  }
}

// This file has no exports on purpose - it only augments the global
// Express namespace via declaration merging.
export {};
