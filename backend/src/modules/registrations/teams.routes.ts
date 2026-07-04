import { Router } from "express";
import { cancelOwnTeamHandler, adminCancelTeamHandler, updateTeamPartnerHandler } from "./registrations.controller";
import { authenticate } from "../../shared/middlewares/authenticate";
import { authorize } from "../../shared/middlewares/authorize";
import { asyncHandler } from "../../shared/utils/asyncHandler";

// Mounted at /api/teams
export const teamsRoutes = Router();

// RF12 - owner cancels the whole pair (partner has no account to do this themselves)
teamsRoutes.delete("/:id", authenticate, asyncHandler(cancelOwnTeamHandler));

// RF13 - admin removes any team registration
teamsRoutes.delete("/:id/admin", authenticate, authorize("ADMIN"), asyncHandler(adminCancelTeamHandler));

// Admin edits the partner's name (e.g. partner swap after the fact)
teamsRoutes.patch("/:id/partner", authenticate, authorize("ADMIN"), asyncHandler(updateTeamPartnerHandler));
