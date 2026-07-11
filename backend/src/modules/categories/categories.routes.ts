import { Router } from "express";
import {
  createCategoryHandler,
  updateCategoryHandler,
  cancelCategoryHandler,
  publishCategoryHandler,
  getCategoryDetailHandler,
  exportCategoryRegistrantsHandler,
  generateCategoryBracketHandler,
  generatePersistentBracketHandler,
  updateMatchWinnerHandler,
} from "./categories.controller";
import { authenticate } from "../../shared/middlewares/authenticate";
import { optionalAuthenticate } from "../../shared/middlewares/optionalAuthenticate";
import { authorize } from "../../shared/middlewares/authorize";
import { asyncHandler } from "../../shared/utils/asyncHandler";

// Mounted at /api/categories - except creation, which is nested under /api/tournaments
export const categoriesRoutes = Router();

categoriesRoutes.get(
  "/:id",
  optionalAuthenticate,
  asyncHandler(getCategoryDetailHandler),
);
categoriesRoutes.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(updateCategoryHandler),
);
categoriesRoutes.post(
  "/:id/publish",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(publishCategoryHandler),
);
categoriesRoutes.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(cancelCategoryHandler),
);
categoriesRoutes.get(
  "/:id/export",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(exportCategoryRegistrantsHandler),
);
categoriesRoutes.get(
  "/:id/bracket",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(generateCategoryBracketHandler),
);
categoriesRoutes.post(
  "/:id/bracket",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(generatePersistentBracketHandler),
);
categoriesRoutes.patch(
  "/matches/:matchId",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(updateMatchWinnerHandler),
);

// Mounted at /api/tournaments - nested creation route
export const tournamentCategoriesRoutes = Router({ mergeParams: true });
tournamentCategoriesRoutes.post(
  "/:tournamentId/categories",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(createCategoryHandler),
);
