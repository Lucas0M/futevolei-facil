import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

// Used on public routes that still want to know WHO is asking (e.g. to hide
// admin-only DRAFT tournaments), without requiring login to view them at all.
// Unlike `authenticate`, this never throws - an invalid/missing token just
// means the request continues as an anonymous visitor.
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    try {
      const payload = verifyToken(token);
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      // Invalid/expired token on a public route: ignore and treat as anonymous.
    }
  }

  next();
}
