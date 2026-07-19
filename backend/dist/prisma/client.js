"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const client_1 = require("@prisma/client");
const auditLogger_1 = require("../shared/utils/auditLogger");
exports.prisma = new client_1.PrismaClient();
// Use Prisma Middleware instead of Extensions to preserve the standard PrismaClient type,
// preventing TS2345 type mismatch errors during database transactions.
exports.prisma.$use(async (params, next) => {
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
    let oldData = null;
    let logAction = "CREATE";
    if (["update", "delete", "upsert"].includes(action)) {
        logAction = action === "delete" ? "DELETE" : "UPDATE";
        try {
            if (args.where) {
                oldData = await exports.prisma[model].findUnique({
                    where: args.where,
                });
            }
        }
        catch (e) {
            // Ignore
        }
    }
    else if (action === "updateMany" || action === "deleteMany") {
        logAction = action === "deleteMany" ? "DELETE" : "UPDATE";
        try {
            if (args.where) {
                oldData = await exports.prisma[model].findMany({
                    where: args.where,
                    take: 10,
                });
            }
        }
        catch (e) {
            // Ignore
        }
    }
    const result = await next(params);
    // Capture new data
    let newData = null;
    let entityId = undefined;
    if (action === "create") {
        newData = result;
        entityId = result?.id;
    }
    else if (action === "update" || action === "upsert") {
        newData = result;
        entityId = result?.id;
    }
    else if (action === "delete") {
        entityId = oldData?.id;
    }
    else if (action === "createMany") {
        newData = args.data;
    }
    else if (action === "updateMany") {
        newData = args.data;
    }
    const recordForDesc = newData || oldData;
    const description = (0, auditLogger_1.generateDescription)(model, logAction, recordForDesc);
    (0, auditLogger_1.writeAuditLog)({
        action: logAction,
        module: (0, auditLogger_1.getModuleName)(model),
        entity: model,
        entityId,
        description,
        oldData,
        newData,
    }).catch((err) => console.error("Error writing automatic audit log:", err));
    return result;
});
//# sourceMappingURL=client.js.map