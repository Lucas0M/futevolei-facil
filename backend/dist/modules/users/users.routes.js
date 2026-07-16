"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRoutes = void 0;
const express_1 = require("express");
const users_controller_1 = require("./users.controller");
const authenticate_1 = require("../../shared/middlewares/authenticate");
const authorize_1 = require("../../shared/middlewares/authorize");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
exports.usersRoutes = (0, express_1.Router)();
// RF01/RF02 area: any authenticated user can see their own profile
exports.usersRoutes.get("/me", authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(users_controller_1.getMeHandler));
// RF22: admin-only, paginated list of all users
exports.usersRoutes.get("/", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(users_controller_1.listUsersHandler));
// RF05: only an admin can promote another user to admin
exports.usersRoutes.patch("/:id/promote", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(users_controller_1.promoteToAdminHandler));
//# sourceMappingURL=users.routes.js.map