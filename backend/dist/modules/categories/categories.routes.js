"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tournamentCategoriesRoutes = exports.categoriesRoutes = void 0;
const express_1 = require("express");
const categories_controller_1 = require("./categories.controller");
const authenticate_1 = require("../../shared/middlewares/authenticate");
const optionalAuthenticate_1 = require("../../shared/middlewares/optionalAuthenticate");
const authorize_1 = require("../../shared/middlewares/authorize");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
// Mounted at /api/categories - except creation, which is nested under /api/tournaments
exports.categoriesRoutes = (0, express_1.Router)();
exports.categoriesRoutes.get("/:id", optionalAuthenticate_1.optionalAuthenticate, (0, asyncHandler_1.asyncHandler)(categories_controller_1.getCategoryDetailHandler));
exports.categoriesRoutes.patch("/:id", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(categories_controller_1.updateCategoryHandler));
exports.categoriesRoutes.post("/:id/publish", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(categories_controller_1.publishCategoryHandler));
exports.categoriesRoutes.delete("/:id", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(categories_controller_1.cancelCategoryHandler));
exports.categoriesRoutes.get("/:id/export", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(categories_controller_1.exportCategoryRegistrantsHandler));
exports.categoriesRoutes.get("/:id/bracket", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(categories_controller_1.generateCategoryBracketHandler));
// Mounted at /api/tournaments - nested creation route
exports.tournamentCategoriesRoutes = (0, express_1.Router)({ mergeParams: true });
exports.tournamentCategoriesRoutes.post("/:tournamentId/categories", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(categories_controller_1.createCategoryHandler));
//# sourceMappingURL=categories.routes.js.map