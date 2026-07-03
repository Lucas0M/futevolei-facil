import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./shared/middlewares/errorHandler";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json());

  // Simple health check, useful to confirm the server is up
  // (and later, for Docker/deploy health checks).
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Feature routes will be mounted here as each module is implemented, e.g.:
  // app.use("/api/auth", authRoutes);
  // app.use("/api/tournaments", tournamentRoutes);

  // Error handler must always be the LAST middleware registered.
  app.use(errorHandler);

  return app;
}
