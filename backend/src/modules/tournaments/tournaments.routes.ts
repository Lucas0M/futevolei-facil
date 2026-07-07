import { Router } from "express";
import {
  createTournamentHandler,
  updateTournamentHandler,
  cancelTournamentHandler,
  publishTournamentHandler,
  listTournamentsHandler,
  getTournamentDetailHandler,
} from "./tournaments.controller";
import { authenticate } from "../../shared/middlewares/authenticate";
import { optionalAuthenticate } from "../../shared/middlewares/optionalAuthenticate";
import { authorize } from "../../shared/middlewares/authorize";
import { asyncHandler } from "../../shared/utils/asyncHandler";

export const tournamentsRoutes = Router();

// Public: anyone can browse tournaments, even without an account.
tournamentsRoutes.get("/", optionalAuthenticate, asyncHandler(listTournamentsHandler));
tournamentsRoutes.get("/:id", optionalAuthenticate, asyncHandler(getTournamentDetailHandler));

// Admin only
tournamentsRoutes.post("/", authenticate, authorize("ADMIN"), asyncHandler(createTournamentHandler));
tournamentsRoutes.patch("/:id", authenticate, authorize("ADMIN"), asyncHandler(updateTournamentHandler));
tournamentsRoutes.post("/:id/publish", authenticate, authorize("ADMIN"), asyncHandler(publishTournamentHandler));
tournamentsRoutes.delete("/:id", authenticate, authorize("ADMIN"), asyncHandler(cancelTournamentHandler));
