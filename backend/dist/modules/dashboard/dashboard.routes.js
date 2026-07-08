"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
const express_1 = require("express");
const dashboard_controller_1 = require("./dashboard.controller");
const authenticate_1 = require("../../shared/middlewares/authenticate");
const authorize_1 = require("../../shared/middlewares/authorize");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
// Mounted at /api/admin/dashboard
exports.dashboardRoutes = (0, express_1.Router)();
exports.dashboardRoutes.get("/", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(dashboard_controller_1.getDashboardHandler));
//# sourceMappingURL=dashboard.routes.js.map