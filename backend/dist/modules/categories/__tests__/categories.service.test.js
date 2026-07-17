"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const categories_service_1 = require("../categories.service");
const client_1 = require("../../../prisma/client");
const AppError_1 = require("../../../shared/errors/AppError");
const client_2 = require("@prisma/client");
vitest_1.vi.mock("../../../prisma/client", () => {
    return {
        prisma: {
            tournament: {
                findUnique: vitest_1.vi.fn(),
            },
            category: {
                findUnique: vitest_1.vi.fn(),
                create: vitest_1.vi.fn(),
                update: vitest_1.vi.fn(),
            },
            registration: {
                count: vitest_1.vi.fn(),
            },
            team: {
                count: vitest_1.vi.fn(),
            },
        },
    };
});
(0, vitest_1.describe)("Categories Service", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("createCategory", () => {
        (0, vitest_1.it)("should create a category successfully when tournament exists", async () => {
            const mockTournament = { id: "t-1", name: "Torneio Teste", eventDate: new Date() };
            const mockInput = {
                name: "Iniciante",
                format: client_2.CategoryFormat.INDIVIDUAL,
                entryFee: 100,
                maxSlots: 16,
                registrationDeadline: new Date(),
                reservationTtlMinutes: 20,
                cancellationDeadlineHours: 48,
            };
            const mockCategory = { id: "cat-1", ...mockInput, tournamentId: "t-1", status: client_2.EntityStatus.DRAFT };
            vitest_1.vi.mocked(client_1.prisma.tournament.findUnique).mockResolvedValue(mockTournament);
            vitest_1.vi.mocked(client_1.prisma.category.create).mockResolvedValue(mockCategory);
            const result = await (0, categories_service_1.createCategory)("t-1", mockInput);
            (0, vitest_1.expect)(client_1.prisma.tournament.findUnique).toHaveBeenCalledWith({ where: { id: "t-1" } });
            (0, vitest_1.expect)(client_1.prisma.category.create).toHaveBeenCalledWith({
                data: { ...mockInput, tournamentId: "t-1", status: client_2.EntityStatus.DRAFT },
            });
            (0, vitest_1.expect)(result).toEqual(mockCategory);
        });
        (0, vitest_1.it)("should throw AppError if tournament does not exist", async () => {
            vitest_1.vi.mocked(client_1.prisma.tournament.findUnique).mockResolvedValue(null);
            const mockInput = {
                name: "Iniciante",
                format: client_2.CategoryFormat.INDIVIDUAL,
                entryFee: 100,
                maxSlots: 16,
                registrationDeadline: new Date(),
                reservationTtlMinutes: 20,
                cancellationDeadlineHours: 48,
            };
            await (0, vitest_1.expect)((0, categories_service_1.createCategory)("t-nonexistent", mockInput)).rejects.toThrow(new AppError_1.AppError("Torneio não encontrado.", 404, "TOURNAMENT_NOT_FOUND"));
        });
    });
    (0, vitest_1.describe)("updateCategory", () => {
        const mockCategory = {
            id: "cat-1",
            name: "Iniciante",
            format: client_2.CategoryFormat.INDIVIDUAL,
            entryFee: 100,
            maxSlots: 16,
            registrationDeadline: new Date(),
            status: client_2.EntityStatus.PUBLISHED,
        };
        (0, vitest_1.it)("should update basic fields successfully", async () => {
            const mockInput = { name: "Intermediário Novo" };
            const updatedCategory = { ...mockCategory, name: "Intermediário Novo" };
            vitest_1.vi.mocked(client_1.prisma.category.findUnique).mockResolvedValue(mockCategory);
            vitest_1.vi.mocked(client_1.prisma.category.update).mockResolvedValue(updatedCategory);
            const result = await (0, categories_service_1.updateCategory)("cat-1", mockInput);
            (0, vitest_1.expect)(client_1.prisma.category.update).toHaveBeenCalledWith({
                where: { id: "cat-1" },
                data: mockInput,
            });
            (0, vitest_1.expect)(result).toEqual(updatedCategory);
        });
        (0, vitest_1.it)("should allow updating format if category has 0 active registrations/teams", async () => {
            const mockInput = { format: client_2.CategoryFormat.DUO_FIXED };
            const updatedCategory = { ...mockCategory, format: client_2.CategoryFormat.DUO_FIXED };
            vitest_1.vi.mocked(client_1.prisma.category.findUnique).mockResolvedValue(mockCategory);
            vitest_1.vi.mocked(client_1.prisma.registration.count).mockResolvedValue(0);
            vitest_1.vi.mocked(client_1.prisma.team.count).mockResolvedValue(0);
            vitest_1.vi.mocked(client_1.prisma.category.update).mockResolvedValue(updatedCategory);
            const result = await (0, categories_service_1.updateCategory)("cat-1", mockInput);
            (0, vitest_1.expect)(client_1.prisma.registration.count).toHaveBeenCalled();
            (0, vitest_1.expect)(client_1.prisma.team.count).toHaveBeenCalled();
            (0, vitest_1.expect)(client_1.prisma.category.update).toHaveBeenCalledWith({
                where: { id: "cat-1" },
                data: mockInput,
            });
            (0, vitest_1.expect)(result).toEqual(updatedCategory);
        });
        (0, vitest_1.it)("should throw AppError if updating format but category has active registrations", async () => {
            const mockInput = { format: client_2.CategoryFormat.DUO_FIXED };
            vitest_1.vi.mocked(client_1.prisma.category.findUnique).mockResolvedValue(mockCategory);
            vitest_1.vi.mocked(client_1.prisma.registration.count).mockResolvedValue(1); // 1 active registration
            vitest_1.vi.mocked(client_1.prisma.team.count).mockResolvedValue(0);
            await (0, vitest_1.expect)((0, categories_service_1.updateCategory)("cat-1", mockInput)).rejects.toThrow(new AppError_1.AppError("Não é possível alterar o formato de uma categoria que já possui atletas ou duplas inscritas.", 400, "CATEGORY_HAS_REGISTRATIONS"));
        });
        (0, vitest_1.it)("should throw AppError if updating format but category has active teams", async () => {
            const mockInput = { format: client_2.CategoryFormat.DUO_FIXED };
            vitest_1.vi.mocked(client_1.prisma.category.findUnique).mockResolvedValue(mockCategory);
            vitest_1.vi.mocked(client_1.prisma.registration.count).mockResolvedValue(0);
            vitest_1.vi.mocked(client_1.prisma.team.count).mockResolvedValue(1); // 1 active team
            await (0, vitest_1.expect)((0, categories_service_1.updateCategory)("cat-1", mockInput)).rejects.toThrow(new AppError_1.AppError("Não é possível alterar o formato de uma categoria que já possui atletas ou duplas inscritas.", 400, "CATEGORY_HAS_REGISTRATIONS"));
        });
    });
});
//# sourceMappingURL=categories.service.test.js.map