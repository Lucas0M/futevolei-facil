import { Router } from "express";
import { getMeHandler, listUsersHandler, promoteToAdminHandler } from "./users.controller";
import { authenticate } from "../../shared/middlewares/authenticate";
import { authorize } from "../../shared/middlewares/authorize";
import { asyncHandler } from "../../shared/utils/asyncHandler";

export const usersRoutes = Router();

// RF01/RF02 area: any authenticated user can see their own profile
usersRoutes.get("/me", authenticate, asyncHandler(getMeHandler));

// RF22: admin-only, paginated list of all users
usersRoutes.get("/", authenticate, authorize("ADMIN"), asyncHandler(listUsersHandler));

// RF05: only an admin can promote another user to admin
usersRoutes.patch("/:id/promote", authenticate, authorize("ADMIN"), asyncHandler(promoteToAdminHandler));
