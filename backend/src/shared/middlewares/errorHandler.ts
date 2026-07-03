import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";
import { logger } from "../../config/logger";

// Standard error response shape used across ALL endpoints, so the frontend
// can rely on a single format instead of guessing per-route.
// {
//   "error": {
//     "code": "STRING_CODE",
//     "message": "Human readable message (in Portuguese, shown to the user)",
//     "details": [ ... optional validation details ... ]
//   }
// }
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        details: err.flatten().fieldErrors,
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Anything else is unexpected: log the full error for debugging,
  // but never leak internal details to the client.
  logger.error({ err }, "Unexpected error");

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
    },
  });
}
