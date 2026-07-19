import { Router } from "express";
import { getProfileHandler, updateProfileHandler, updatePasswordHandler } from "./profile.controller";
import { authenticate } from "../../shared/middlewares/authenticate";
import { asyncHandler } from "../../shared/utils/asyncHandler";

export const profileRoutes = Router();

profileRoutes.get("/", authenticate, asyncHandler(getProfileHandler));
profileRoutes.put("/", authenticate, asyncHandler(updateProfileHandler));
profileRoutes.put("/password", authenticate, asyncHandler(updatePasswordHandler));
