import { prisma } from "../../prisma/client";
import { AppError } from "../../shared/errors/AppError";

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
  }
  return toPublicUser(user);
}

interface ListUsersParams {
  page: number;
  pageSize: number;
}

// RF22 / paginated per RNF10
export async function listUsers({ page, pageSize }: ListUsersParams) {
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
  ]);

  return {
    data: users.map(toPublicUser),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

// RF05 - only an admin can promote another user to admin (enforced by the
// `authorize("ADMIN")` middleware on the route, not here).
export async function promoteToAdmin(targetUserId: string) {
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: "ADMIN" },
  });

  return toPublicUser(updated);
}

function toPublicUser(user: { id: string; name: string; email: string; phone: string | null; role: string; avatarUrl: string | null; createdAt: Date }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}
