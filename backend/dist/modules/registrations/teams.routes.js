"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamsRoutes = void 0;
const express_1 = require("express");
const registrations_controller_1 = require("./registrations.controller");
const payments_controller_1 = require("../payments/payments.controller");
const authenticate_1 = require("../../shared/middlewares/authenticate");
const authorize_1 = require("../../shared/middlewares/authorize");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
// Mounted at /api/teams
exports.teamsRoutes = (0, express_1.Router)();
// RF12 - owner cancels the whole pair (partner has no account to do this themselves)
exports.teamsRoutes.delete("/:id", authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(registrations_controller_1.cancelOwnTeamHandler));
// RF13 - admin removes any team registration
exports.teamsRoutes.delete("/:id/admin", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(registrations_controller_1.adminCancelTeamHandler));
// Admin edits the partner's name (e.g. partner swap after the fact)
exports.teamsRoutes.patch("/:id/partner", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(registrations_controller_1.updateTeamPartnerHandler));
// RF16 - admin manually confirms payment (FULL, OWNER_SHARE, or PARTNER_SHARE)
exports.teamsRoutes.post("/:id/confirm-payment", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(payments_controller_1.confirmTeamPaymentHandler));
// RF15 - team owner starts a Mercado Pago checkout for their chosen portion
exports.teamsRoutes.post("/:id/checkout", authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(payments_controller_1.checkoutTeamHandler));
//# sourceMappingURL=teams.routes.js.map