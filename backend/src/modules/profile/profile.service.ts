import fs from "fs";
import path from "path";
import { prisma } from "../../prisma/client";
import { AppError } from "../../shared/errors/AppError";
import { hashPassword, comparePassword } from "../../shared/utils/hash";
import type { UpdateProfileInput, UpdatePasswordInput } from "./profile.schema";
const UPLOADS_DIR = path.join(__dirname, "../../../uploads/avatars");
function saveAvatar(userId: string, base64DataUrl: string): string {
  const match = base64DataUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
  if (!match) {
    throw new AppError("Formato de imagem inválido.", 400);
  }

  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");

  if (buffer.length > 5 * 1024 * 1024) {
    throw new AppError("A imagem não deve exceder 5MB.", 400);
  }

  return base64DataUrl;
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("Usuário não encontrado.", 404);
  }

  return user;
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("Usuário não encontrado.", 404);
  }

  // Validate duplicate email
  if (data.email.toLowerCase() !== user.email.toLowerCase()) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      throw new AppError("Este e-mail já está em uso.", 400);
    }
  }

  let finalAvatarUrl = data.avatarUrl;
  if (data.avatarUrl && data.avatarUrl.startsWith("data:")) {
    finalAvatarUrl = saveAvatar(userId, data.avatarUrl);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      avatarUrl: finalAvatarUrl,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  return updatedUser;
}

export async function updatePassword(userId: string, data: UpdatePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("Usuário não encontrado.", 404);
  }

  const isCurrentPasswordCorrect = await comparePassword(
    data.currentPassword,
    user.passwordHash
  );

  if (!isCurrentPasswordCorrect) {
    throw new AppError("A senha atual digitada está incorreta.", 400);
  }

  const newPasswordHash = await hashPassword(data.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });
}
