import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./shared/middlewares/errorHandler";
import { authRoutes } from "./modules/auth/auth.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { tournamentsRoutes } from "./modules/tournaments/tournaments.routes";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json());

  // Simple health check, useful to confirm the server is up
  // (and later, for Docker/deploy health checks).
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/tournaments", tournamentsRoutes);

  // Error handler must always be the LAST middleware registered.
  app.use(errorHandler);

  return app;
}
