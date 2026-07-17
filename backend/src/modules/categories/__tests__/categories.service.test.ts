import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCategory, updateCategory } from "../categories.service";
import { prisma } from "../../../prisma/client";
import { AppError } from "../../../shared/errors/AppError";
import { CategoryFormat, EntityStatus } from "@prisma/client";

vi.mock("../../../prisma/client", () => {
  return {
    prisma: {
      tournament: {
        findUnique: vi.fn(),
      },
      category: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      registration: {
        count: vi.fn(),
      },
      team: {
        count: vi.fn(),
      },
    },
  };
});

describe("Categories Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCategory", () => {
    it("should create a category successfully when tournament exists", async () => {
      const mockTournament = { id: "t-1", name: "Torneio Teste", eventDate: new Date() };
      const mockInput = {
        name: "Iniciante",
        format: CategoryFormat.INDIVIDUAL,
        entryFee: 100,
        maxSlots: 16,
        registrationDeadline: new Date(),
        reservationTtlMinutes: 20,
        cancellationDeadlineHours: 48,
      };
      const mockCategory = { id: "cat-1", ...mockInput, tournamentId: "t-1", status: EntityStatus.DRAFT };

      vi.mocked(prisma.tournament.findUnique).mockResolvedValue(mockTournament as any);
      vi.mocked(prisma.category.create).mockResolvedValue(mockCategory as any);

      const result = await createCategory("t-1", mockInput);

      expect(prisma.tournament.findUnique).toHaveBeenCalledWith({ where: { id: "t-1" } });
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: { ...mockInput, tournamentId: "t-1", status: EntityStatus.DRAFT },
      });
      expect(result).toEqual(mockCategory);
    });

    it("should throw AppError if tournament does not exist", async () => {
      vi.mocked(prisma.tournament.findUnique).mockResolvedValue(null);

      const mockInput = {
        name: "Iniciante",
        format: CategoryFormat.INDIVIDUAL,
        entryFee: 100,
        maxSlots: 16,
        registrationDeadline: new Date(),
        reservationTtlMinutes: 20,
        cancellationDeadlineHours: 48,
      };

      await expect(createCategory("t-nonexistent", mockInput)).rejects.toThrow(
        new AppError("Torneio não encontrado.", 404, "TOURNAMENT_NOT_FOUND")
      );
    });
  });

  describe("updateCategory", () => {
    const mockCategory = {
      id: "cat-1",
      name: "Iniciante",
      format: CategoryFormat.INDIVIDUAL,
      entryFee: 100,
      maxSlots: 16,
      registrationDeadline: new Date(),
      status: EntityStatus.PUBLISHED,
    };

    it("should update basic fields successfully", async () => {
      const mockInput = { name: "Intermediário Novo" };
      const updatedCategory = { ...mockCategory, name: "Intermediário Novo" };

      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as any);
      vi.mocked(prisma.category.update).mockResolvedValue(updatedCategory as any);

      const result = await updateCategory("cat-1", mockInput);

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: "cat-1" },
        data: mockInput,
      });
      expect(result).toEqual(updatedCategory);
    });

    it("should allow updating format if category has 0 active registrations/teams", async () => {
      const mockInput = { format: CategoryFormat.DUO_FIXED };
      const updatedCategory = { ...mockCategory, format: CategoryFormat.DUO_FIXED };

      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as any);
      vi.mocked(prisma.registration.count).mockResolvedValue(0);
      vi.mocked(prisma.team.count).mockResolvedValue(0);
      vi.mocked(prisma.category.update).mockResolvedValue(updatedCategory as any);

      const result = await updateCategory("cat-1", mockInput);

      expect(prisma.registration.count).toHaveBeenCalled();
      expect(prisma.team.count).toHaveBeenCalled();
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: "cat-1" },
        data: mockInput,
      });
      expect(result).toEqual(updatedCategory);
    });

    it("should throw AppError if updating format but category has active registrations", async () => {
      const mockInput = { format: CategoryFormat.DUO_FIXED };

      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as any);
      vi.mocked(prisma.registration.count).mockResolvedValue(1); // 1 active registration
      vi.mocked(prisma.team.count).mockResolvedValue(0);

      await expect(updateCategory("cat-1", mockInput)).rejects.toThrow(
        new AppError(
          "Não é possível alterar o formato de uma categoria que já possui atletas ou duplas inscritas.",
          400,
          "CATEGORY_HAS_REGISTRATIONS"
        )
      );
    });

    it("should throw AppError if updating format but category has active teams", async () => {
      const mockInput = { format: CategoryFormat.DUO_FIXED };

      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as any);
      vi.mocked(prisma.registration.count).mockResolvedValue(0);
      vi.mocked(prisma.team.count).mockResolvedValue(1); // 1 active team

      await expect(updateCategory("cat-1", mockInput)).rejects.toThrow(
        new AppError(
          "Não é possível alterar o formato de uma categoria que já possui atletas ou duplas inscritas.",
          400,
          "CATEGORY_HAS_REGISTRATIONS"
        )
      );
    });
  });
});
