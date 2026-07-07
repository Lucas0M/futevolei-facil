import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./shared/middlewares/errorHandler";
import { authRoutes } from "./modules/auth/auth.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { tournamentsRoutes } from "./modules/tournaments/tournaments.routes";
import { categoriesRoutes, tournamentCategoriesRoutes } from "./modules/categories/categories.routes";
import { categoryRegistrationsRoutes } from "./modules/registrations/categoryRegistrations.routes";
import { registrationsRoutes } from "./modules/registrations/registrations.routes";
import { teamsRoutes } from "./modules/registrations/teams.routes";
import { paymentsRoutes } from "./modules/payments/payments.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json());

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

  // Error handler must always be the LAST middleware registered.
  app.use(errorHandler);

  return app;
}
