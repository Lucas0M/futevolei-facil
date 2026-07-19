import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env";
import { errorHandler } from "./shared/middlewares/errorHandler";
import { authRoutes } from "./modules/auth/auth.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { tournamentsRoutes } from "./modules/tournaments/tournaments.routes";
import {
  categoriesRoutes,
  tournamentCategoriesRoutes,
} from "./modules/categories/categories.routes";
import { categoryRegistrationsRoutes } from "./modules/registrations/categoryRegistrations.routes";
import { registrationsRoutes } from "./modules/registrations/registrations.routes";
import { teamsRoutes } from "./modules/registrations/teams.routes";
import { paymentsRoutes } from "./modules/payments/payments.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { rankingsRoutes } from "./modules/rankings/rankings.routes";
import { playersRoutes } from "./modules/players/players.routes";
import { requestContextMiddleware } from "./shared/middlewares/requestContext";
import { auditRoutes } from "./modules/audit/audit.routes";
import { profileRoutes } from "./modules/profile/profile.routes";


export function createApp() {
  const app = express();

  const allowedOrigins = [env.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"];
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV === "development") {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(requestContextMiddleware);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/tournaments", tournamentsRoutes);
  app.use("/api/tournaments", tournamentCategoriesRoutes);
  app.use("/api/categories", categoriesRoutes);
  app.use("/api/categories", categoryRegistrationsRoutes);
  app.use("/api/registrations", registrationsRoutes);
  app.use("/api/teams", teamsRoutes);
  app.use("/api/payments", paymentsRoutes);
  app.use("/api/admin/dashboard", dashboardRoutes);
  app.use("/api/rankings", rankingsRoutes);
  app.use("/api/players", playersRoutes);
  app.use("/api/admin/audit-logs", auditRoutes);
  app.use("/api/profile", profileRoutes);

  // Error handler must always be the LAST middleware registered.
  app.use(errorHandler);

  return app;
}
