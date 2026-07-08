"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsRoutes = void 0;
const express_1 = require("express");
const payments_controller_1 = require("./payments.controller");
const authenticate_1 = require("../../shared/middlewares/authenticate");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
// Mounted at /api/payments
exports.paymentsRoutes = (0, express_1.Router)();
exports.paymentsRoutes.get("/me", authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(payments_controller_1.listMyPaymentsHandler));
//# sourceMappingURL=payments.routes.js.map