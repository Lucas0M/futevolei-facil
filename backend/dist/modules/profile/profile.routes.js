"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRoutes = void 0;
const express_1 = require("express");
const profile_controller_1 = require("./profile.controller");
const authenticate_1 = require("../../shared/middlewares/authenticate");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
exports.profileRoutes = (0, express_1.Router)();
exports.profileRoutes.get("/", authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(profile_controller_1.getProfileHandler));
exports.profileRoutes.put("/", authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(profile_controller_1.updateProfileHandler));
exports.profileRoutes.put("/password", authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(profile_controller_1.updatePasswordHandler));
//# sourceMappingURL=profile.routes.js.map