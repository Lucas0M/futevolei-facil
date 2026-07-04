import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { UserRole } from "@prisma/client";

// Payload embedded in the JWT. Kept minimal on purpose: the token is used
// only to identify who is making the request and their role, never as a
// source of truth for other user data (that always comes from the database).
export interface JwtPayload {
  sub: string; // user id
  role: UserRole;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
