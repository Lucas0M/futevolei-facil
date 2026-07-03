// AppError represents any *expected* error in the business logic
// (e.g. "tournament not found", "registration deadline passed").
// Unexpected errors (bugs, DB connection issues) are NOT AppError instances,
// and are handled separately in errorHandler.ts as 500 Internal Server Error.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
