import { PrismaClient } from "@prisma/client";

// A single shared instance avoids exhausting the database connection pool,
// which would happen if we created a `new PrismaClient()` in every file
// that needs to query the database.
export const prisma = new PrismaClient();
