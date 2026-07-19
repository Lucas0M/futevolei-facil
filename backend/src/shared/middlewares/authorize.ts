import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { AppError } from "../errors/AppError";

// Usage: router.post("/tournaments", authenticate, authorize("ADMIN"), handler)
// Must always run AFTER `authenticate`, since it relies on req.user.
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Você precisa estar autenticado.", 401, "UNAUTHENTICATED");
    }

    const userRole = req.user.role;
    const hasPermission =
      allowedRoles.includes(userRole) ||
      (userRole === "SUPERADMIN" && allowedRoles.includes("ADMIN"));

    if (!hasPermission) {
      throw new AppError("Você não tem permissão para realizar esta ação.", 403, "FORBIDDEN");
    }

    next();
  };
}
