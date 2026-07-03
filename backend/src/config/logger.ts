import pino from "pino";
import { env } from "./env";

// In development we use pino-pretty for human-readable colored logs.
// In production, logs are plain JSON so they can be collected by any
// log aggregation tool (Datadog, CloudWatch, etc.) without extra parsing.
export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
});
