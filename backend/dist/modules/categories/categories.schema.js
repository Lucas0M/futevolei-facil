"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Nome da categoria deve ter pelo menos 2 caracteres."),
    format: zod_1.z.nativeEnum(client_1.CategoryFormat),
    entryFee: zod_1.z.coerce.number().positive("Valor da inscrição deve ser positivo."),
    maxSlots: zod_1.z.coerce.number().int().positive("Número de vagas deve ser positivo."),
    registrationDeadline: zod_1.z.coerce.date({ message: "Data limite de inscrição inválida." }),
    reservationTtlMinutes: zod_1.z.coerce.number().int().positive().default(20),
    refundFullBeforeDays: zod_1.z.coerce.number().int().nonnegative().optional(),
    refundPartialBeforeDays: zod_1.z.coerce.number().int().nonnegative().optional(),
    refundPartialPercent: zod_1.z.coerce.number().min(0).max(100).optional(),
    cancellationDeadlineHours: zod_1.z.coerce.number().int().nonnegative().default(48),
});
// format is intentionally excluded - immutable after creation, same reasoning
// as the old Tournament.format (changing it after registrations exist would
// break slot-counting logic).
exports.updateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    entryFee: zod_1.z.coerce.number().positive().optional(),
    maxSlots: zod_1.z.coerce.number().int().positive().optional(),
    registrationDeadline: zod_1.z.coerce.date().optional(),
    reservationTtlMinutes: zod_1.z.coerce.number().int().positive().optional(),
    refundFullBeforeDays: zod_1.z.coerce.number().int().nonnegative().optional(),
    refundPartialBeforeDays: zod_1.z.coerce.number().int().nonnegative().optional(),
    refundPartialPercent: zod_1.z.coerce.number().min(0).max(100).optional(),
    cancellationDeadlineHours: zod_1.z.coerce.number().int().nonnegative().optional(),
});
//# sourceMappingURL=categories.schema.js.map