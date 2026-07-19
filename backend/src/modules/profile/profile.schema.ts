import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
  email: z.string().email("Endereço de e-mail inválido."),
  avatarUrl: z.string().nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "A senha atual deve ter no mínimo 6 caracteres."),
    newPassword: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres."),
    confirmPassword: z.string().min(6, "A confirmação de senha deve ter no mínimo 6 caracteres."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "A nova senha e a confirmação de senha não coincidem.",
    path: ["confirmPassword"],
  });
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
