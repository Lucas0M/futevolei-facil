import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  writeAuditLog,
  getModuleName,
  generateDescription,
} from "../shared/utils/auditLogger";

const client = new PrismaClient();

export const prisma = client.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const writeOperations = ["create", "update", "delete", "upsert", "createMany", "updateMany", "deleteMany"];
        if (model === "AuditLog" || !writeOperations.includes(operation)) {
          return query(args);
        }

        let oldData: any = null;
        let action = "CREATE";
        if (["update", "delete", "upsert"].includes(operation)) {
          action = operation === "delete" ? "DELETE" : "UPDATE";
          try {
            if (args.where) {
              oldData = await (client as any)[model].findUnique({
                where: args.where,
              });
            }
          } catch (e) {
            // Ignore error if record fetch fails
          }
        } else if (operation === "updateMany" || operation === "deleteMany") {
          action = operation === "deleteMany" ? "DELETE" : "UPDATE";
          try {
            if (args.where) {
              oldData = await (client as any)[model].findMany({
                where: args.where,
                take: 10,
              });
            }
          } catch (e) {
            // Ignore
          }
        }

        // Execute query
        const result = await query(args);

        // Capture new data
        let newData: any = null;
        let entityId: string | undefined = undefined;

        if (operation === "create") {
          newData = result;
          entityId = result?.id;
        } else if (operation === "update" || operation === "upsert") {
          newData = result;
          entityId = result?.id;
        } else if (operation === "delete") {
          entityId = oldData?.id;
        } else if (operation === "createMany") {
          newData = args.data;
        } else if (operation === "updateMany") {
          newData = args.data;
        }

        const recordForDesc = newData || oldData;
        const description = generateDescription(model, action, recordForDesc);

        // Trigger log write asynchronously
        writeAuditLog({
          action,
          module: getModuleName(model),
          entity: model,
          entityId,
          description,
          oldData,
          newData,
        }).catch((err) => console.error("Error writing automatic audit log:", err));

        return result;
      },
    },
  },
});
export type ExtendedPrismaClient = typeof prisma;
