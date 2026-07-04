import { z } from "zod";

// Used for INDIVIDUAL and DUO_RANDOM tournaments - no extra data needed,
// the player just registers themself.
export const createIndividualRegistrationSchema = z.object({}).optional();

// Used for DUO_FIXED tournaments - the owner (logged-in user) registers
// themself + a partner identified only by name (no account needed).
export const createTeamRegistrationSchema = z.object({
  partnerName: z.string().min(2, "Nome do parceiro deve ter pelo menos 2 caracteres."),
});
export type CreateTeamRegistrationInput = z.infer<typeof createTeamRegistrationSchema>;

export const updateTeamPartnerSchema = z.object({
  partnerName: z.string().min(2, "Nome do parceiro deve ter pelo menos 2 caracteres."),
});
export type UpdateTeamPartnerInput = z.infer<typeof updateTeamPartnerSchema>;
