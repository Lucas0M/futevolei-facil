import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
} from "./auth.controller";
import { asyncHandler } from "../../shared/utils/asyncHandler";

export const authRoutes = Router();

authRoutes.post("/register", asyncHandler(registerHandler));
authRoutes.post("/login", asyncHandler(loginHandler));
authRoutes.post("/forgot-password", asyncHandler(forgotPasswordHandler));
authRoutes.post("/reset-password", asyncHandler(resetPasswordHandler));
