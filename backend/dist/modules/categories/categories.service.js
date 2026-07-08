"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.cancelCategory = cancelCategory;
exports.publishCategory = publishCategory;
exports.getCategoryDetail = getCategoryDetail;
exports.generateCategoryBracket = generateCategoryBracket;
const client_1 = require("@prisma/client");
const client_2 = require("../../prisma/client");
const AppError_1 = require("../../shared/errors/AppError");
async function createCategory(tournamentId, input) {
    const tournament = await client_2.prisma.tournament.findUnique({
        where: { id: tournamentId },
    });
    if (!tournament) {
        throw new AppError_1.AppError("Torneio não encontrado.", 404, "TOURNAMENT_NOT_FOUND");
    }
    return client_2.prisma.category.create({
        data: { ...input, tournamentId, status: client_1.EntityStatus.DRAFT },
    });
}
async function updateCategory(categoryId, input) {
    const category = await findCategoryOrThrow(categoryId);
    if (category.status === client_1.EntityStatus.CANCELLED) {
        throw new AppError_1.AppError("Não é possível editar uma categoria cancelada.", 400, "CATEGORY_CANCELLED");
    }
    return client_2.prisma.category.update({ where: { id: categoryId }, data: input });
}
async function cancelCategory(categoryId) {
    const category = await findCategoryOrThrow(categoryId);
    if (category.status === client_1.EntityStatus.CANCELLED) {
        throw new AppError_1.AppError("Esta categoria já está cancelada.", 400, "CATEGORY_ALREADY_CANCELLED");
    }
    return client_2.prisma.category.update({
        where: { id: categoryId },
        data: { status: client_1.EntityStatus.CANCELLED },
    });
}
async function publishCategory(categoryId) {
    const category = await findCategoryOrThrow(categoryId);
    if (category.status !== client_1.EntityStatus.DRAFT) {
        throw new AppError_1.AppError("Apenas categorias em rascunho podem ser publicadas.", 400, "INVALID_STATUS_TRANSITION");
    }
    return client_2.prisma.category.update({
        where: { id: categoryId },
        data: { status: client_1.EntityStatus.PUBLISHED },
    });
}
// Detail view: full info + minimal, non-sensitive registrant list (RN10).
async function getCategoryDetail(categoryId, requesterRole) {
    const category = await client_2.prisma.category.findUnique({
        where: { id: categoryId },
        include: {
            tournament: {
                select: { id: true, name: true, eventDate: true, location: true },
            },
            registrations: {
                select: { status: true, user: { select: { name: true } } },
            },
            teams: {
                select: {
                    status: true,
                    partnerName: true,
                    ownerUser: { select: { name: true } },
                },
            },
        },
    });
    if (!category) {
        throw new AppError_1.AppError("Categoria não encontrada.", 404, "CATEGORY_NOT_FOUND");
    }
    if (category.status === client_1.EntityStatus.DRAFT && requesterRole !== "ADMIN") {
        throw new AppError_1.AppError("Categoria não encontrada.", 404, "CATEGORY_NOT_FOUND");
    }
    const occupiedSlots = category.format === "DUO_FIXED"
        ? category.teams.filter((t) => t.status === "PENDING_PAYMENT" || t.status === "CONFIRMED").length
        : category.registrations.filter((r) => r.status === "PENDING_PAYMENT" || r.status === "CONFIRMED").length;
    return {
        id: category.id,
        name: category.name,
        format: category.format,
        entryFee: category.entryFee,
        maxSlots: category.maxSlots,
        occupiedSlots,
        availableSlots: Math.max(category.maxSlots - occupiedSlots, 0),
        registrationDeadline: category.registrationDeadline,
        status: category.status,
        tournament: category.tournament,
        registrants: category.format === "DUO_FIXED"
            ? category.teams.map((t) => ({
                ownerName: t.ownerUser.name,
                partnerName: t.partnerName,
                status: t.status,
            }))
            : category.registrations.map((r) => ({
                name: r.user.name,
                status: r.status,
            })),
    };
}
async function generateCategoryBracket(categoryId) {
    const category = await client_2.prisma.category.findUnique({
        where: { id: categoryId },
        include: {
            tournament: { select: { name: true } },
            registrations: {
                where: { status: client_1.RegistrationStatus.CONFIRMED },
                include: { user: { select: { id: true, name: true } } },
                orderBy: { createdAt: "asc" },
            },
            teams: {
                where: { status: client_1.TeamRegistrationStatus.CONFIRMED },
                include: { ownerUser: { select: { id: true, name: true } } },
                orderBy: { createdAt: "asc" },
            },
        },
    });
    if (!category) {
        throw new AppError_1.AppError("Categoria não encontrada.", 404, "CATEGORY_NOT_FOUND");
    }
    if (category.status === client_1.EntityStatus.DRAFT ||
        category.status === client_1.EntityStatus.CANCELLED) {
        throw new AppError_1.AppError("Esta categoria ainda não está pronta para gerar chaveamento.", 400, "CATEGORY_NOT_READY");
    }
    const participants = category.format === client_1.CategoryFormat.DUO_FIXED
        ? category.teams.map((team) => ({
            id: team.id,
            name: `${team.ownerUser.name} + ${team.partnerName}`,
            registeredAt: team.createdAt,
        }))
        : category.registrations.map((registration) => ({
            id: registration.id,
            name: registration.user.name,
            registeredAt: registration.createdAt,
        }));
    if (participants.length < 2) {
        throw new AppError_1.AppError("São necessários ao menos dois inscritos confirmados para gerar o chaveamento.", 400, "BRACKET_TOO_SMALL");
    }
    const seededParticipants = shuffleParticipants(participants, category.id);
    const matches = [];
    const byes = [];
    for (let index = 0; index < seededParticipants.length; index += 2) {
        const competitorA = seededParticipants[index];
        const competitorB = seededParticipants[index + 1] ?? null;
        if (!competitorB) {
            byes.push(competitorA);
            continue;
        }
        matches.push({
            position: matches.length + 1,
            competitorA,
            competitorB,
        });
    }
    return {
        categoryId: category.id,
        categoryName: category.name,
        tournamentName: category.tournament.name,
        format: category.format,
        participantCount: participants.length,
        matches,
        byes,
    };
}
function shuffleParticipants(participants, seedSource) {
    const shuffled = [...participants];
    let seed = hashString(seedSource);
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        seed = nextSeed(seed);
        const swapIndex = seed % (index + 1);
        [shuffled[index], shuffled[swapIndex]] = [
            shuffled[swapIndex],
            shuffled[index],
        ];
    }
    return shuffled;
}
function nextSeed(seed) {
    return (Math.imul(seed ^ 0x5bd1e995, 0x6c078965) + 0x7fffffff) >>> 0;
}
function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}
async function findCategoryOrThrow(categoryId) {
    const category = await client_2.prisma.category.findUnique({
        where: { id: categoryId },
    });
    if (!category) {
        throw new AppError_1.AppError("Categoria não encontrada.", 404, "CATEGORY_NOT_FOUND");
    }
    return category;
}
//# sourceMappingURL=categories.service.js.map