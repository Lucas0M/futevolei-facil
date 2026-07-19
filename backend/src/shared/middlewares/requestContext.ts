import { Request, Response, NextFunction } from "express";
import { requestContextStorage, RequestContext } from "../utils/requestContext";

export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Capture client IP address (supporting proxy headers)
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    undefined;

  const userAgent = req.headers["user-agent"];

  const context: RequestContext = {
    ip,
    userAgent,
  };

  // Bind the context to the Request object as well for easy mutation
  req.context = context;

  requestContextStorage.run(context, () => {
    next();
  });
}
