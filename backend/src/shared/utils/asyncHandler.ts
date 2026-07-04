import { Request, Response, NextFunction, RequestHandler } from "express";

// Express 4 does not automatically catch rejected promises thrown inside
// async route handlers - without this wrapper, an error inside an `async`
// controller would crash the process instead of being caught by errorHandler.
export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
