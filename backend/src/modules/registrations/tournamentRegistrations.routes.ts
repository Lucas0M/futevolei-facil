import { Router } from "express";
import { createRegistrationHandler } from "./registrations.controller";
import { authenticate } from "../../shared/middlewares/authenticate";
import { asyncHandler } from "../../shared/utils/asyncHandler";

// Mounted at /api/tournaments, so the final route is:
// POST /api/tournaments/:tournamentId/registrations
export const tournamentRegistrationsRoutes = Router({ mergeParams: true });

tournamentRegistrationsRoutes.post("/:tournamentId/registrations", authenticate, asyncHandler(createRegistrationHandler));
