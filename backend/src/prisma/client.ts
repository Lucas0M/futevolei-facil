import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  writeAuditLog,
  getModuleName,
  generateDescription,
} from "../shared/utils/auditLogger";

const client = new PrismaClient();

const extendedClient = client.$extends({
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
            if ((args as any).where) {
              oldData = await (client as any)[model].findUnique({
                where: (args as any).where,
              });
            }
          } catch (e) {
            // Ignore
          }
        } else if (operation === "updateMany" || operation === "deleteMany") {
          action = operation === "deleteMany" ? "DELETE" : "UPDATE";
          try {
            if ((args as any).where) {
              oldData = await (client as any)[model].findMany({
                where: (args as any).where,
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
          entityId = (result as any)?.id;
        } else if (operation === "update" || operation === "upsert") {
          newData = result;
          entityId = (result as any)?.id;
        } else if (operation === "delete") {
          entityId = (oldData as any)?.id;
        } else if (operation === "createMany") {
          newData = (args as any).data;
        } else if (operation === "updateMany") {
          newData = (args as any).data;
        }

        const recordForDesc = newData || oldData;
        const description = generateDescription(model, action, recordForDesc);

        // Trigger log write
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

// Export as any to bypass transaction type checking in services
export const prisma = extendedClient as any;
export const rawPrisma = client;
