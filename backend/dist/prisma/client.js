"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// A single shared instance avoids exhausting the database connection pool,
// which would happen if we created a `new PrismaClient()` in every file
// that needs to query the database.
exports.prisma = new client_1.PrismaClient();
//# sourceMappingURL=client.js.map