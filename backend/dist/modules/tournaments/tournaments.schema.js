"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTournamentsQuerySchema = exports.updateTournamentSchema = exports.createTournamentSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createTournamentSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, "Nome deve ter pelo menos 3 caracteres."),
    description: zod_1.z.string().optional(),
    eventDate: zod_1.z.coerce.date({ errorMap: () => ({ message: "Data do evento inválida." }) }),
    location: zod_1.z.string().min(3, "Local é obrigatório."),
});
exports.updateTournamentSchema = zod_1.z.object({
    name: zod_1.z.string().min(3).optional(),
    description: zod_1.z.string().optional(),
    eventDate: zod_1.z.coerce.date().optional(),
    location: zod_1.z.string().min(3).optional(),
});
exports.listTournamentsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).optional(),
    fromDate: zod_1.z.coerce.date().optional(),
    toDate: zod_1.z.coerce.date().optional(),
});
//# sourceMappingURL=tournaments.schema.js.map