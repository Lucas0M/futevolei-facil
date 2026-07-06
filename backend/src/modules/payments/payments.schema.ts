import { z } from "zod";
import { TeamPaymentPortion } from "@prisma/client";

export const confirmTeamPaymentSchema = z.object({
  portion: z.nativeEnum(TeamPaymentPortion),
});
export type ConfirmTeamPaymentInput = z.infer<typeof confirmTeamPaymentSchema>;
