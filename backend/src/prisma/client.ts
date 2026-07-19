import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  writeAuditLog,
  getModuleName,
  generateDescription,
} from "../shared/utils/auditLogger";

export const prisma = new PrismaClient();

// Use Prisma Middleware instead of Extensions to preserve the standard PrismaClient type,
// preventing TS2345 type mismatch errors during database transactions.
(prisma as any).$use(async (params: any, next: any) => {
  const writeOperations = [
    "create",
    "update",
    "delete",
    "upsert",
    "createMany",
    "updateMany",
    "deleteMany",
  ];

  if (!params.model || params.model === "AuditLog" || !writeOperations.includes(params.action)) {
    return next(params);
  }

  const model = params.model;
  const action = params.action;
  const args = params.args || {};

  let oldData: any = null;
  let logAction = "CREATE";

  if (["update", "delete", "upsert"].includes(action)) {
    logAction = action === "delete" ? "DELETE" : "UPDATE";
    try {
      if (args.where) {
        oldData = await (prisma as any)[model].findUnique({
          where: args.where,
        });
      }
    } catch (e) {
      // Ignore
    }
  } else if (action === "updateMany" || action === "deleteMany") {
    logAction = action === "deleteMany" ? "DELETE" : "UPDATE";
    try {
      if (args.where) {
        oldData = await (prisma as any)[model].findMany({
          where: args.where,
          take: 10,
        });
      }
    } catch (e) {
      // Ignore
    }
  }

  const result = await next(params);

  // Capture new data
  let newData: any = null;
  let entityId: string | undefined = undefined;

  if (action === "create") {
    newData = result;
    entityId = result?.id;
  } else if (action === "update" || action === "upsert") {
    newData = result;
    entityId = result?.id;
  } else if (action === "delete") {
    entityId = oldData?.id;
  } else if (action === "createMany") {
    newData = args.data;
  } else if (action === "updateMany") {
    newData = args.data;
  }

  const recordForDesc = newData || oldData;
  const description = generateDescription(model, logAction, recordForDesc);

  writeAuditLog({
    action: logAction,
    module: getModuleName(model),
    entity: model,
    entityId,
    description,
    oldData,
    newData,
  }).catch((err) => console.error("Error writing automatic audit log:", err));

  return result;
});
