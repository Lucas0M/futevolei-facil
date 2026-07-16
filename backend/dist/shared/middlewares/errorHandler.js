"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const AppError_1 = require("../errors/AppError");
const logger_1 = require("../../config/logger");
// Standard error response shape used across ALL endpoints, so the frontend
// can rely on a single format instead of guessing per-route.
// {
//   "error": {
//     "code": "STRING_CODE",
//     "message": "Human readable message (in Portuguese, shown to the user)",
//     "details": [ ... optional validation details ... ]
//   }
// }
function errorHandler(err, _req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    if (err instanceof zod_1.ZodError) {
        return res.status(422).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Dados inválidos.",
                details: err.flatten().fieldErrors,
            },
        });
    }
    if (err instanceof AppError_1.AppError) {
        return res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
            },
        });
    }
    // Anything else is unexpected: log the full error for debugging,
    // but never leak internal details to the client.
    logger_1.logger.error({ err }, "Unexpected error");
    return res.status(500).json({
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        },
    });
}
//# sourceMappingURL=errorHandler.js.map