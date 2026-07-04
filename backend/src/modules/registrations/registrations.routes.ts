import { Router } from "express";
import {
  cancelOwnRegistrationHandler,
  adminCancelRegistrationHandler,
  listMyRegistrationsHandler,
} from "./registrations.controller";
import { authenticate } from "../../shared/middlewares/authenticate";
import { authorize } from "../../shared/middlewares/authorize";
import { asyncHandler } from "../../shared/utils/asyncHandler";

// Mounted at /api/registrations
export const registrationsRoutes = Router();

registrationsRoutes.get("/me", authenticate, asyncHandler(listMyRegistrationsHandler));

// RF12 - player cancels their own registration (subject to RN04 deadline)
registrationsRoutes.delete("/:id", authenticate, asyncHandler(cancelOwnRegistrationHandler));

// RF13 - admin removes any registration, no deadline restriction
registrationsRoutes.delete(
  "/:id/admin",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(adminCancelRegistrationHandler)
);
