import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  logoutHandler,
} from "./auth.controller";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { authenticate } from "../../shared/middlewares/authenticate";

export const authRoutes = Router();

authRoutes.post("/register", asyncHandler(registerHandler));
authRoutes.post("/login", asyncHandler(loginHandler));
authRoutes.post("/forgot-password", asyncHandler(forgotPasswordHandler));
authRoutes.post("/reset-password", asyncHandler(resetPasswordHandler));
authRoutes.post("/logout", authenticate, asyncHandler(logoutHandler));
