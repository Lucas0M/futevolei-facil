import { z } from "zod";
import { EntityStatus } from "@prisma/client";

export const createTournamentSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres."),
  description: z.string().optional(),
  eventDate: z.coerce.date({ errorMap: () => ({ message: "Data do evento inválida." }) }),
  location: z.string().min(3, "Local é obrigatório."),
});
export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

export const updateTournamentSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  eventDate: z.coerce.date().optional(),
  location: z.string().min(3).optional(),
  status: z.nativeEnum(EntityStatus).optional(),
});
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;

export const listTournamentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(EntityStatus).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});
export type ListTournamentsQuery = z.infer<typeof listTournamentsQuerySchema>;
