import { Router } from "express";
import {
  createTournamentHandler,
  updateTournamentHandler,
  cancelTournamentHandler,
  publishTournamentHandler,
  listTournamentsHandler,
  getTournamentDetailHandler,
  exportTournamentRegistrantsHandler,
} from "./tournaments.controller";
import { authenticate } from "../../shared/middlewares/authenticate";
import { optionalAuthenticate } from "../../shared/middlewares/optionalAuthenticate";
import { authorize } from "../../shared/middlewares/authorize";
import { asyncHandler } from "../../shared/utils/asyncHandler";

export const tournamentsRoutes = Router();

// RF08/RF09 - public: anyone can browse tournaments, even without an account.
// optionalAuthenticate still lets an admin see their own DRAFT tournaments.
tournamentsRoutes.get("/", optionalAuthenticate, asyncHandler(listTournamentsHandler));
tournamentsRoutes.get("/:id", optionalAuthenticate, asyncHandler(getTournamentDetailHandler));

// RF06/RF07 - admin only
tournamentsRoutes.post("/", authenticate, authorize("ADMIN"), asyncHandler(createTournamentHandler));
tournamentsRoutes.patch("/:id", authenticate, authorize("ADMIN"), asyncHandler(updateTournamentHandler));
tournamentsRoutes.post("/:id/publish", authenticate, authorize("ADMIN"), asyncHandler(publishTournamentHandler));
tournamentsRoutes.delete("/:id", authenticate, authorize("ADMIN"), asyncHandler(cancelTournamentHandler));

// RF21 - admin exports the registrant list as CSV (for check-in / bracket draw on event day)
tournamentsRoutes.get(
  "/:id/export",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(exportTournamentRegistrantsHandler)
);
