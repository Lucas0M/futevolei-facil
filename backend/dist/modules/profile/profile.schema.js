"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePasswordSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
    email: zod_1.z.string().email("Endereço de e-mail inválido."),
    avatarUrl: zod_1.z.string().nullable().optional(),
});
exports.updatePasswordSchema = zod_1.z
    .object({
    currentPassword: zod_1.z.string().min(6, "A senha atual deve ter no mínimo 6 caracteres."),
    newPassword: zod_1.z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres."),
    confirmPassword: zod_1.z.string().min(6, "A confirmação de senha deve ter no mínimo 6 caracteres."),
})
    .refine((data) => data.newPassword === data.confirmPassword, {
    message: "A nova senha e a confirmação de senha não coincidem.",
    path: ["confirmPassword"],
});
//# sourceMappingURL=profile.schema.js.map