"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.updatePassword = updatePassword;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_1 = require("../../prisma/client");
const AppError_1 = require("../../shared/errors/AppError");
const hash_1 = require("../../shared/utils/hash");
const UPLOADS_DIR = path_1.default.join(__dirname, "../../../uploads/avatars");
function saveAvatar(userId, base64DataUrl) {
    const match = base64DataUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
    if (!match) {
        throw new AppError_1.AppError("Formato de imagem inválido.", 400);
    }
    const mimeType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.length > 5 * 1024 * 1024) {
        throw new AppError_1.AppError("A imagem não deve exceder 5MB.", 400);
    }
    let extension = "png";
    if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
        extension = "jpg";
    }
    else if (mimeType === "image/webp") {
        extension = "webp";
    }
    else if (mimeType === "image/gif") {
        extension = "gif";
    }
    if (!fs_1.default.existsSync(UPLOADS_DIR)) {
        fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    const filename = `${userId}_${Date.now()}.${extension}`;
    const filepath = path_1.default.join(UPLOADS_DIR, filename);
    fs_1.default.writeFileSync(filepath, buffer);
    return `/uploads/avatars/${filename}`;
}
async function getProfile(userId) {
    const user = await client_1.prisma.user.findUnique({
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
        throw new AppError_1.AppError("Usuário não encontrado.", 404);
    }
    return user;
}
async function updateProfile(userId, data) {
    const user = await client_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new AppError_1.AppError("Usuário não encontrado.", 404);
    }
    // Validate duplicate email
    if (data.email.toLowerCase() !== user.email.toLowerCase()) {
        const existing = await client_1.prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });
        if (existing) {
            throw new AppError_1.AppError("Este e-mail já está em uso.", 400);
        }
    }
    let finalAvatarUrl = data.avatarUrl;
    if (data.avatarUrl && data.avatarUrl.startsWith("data:")) {
        finalAvatarUrl = saveAvatar(userId, data.avatarUrl);
    }
    const updatedUser = await client_1.prisma.user.update({
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
async function updatePassword(userId, data) {
    const user = await client_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new AppError_1.AppError("Usuário não encontrado.", 404);
    }
    const isCurrentPasswordCorrect = await (0, hash_1.comparePassword)(data.currentPassword, user.passwordHash);
    if (!isCurrentPasswordCorrect) {
        throw new AppError_1.AppError("A senha atual digitada está incorreta.", 400);
    }
    const newPasswordHash = await (0, hash_1.hashPassword)(data.newPassword);
    await client_1.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
    });
}
//# sourceMappingURL=profile.service.js.map