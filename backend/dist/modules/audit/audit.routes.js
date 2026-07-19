"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRoutes = void 0;
const express_1 = require("express");
const audit_controller_1 = require("./audit.controller");
const authenticate_1 = require("../../shared/middlewares/authenticate");
const authorize_1 = require("../../shared/middlewares/authorize");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
exports.auditRoutes = (0, express_1.Router)();
exports.auditRoutes.get("/", authenticate_1.authenticate, (0, authorize_1.authorize)("SUPERADMIN"), (0, asyncHandler_1.asyncHandler)(audit_controller_1.listLogsHandler));
//# sourceMappingURL=audit.routes.js.map