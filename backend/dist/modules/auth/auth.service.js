"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("../../prisma/client");
const AppError_1 = require("../../shared/errors/AppError");
const hash_1 = require("../../shared/utils/hash");
const jwt_1 = require("../../shared/utils/jwt");
const mailer_1 = require("../../shared/mailer/mailer");
const passwordReset_1 = require("../../shared/mailer/templates/passwordReset");
const env_1 = require("../../config/env");
const RESET_TOKEN_TTL_MINUTES = 60;
async function register(input) {
    const existingUser = await client_1.prisma.user.findUnique({ where: { email: input.email } });
    if (existingUser) {
        throw new AppError_1.AppError("Este e-mail já está cadastrado.", 409, "EMAIL_ALREADY_IN_USE");
    }
    const passwordHash = await (0, hash_1.hashPassword)(input.password);
    const user = await client_1.prisma.user.create({
        data: {
            name: input.name,
            email: input.email,
            phone: input.phone,
            passwordHash,
            // First user of the platform is not auto-promoted here on purpose -
            // the very first admin should be promoted directly in the database
            // (or via a seed script), to avoid an unauthenticated "become admin" path.
        },
    });
    const token = (0, jwt_1.signToken)({ sub: user.id, role: user.role });
    return { user: toPublicUser(user), token };
}
async function login(input) {
    const user = await client_1.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
        throw new AppError_1.AppError("E-mail ou senha inválidos.", 401, "INVALID_CREDENTIALS");
    }
    const passwordMatches = await (0, hash_1.comparePassword)(input.password, user.passwordHash);
    if (!passwordMatches) {
        throw new AppError_1.AppError("E-mail ou senha inválidos.", 401, "INVALID_CREDENTIALS");
    }
    const token = (0, jwt_1.signToken)({ sub: user.id, role: user.role });
    return { user: toPublicUser(user), token };
}
async function forgotPassword(input) {
    const user = await client_1.prisma.user.findUnique({ where: { email: input.email } });
    // Always respond the same way whether the user exists or not, so an
    // attacker cannot use this endpoint to discover which emails are registered.
    if (!user) {
        return;
    }
    const rawToken = crypto_1.default.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
    await client_1.prisma.passwordResetToken.create({
        data: {
            token: rawToken,
            userId: user.id,
            expiresAt,
        },
    });
    const resetLink = `${env_1.env.FRONTEND_URL}/redefinir-senha?token=${rawToken}`;
    const { subject, html } = (0, passwordReset_1.passwordResetEmail)({ userName: user.name, resetLink });
    await (0, mailer_1.sendEmail)({ to: user.email, subject, html });
}
async function resetPassword(input) {
    const resetToken = await client_1.prisma.passwordResetToken.findUnique({
        where: { token: input.token },
    });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
        throw new AppError_1.AppError("Link de redefinição inválido ou expirado.", 400, "INVALID_RESET_TOKEN");
    }
    const passwordHash = await (0, hash_1.hashPassword)(input.newPassword);
    // Both writes happen together: if updating the password fails, we don't
    // want to mark the token as used.
    await client_1.prisma.$transaction([
        client_1.prisma.user.update({
            where: { id: resetToken.userId },
            data: { passwordHash },
        }),
        client_1.prisma.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { usedAt: new Date() },
        }),
    ]);
}
// Never return passwordHash to the client.
function toPublicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
    };
}
//# sourceMappingURL=auth.service.js.map