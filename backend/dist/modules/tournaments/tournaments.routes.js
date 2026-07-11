"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tournamentsRoutes = void 0;
const express_1 = require("express");
const tournaments_controller_1 = require("./tournaments.controller");
const authenticate_1 = require("../../shared/middlewares/authenticate");
const optionalAuthenticate_1 = require("../../shared/middlewares/optionalAuthenticate");
const authorize_1 = require("../../shared/middlewares/authorize");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
exports.tournamentsRoutes = (0, express_1.Router)();
// Public: anyone can browse tournaments, even without an account.
exports.tournamentsRoutes.get("/", optionalAuthenticate_1.optionalAuthenticate, (0, asyncHandler_1.asyncHandler)(tournaments_controller_1.listTournamentsHandler));
exports.tournamentsRoutes.get("/:id", optionalAuthenticate_1.optionalAuthenticate, (0, asyncHandler_1.asyncHandler)(tournaments_controller_1.getTournamentDetailHandler));
// Admin only
exports.tournamentsRoutes.post("/", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(tournaments_controller_1.createTournamentHandler));
exports.tournamentsRoutes.patch("/:id", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(tournaments_controller_1.updateTournamentHandler));
exports.tournamentsRoutes.post("/:id/publish", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(tournaments_controller_1.publishTournamentHandler));
exports.tournamentsRoutes.delete("/:id", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(tournaments_controller_1.cancelTournamentHandler));
exports.tournamentsRoutes.get("/:id/pending-payments", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(tournaments_controller_1.getTournamentPendingPaymentsHandler));
//# sourceMappingURL=tournaments.routes.js.map