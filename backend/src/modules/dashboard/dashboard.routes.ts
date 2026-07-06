import { Router } from "express";
import { getDashboardHandler } from "./dashboard.controller";
import { authenticate } from "../../shared/middlewares/authenticate";
import { authorize } from "../../shared/middlewares/authorize";
import { asyncHandler } from "../../shared/utils/asyncHandler";

// Mounted at /api/admin/dashboard
export const dashboardRoutes = Router();

dashboardRoutes.get("/", authenticate, authorize("ADMIN"), asyncHandler(getDashboardHandler));
