"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
// AppError represents any *expected* error in the business logic
// (e.g. "tournament not found", "registration deadline passed").
// Unexpected errors (bugs, DB connection issues) are NOT AppError instances,
// and are handled separately in errorHandler.ts as 500 Internal Server Error.
class AppError extends Error {
    statusCode;
    code;
    constructor(message, statusCode = 400, code = "BAD_REQUEST") {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=AppError.js.map