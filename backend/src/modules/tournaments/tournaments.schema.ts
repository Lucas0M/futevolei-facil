import { z } from "zod";
import { TournamentFormat, TournamentStatus } from "@prisma/client";

export const createTournamentSchema = z
  .object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres."),
    description: z.string().optional(),
    eventDate: z.coerce.date({ errorMap: () => ({ message: "Data do evento inválida." }) }),
    location: z.string().min(3, "Local é obrigatório."),
    category: z.string().min(1, "Categoria é obrigatória."), // free text, per product decision
    format: z.nativeEnum(TournamentFormat),
    entryFee: z.coerce.number().positive("Valor da inscrição deve ser positivo."),
    maxSlots: z.coerce.number().int().positive("Número de vagas deve ser positivo."),
    registrationDeadline: z.coerce.date({ errorMap: () => ({ message: "Data limite de inscrição inválida." }) }),
    reservationTtlMinutes: z.coerce.number().int().positive().default(20),
    refundFullBeforeDays: z.coerce.number().int().nonnegative().optional(),
    refundPartialBeforeDays: z.coerce.number().int().nonnegative().optional(),
    refundPartialPercent: z.coerce.number().min(0).max(100).optional(),
    cancellationDeadlineHours: z.coerce.number().int().nonnegative().default(48),
  })
  .refine((data) => data.registrationDeadline < data.eventDate, {
    message: "A data limite de inscrição deve ser antes da data do evento.",
    path: ["registrationDeadline"],
  });
export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

// Format is intentionally NOT included here - it is locked once the
// tournament has any registration/team (enforced in the service layer).
export const updateTournamentSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  eventDate: z.coerce.date().optional(),
  location: z.string().min(3).optional(),
  category: z.string().min(1).optional(),
  entryFee: z.coerce.number().positive().optional(),
  maxSlots: z.coerce.number().int().positive().optional(),
  registrationDeadline: z.coerce.date().optional(),
  reservationTtlMinutes: z.coerce.number().int().positive().optional(),
  refundFullBeforeDays: z.coerce.number().int().nonnegative().optional(),
  refundPartialBeforeDays: z.coerce.number().int().nonnegative().optional(),
  refundPartialPercent: z.coerce.number().min(0).max(100).optional(),
  cancellationDeadlineHours: z.coerce.number().int().nonnegative().optional(),
});
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;

export const listTournamentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(TournamentStatus).optional(),
  category: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});
export type ListTournamentsQuery = z.infer<typeof listTournamentsQuerySchema>;
