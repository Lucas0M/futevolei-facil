import { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}

// This file has no exports on purpose - it only augments the global
// Express namespace via declaration merging.
export {};
