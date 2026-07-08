"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
    email: zod_1.z.string().email("E-mail inválido."),
    password: zod_1.z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
    phone: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("E-mail inválido."),
    password: zod_1.z.string().min(1, "Senha é obrigatória."),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email("E-mail inválido."),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Token é obrigatório."),
    newPassword: zod_1.z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
});
//# sourceMappingURL=auth.schema.js.map