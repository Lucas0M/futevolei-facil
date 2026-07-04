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
import { authorize } from "../../shared/middlewares/authorize";
import { asyncHandler } from "../../shared/utils/asyncHandler";

export const tournamentsRoutes = Router();

// RF08/RF09 - any authenticated user (player or admin) can browse tournaments
tournamentsRoutes.get("/", authenticate, asyncHandler(listTournamentsHandler));
tournamentsRoutes.get("/:id", authenticate, asyncHandler(getTournamentDetailHandler));

// RF06/RF07 - admin only
tournamentsRoutes.post("/", authenticate, authorize("ADMIN"), asyncHandler(createTournamentHandler));
tournamentsRoutes.patch("/:id", authenticate, authorize("ADMIN"), asyncHandler(updateTournamentHandler));
tournamentsRoutes.post("/:id/publish", authenticate, authorize("ADMIN"), asyncHandler(publishTournamentHandler));
tournamentsRoutes.delete("/:id", authenticate, authorize("ADMIN"), asyncHandler(cancelTournamentHandler));
