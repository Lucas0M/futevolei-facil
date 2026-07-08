"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRegistrationsRoutes = void 0;
const express_1 = require("express");
const registrations_controller_1 = require("./registrations.controller");
const authenticate_1 = require("../../shared/middlewares/authenticate");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
// Mounted at /api/categories, so the final route is:
// POST /api/categories/:categoryId/registrations
exports.categoryRegistrationsRoutes = (0, express_1.Router)({ mergeParams: true });
exports.categoryRegistrationsRoutes.post("/:categoryId/registrations", authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(registrations_controller_1.createRegistrationHandler));
//# sourceMappingURL=categoryRegistrations.routes.js.map