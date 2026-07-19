import { Router } from "express";
import { listLogsHandler } from "./audit.controller";
import { authenticate } from "../../shared/middlewares/authenticate";
import { authorize } from "../../shared/middlewares/authorize";
import { asyncHandler } from "../../shared/utils/asyncHandler";

export const auditRoutes = Router();

auditRoutes.get("/", authenticate, authorize("SUPERADMIN"), asyncHandler(listLogsHandler));
