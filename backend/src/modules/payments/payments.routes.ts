import { Router } from "express";
import { listMyPaymentsHandler } from "./payments.controller";
import { authenticate } from "../../shared/middlewares/authenticate";
import { asyncHandler } from "../../shared/utils/asyncHandler";

// Mounted at /api/payments
export const paymentsRoutes = Router();

paymentsRoutes.get("/me", authenticate, asyncHandler(listMyPaymentsHandler));
