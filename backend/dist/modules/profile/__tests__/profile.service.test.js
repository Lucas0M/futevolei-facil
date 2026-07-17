"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const profile_service_1 = require("../profile.service");
const client_1 = require("../../../prisma/client");
const AppError_1 = require("../../../shared/errors/AppError");
const hash_1 = require("../../../shared/utils/hash");
vitest_1.vi.mock("../../../prisma/client", () => {
    return {
        prisma: {
            user: {
                findUnique: vitest_1.vi.fn(),
                update: vitest_1.vi.fn(),
            },
        },
    };
});
vitest_1.vi.mock("../../../shared/utils/hash", () => {
    return {
        comparePassword: vitest_1.vi.fn(),
        hashPassword: vitest_1.vi.fn(),
    };
});
(0, vitest_1.describe)("Profile Service", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("getProfile", () => {
        (0, vitest_1.it)("should return user details if user exists", async () => {
            const mockUser = {
                id: "user-1",
                name: "User Test",
                email: "user@test.com",
                phone: "123456",
                role: "PLAYER",
                avatarUrl: null,
                createdAt: new Date(),
            };
            vitest_1.vi.mocked(client_1.prisma.user.findUnique).mockResolvedValue(mockUser);
            const result = await (0, profile_service_1.getProfile)("user-1");
            (0, vitest_1.expect)(client_1.prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: "user-1" },
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
            (0, vitest_1.expect)(result).toEqual(mockUser);
        });
        (0, vitest_1.it)("should throw AppError if user is not found", async () => {
            vitest_1.vi.mocked(client_1.prisma.user.findUnique).mockResolvedValue(null);
            await (0, vitest_1.expect)((0, profile_service_1.getProfile)("user-invalid")).rejects.toThrow(new AppError_1.AppError("Usuário não encontrado.", 404));
        });
    });
    (0, vitest_1.describe)("updateProfile", () => {
        (0, vitest_1.it)("should update user profile successfully", async () => {
            const mockUser = {
                id: "user-1",
                name: "User Test",
                email: "user@test.com",
                phone: "123456",
                role: "PLAYER",
                avatarUrl: null,
            };
            const mockInput = {
                name: "User Edited",
                email: "user@edited.com",
                avatarUrl: null,
            };
            const mockUpdatedUser = { ...mockUser, ...mockInput };
            vitest_1.vi.mocked(client_1.prisma.user.findUnique)
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce(null);
            vitest_1.vi.mocked(client_1.prisma.user.update).mockResolvedValue(mockUpdatedUser);
            const result = await (0, profile_service_1.updateProfile)("user-1", mockInput);
            (0, vitest_1.expect)(client_1.prisma.user.update).toHaveBeenCalledWith({
                where: { id: "user-1" },
                data: {
                    name: mockInput.name,
                    email: mockInput.email,
                    avatarUrl: mockInput.avatarUrl,
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
            (0, vitest_1.expect)(result).toEqual(mockUpdatedUser);
        });
        (0, vitest_1.it)("should throw AppError if new email is already in use by another user", async () => {
            const mockUser = {
                id: "user-1",
                name: "User Test",
                email: "user@test.com",
            };
            const mockInput = {
                name: "User Test",
                email: "another@user.com",
                avatarUrl: null,
            };
            const mockExistingAnotherUser = {
                id: "user-2",
                name: "Another User",
                email: "another@user.com",
            };
            vitest_1.vi.mocked(client_1.prisma.user.findUnique)
                .mockResolvedValueOnce(mockUser) // first call: find user-1
                .mockResolvedValueOnce(mockExistingAnotherUser); // second call: find email check
            await (0, vitest_1.expect)((0, profile_service_1.updateProfile)("user-1", mockInput)).rejects.toThrow(new AppError_1.AppError("Este e-mail já está em uso.", 400));
        });
    });
    (0, vitest_1.describe)("updatePassword", () => {
        (0, vitest_1.it)("should update password if current password is correct", async () => {
            const mockUser = {
                id: "user-1",
                passwordHash: "hash-123",
            };
            const mockInput = {
                currentPassword: "correct-password",
                newPassword: "new-password-123",
                confirmPassword: "new-password-123",
            };
            vitest_1.vi.mocked(client_1.prisma.user.findUnique).mockResolvedValue(mockUser);
            vitest_1.vi.mocked(hash_1.comparePassword).mockResolvedValue(true);
            vitest_1.vi.mocked(hash_1.hashPassword).mockResolvedValue("new-hash-123");
            vitest_1.vi.mocked(client_1.prisma.user.update).mockResolvedValue({});
            await (0, profile_service_1.updatePassword)("user-1", mockInput);
            (0, vitest_1.expect)(hash_1.comparePassword).toHaveBeenCalledWith(mockInput.currentPassword, mockUser.passwordHash);
            (0, vitest_1.expect)(hash_1.hashPassword).toHaveBeenCalledWith(mockInput.newPassword);
            (0, vitest_1.expect)(client_1.prisma.user.update).toHaveBeenCalledWith({
                where: { id: "user-1" },
                data: { passwordHash: "new-hash-123" },
            });
        });
        (0, vitest_1.it)("should throw AppError if current password is wrong", async () => {
            const mockUser = {
                id: "user-1",
                passwordHash: "hash-123",
            };
            const mockInput = {
                currentPassword: "wrong-password",
                newPassword: "new-password-123",
                confirmPassword: "new-password-123",
            };
            vitest_1.vi.mocked(client_1.prisma.user.findUnique).mockResolvedValue(mockUser);
            vitest_1.vi.mocked(hash_1.comparePassword).mockResolvedValue(false);
            await (0, vitest_1.expect)((0, profile_service_1.updatePassword)("user-1", mockInput)).rejects.toThrow(new AppError_1.AppError("A senha atual digitada está incorreta.", 400));
        });
    });
});
//# sourceMappingURL=profile.service.test.js.map