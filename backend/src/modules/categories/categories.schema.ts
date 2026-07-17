import { z } from "zod";
import { CategoryFormat } from "@prisma/client";

export const createCategorySchema = z.object({
  name: z.string().min(2, "Nome da categoria deve ter pelo menos 2 caracteres."),
  format: z.nativeEnum(CategoryFormat),
  entryFee: z.coerce.number().positive("Valor da inscrição deve ser positivo."),
  maxSlots: z.coerce.number().int().positive("Número de vagas deve ser positivo."),
  registrationDeadline: z.coerce.date({ message: "Data limite de inscrição inválida." }),
  reservationTtlMinutes: z.coerce.number().int().positive().default(20),
  refundFullBeforeDays: z.coerce.number().int().nonnegative().optional(),
  refundPartialBeforeDays: z.coerce.number().int().nonnegative().optional(),
  refundPartialPercent: z.coerce.number().min(0).max(100).optional(),
  cancellationDeadlineHours: z.coerce.number().int().nonnegative().default(48),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// format is intentionally excluded - immutable after creation, same reasoning
// as the old Tournament.format (changing it after registrations exist would
// break slot-counting logic).
export const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  format: z.nativeEnum(CategoryFormat).optional(),
  entryFee: z.coerce.number().positive().optional(),
  maxSlots: z.coerce.number().int().positive().optional(),
  registrationDeadline: z.coerce.date().optional(),
  reservationTtlMinutes: z.coerce.number().int().positive().optional(),
  refundFullBeforeDays: z.coerce.number().int().nonnegative().optional(),
  refundPartialBeforeDays: z.coerce.number().int().nonnegative().optional(),
  refundPartialPercent: z.coerce.number().min(0).max(100).optional(),
  cancellationDeadlineHours: z.coerce.number().int().nonnegative().optional(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
