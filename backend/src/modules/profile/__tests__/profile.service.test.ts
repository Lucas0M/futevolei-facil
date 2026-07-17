import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProfile, updateProfile, updatePassword } from "../profile.service";
import { prisma } from "../../../prisma/client";
import { AppError } from "../../../shared/errors/AppError";
import { comparePassword, hashPassword } from "../../../shared/utils/hash";

vi.mock("../../../prisma/client", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

vi.mock("../../../shared/utils/hash", () => {
  return {
    comparePassword: vi.fn(),
    hashPassword: vi.fn(),
  };
});

describe("Profile Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProfile", () => {
    it("should return user details if user exists", async () => {
      const mockUser = {
        id: "user-1",
        name: "User Test",
        email: "user@test.com",
        phone: "123456",
        role: "PLAYER",
        avatarUrl: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await getProfile("user-1");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockUser);
    });

    it("should throw AppError if user is not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(getProfile("user-invalid")).rejects.toThrow(
        new AppError("Usuário não encontrado.", 404)
      );
    });
  });

  describe("updateProfile", () => {
    it("should update user profile successfully", async () => {
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

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockUser as any)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedUser as any);

      const result = await updateProfile("user-1", mockInput);

      expect(prisma.user.update).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockUpdatedUser);
    });

    it("should throw AppError if new email is already in use by another user", async () => {
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

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockUser as any) // first call: find user-1
        .mockResolvedValueOnce(mockExistingAnotherUser as any); // second call: find email check

      await expect(updateProfile("user-1", mockInput)).rejects.toThrow(
        new AppError("Este e-mail já está em uso.", 400)
      );
    });
  });

  describe("updatePassword", () => {
    it("should update password if current password is correct", async () => {
      const mockUser = {
        id: "user-1",
        passwordHash: "hash-123",
      };

      const mockInput = {
        currentPassword: "correct-password",
        newPassword: "new-password-123",
        confirmPassword: "new-password-123",
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(comparePassword).mockResolvedValue(true);
      vi.mocked(hashPassword).mockResolvedValue("new-hash-123");
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      await updatePassword("user-1", mockInput);

      expect(comparePassword).toHaveBeenCalledWith(
        mockInput.currentPassword,
        mockUser.passwordHash
      );
      expect(hashPassword).toHaveBeenCalledWith(mockInput.newPassword);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { passwordHash: "new-hash-123" },
      });
    });

    it("should throw AppError if current password is wrong", async () => {
      const mockUser = {
        id: "user-1",
        passwordHash: "hash-123",
      };

      const mockInput = {
        currentPassword: "wrong-password",
        newPassword: "new-password-123",
        confirmPassword: "new-password-123",
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(comparePassword).mockResolvedValue(false);

      await expect(updatePassword("user-1", mockInput)).rejects.toThrow(
        new AppError("A senha atual digitada está incorreta.", 400)
      );
    });
  });
});
