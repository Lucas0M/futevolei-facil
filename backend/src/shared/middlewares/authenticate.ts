import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { AppError } from "../errors/AppError";

// Augments Express's Request type so `req.user` is typed everywhere
// instead of using `any`. See src/types/express/index.d.ts.
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Você precisa estar autenticado.", 401, "UNAUTHENTICATED");
  }

  const token = authHeader.replace("Bearer ", "");

  let payload: JwtPayload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError("Sessão inválida ou expirada. Faça login novamente.", 401, "INVALID_TOKEN");
  }

  req.user = { id: payload.sub, role: payload.role };
  if (req.context) {
    req.context.userId = payload.sub;
    req.context.userRole = payload.role;
  }
  next();
}
