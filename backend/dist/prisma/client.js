"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const client_1 = require("@prisma/client");
const auditLogger_1 = require("../shared/utils/auditLogger");
const client = new client_1.PrismaClient();
const extendedClient = client.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                const writeOperations = ["create", "update", "delete", "upsert", "createMany", "updateMany", "deleteMany"];
                if (model === "AuditLog" || !writeOperations.includes(operation)) {
                    return query(args);
                }
                let oldData = null;
                let action = "CREATE";
                if (["update", "delete", "upsert"].includes(operation)) {
                    action = operation === "delete" ? "DELETE" : "UPDATE";
                    try {
                        if (args.where) {
                            oldData = await client[model].findUnique({
                                where: args.where,
                            });
                        }
                    }
                    catch (e) {
                        // Ignore
                    }
                }
                else if (operation === "updateMany" || operation === "deleteMany") {
                    action = operation === "deleteMany" ? "DELETE" : "UPDATE";
                    try {
                        if (args.where) {
                            oldData = await client[model].findMany({
                                where: args.where,
                                take: 10,
                            });
                        }
                    }
                    catch (e) {
                        // Ignore
                    }
                }
                // Execute query
                const result = await query(args);
                // Capture new data
                let newData = null;
                let entityId = undefined;
                if (operation === "create") {
                    newData = result;
                    entityId = result?.id;
                }
                else if (operation === "update" || operation === "upsert") {
                    newData = result;
                    entityId = result?.id;
                }
                else if (operation === "delete") {
                    entityId = oldData?.id;
                }
                else if (operation === "createMany") {
                    newData = args.data;
                }
                else if (operation === "updateMany") {
                    newData = args.data;
                }
                const recordForDesc = newData || oldData;
                const description = (0, auditLogger_1.generateDescription)(model, action, recordForDesc);
                // Trigger log write
                (0, auditLogger_1.writeAuditLog)({
                    action,
                    module: (0, auditLogger_1.getModuleName)(model),
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
exports.prisma = extendedClient;
//# sourceMappingURL=client.js.map