import crypto from "crypto";
import { prisma } from "../../prisma/client";
import { AppError } from "../../shared/errors/AppError";
import { hashPassword, comparePassword } from "../../shared/utils/hash";
import { signToken } from "../../shared/utils/jwt";
import { sendEmail } from "../../shared/mailer/mailer";
import { passwordResetEmail } from "../../shared/mailer/templates/passwordReset";
import { env } from "../../config/env";
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from "./auth.schema";

const RESET_TOKEN_TTL_MINUTES = 60;

export async function register(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    throw new AppError("Este e-mail já está cadastrado.", 409, "EMAIL_ALREADY_IN_USE");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
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

  const token = signToken({ sub: user.id, role: user.role });

  return { user: toPublicUser(user), token };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppError("E-mail ou senha inválidos.", 401, "INVALID_CREDENTIALS");
  }

  const passwordMatches = await comparePassword(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError("E-mail ou senha inválidos.", 401, "INVALID_CREDENTIALS");
  }

  const token = signToken({ sub: user.id, role: user.role });

  return { user: toPublicUser(user), token };
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Always respond the same way whether the user exists or not, so an
  // attacker cannot use this endpoint to discover which emails are registered.
  if (!user) {
    return;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      token: rawToken,
      userId: user.id,
      expiresAt,
    },
  });

  const resetLink = `${env.FRONTEND_URL}/redefinir-senha?token=${rawToken}`;
  const { subject, html } = passwordResetEmail({ userName: user.name, resetLink });

  await sendEmail({ to: user.email, subject, html });
}

export async function resetPassword(input: ResetPasswordInput) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: input.token },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new AppError("Link de redefinição inválido ou expirado.", 400, "INVALID_RESET_TOKEN");
  }

  const passwordHash = await hashPassword(input.newPassword);

  // Both writes happen together: if updating the password fails, we don't
  // want to mark the token as used.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);
}

// Never return passwordHash to the client.
function toPublicUser(user: { id: string; name: string; email: string; phone: string | null; role: string; avatarUrl: string | null }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
}
