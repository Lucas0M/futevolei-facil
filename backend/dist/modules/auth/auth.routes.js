"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
const authenticate_1 = require("../../shared/middlewares/authenticate");
exports.authRoutes = (0, express_1.Router)();
exports.authRoutes.post("/register", (0, asyncHandler_1.asyncHandler)(auth_controller_1.registerHandler));
exports.authRoutes.post("/login", (0, asyncHandler_1.asyncHandler)(auth_controller_1.loginHandler));
exports.authRoutes.post("/forgot-password", (0, asyncHandler_1.asyncHandler)(auth_controller_1.forgotPasswordHandler));
exports.authRoutes.post("/reset-password", (0, asyncHandler_1.asyncHandler)(auth_controller_1.resetPasswordHandler));
exports.authRoutes.post("/logout", authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(auth_controller_1.logoutHandler));
//# sourceMappingURL=auth.routes.js.map