"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = getMe;
exports.listUsers = listUsers;
exports.promoteToAdmin = promoteToAdmin;
const client_1 = require("../../prisma/client");
const AppError_1 = require("../../shared/errors/AppError");
async function getMe(userId) {
    const user = await client_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new AppError_1.AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
    }
    return toPublicUser(user);
}
// RF22 / paginated per RNF10
async function listUsers({ page, pageSize }) {
    const [users, total] = await client_1.prisma.$transaction([
        client_1.prisma.user.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: "desc" },
        }),
        client_1.prisma.user.count(),
    ]);
    return {
        data: users.map(toPublicUser),
        meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
}
// RF05 - only an admin can promote another user to admin (enforced by the
// `authorize("ADMIN")` middleware on the route, not here).
async function promoteToAdmin(targetUserId) {
    const targetUser = await client_1.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
        throw new AppError_1.AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
    }
    const updated = await client_1.prisma.user.update({
        where: { id: targetUserId },
        data: { role: "ADMIN" },
    });
    return toPublicUser(updated);
}
function toPublicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
    };
}
//# sourceMappingURL=users.service.js.map