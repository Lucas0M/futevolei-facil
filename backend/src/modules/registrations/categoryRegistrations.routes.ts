import { Router } from "express";
import { createRegistrationHandler } from "./registrations.controller";
import { authenticate } from "../../shared/middlewares/authenticate";
import { asyncHandler } from "../../shared/utils/asyncHandler";

// Mounted at /api/categories, so the final route is:
// POST /api/categories/:categoryId/registrations
export const categoryRegistrationsRoutes = Router({ mergeParams: true });

categoryRegistrationsRoutes.post("/:categoryId/registrations", authenticate, asyncHandler(createRegistrationHandler));
