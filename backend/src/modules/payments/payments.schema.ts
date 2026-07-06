import { z } from "zod";
import { TeamPaymentPortion } from "@prisma/client";

export const confirmTeamPaymentSchema = z.object({
  portion: z.nativeEnum(TeamPaymentPortion),
});
export type ConfirmTeamPaymentInput = z.infer<typeof confirmTeamPaymentSchema>;

// Same shape - the player also needs to choose which portion they're paying
// when starting a Mercado Pago checkout for a DUO_FIXED team.
export const checkoutTeamSchema = z.object({
  portion: z.nativeEnum(TeamPaymentPortion),
});
export type CheckoutTeamInput = z.infer<typeof checkoutTeamSchema>;
