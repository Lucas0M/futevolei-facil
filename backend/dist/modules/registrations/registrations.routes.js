"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrationsRoutes = void 0;
const express_1 = require("express");
const registrations_controller_1 = require("./registrations.controller");
const payments_controller_1 = require("../payments/payments.controller");
const authenticate_1 = require("../../shared/middlewares/authenticate");
const authorize_1 = require("../../shared/middlewares/authorize");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
// Mounted at /api/registrations
exports.registrationsRoutes = (0, express_1.Router)();
exports.registrationsRoutes.get("/me", authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(registrations_controller_1.listMyRegistrationsHandler));
// RF12 - player cancels their own registration (subject to RN04 deadline)
exports.registrationsRoutes.delete("/:id", authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(registrations_controller_1.cancelOwnRegistrationHandler));
// RF13 - admin removes any registration, no deadline restriction
exports.registrationsRoutes.delete("/:id/admin", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(registrations_controller_1.adminCancelRegistrationHandler));
// RF16 - admin manually confirms payment made outside the platform
exports.registrationsRoutes.post("/:id/confirm-payment", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(payments_controller_1.confirmRegistrationPaymentHandler));
// RF15 - player starts a Mercado Pago checkout (Checkout Pro) for their own registration
exports.registrationsRoutes.post("/:id/checkout", authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(payments_controller_1.checkoutRegistrationHandler));
//# sourceMappingURL=registrations.routes.js.map