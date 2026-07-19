"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
exports.publishCategory = publishCategory;
exports.getCategoryDetail = getCategoryDetail;
exports.generateCategoryBracket = generateCategoryBracket;
exports.generatePersistentBracket = generatePersistentBracket;
exports.resetMatchWinner = resetMatchWinner;
exports.updateMatchWinner = updateMatchWinner;
exports.recalculateRankings = recalculateRankings;
exports.formatMatchupNames = formatMatchupNames;
exports.updateMatchManual = updateMatchManual;
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
    // If format is being updated and is different from current
    if (input.format && input.format !== category.format) {
        const registrationsCount = await client_2.prisma.registration.count({
            where: { categoryId, status: { not: "CANCELLED" } },
        });
        const teamsCount = await client_2.prisma.team.count({
            where: { categoryId, status: { not: "CANCELLED" } },
        });
        if (registrationsCount > 0 || teamsCount > 0) {
            throw new AppError_1.AppError("Não é possível alterar o formato de uma categoria que já possui atletas ou duplas inscritas.", 400, "CATEGORY_HAS_REGISTRATIONS");
        }
    }
    return client_2.prisma.category.update({ where: { id: categoryId }, data: input });
}
async function deleteCategory(categoryId) {
    const category = await findCategoryOrThrow(categoryId);
    return client_2.prisma.$transaction(async (tx) => {
        // 1. Get all registrations and teams
        const registrations = await tx.registration.findMany({
            where: { categoryId },
            select: { id: true },
        });
        const registrationIds = registrations.map((r) => r.id);
        const teams = await tx.team.findMany({
            where: { categoryId },
            select: { id: true },
        });
        const teamIds = teams.map((t) => t.id);
        // 2. Get all payments
        const payments = await tx.payment.findMany({
            where: {
                OR: [
                    { registrationId: { in: registrationIds } },
                    { teamId: { in: teamIds } },
                ],
            },
            select: { id: true },
        });
        const paymentIds = payments.map((p) => p.id);
        if (paymentIds.length > 0) {
            // 3. Delete webhook events
            await tx.webhookEvent.deleteMany({
                where: { paymentId: { in: paymentIds } },
            });
            // 4. Delete payments
            await tx.payment.deleteMany({
                where: { id: { in: paymentIds } },
            });
        }
        if (registrationIds.length > 0) {
            await tx.registration.deleteMany({
                where: { id: { in: registrationIds } },
            });
        }
        if (teamIds.length > 0) {
            await tx.team.deleteMany({
                where: { id: { in: teamIds } },
            });
        }
        // 5. Delete category
        return tx.category.delete({
            where: { id: categoryId },
        });
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
                select: { id: true, status: true, customPlayerName: true, user: { select: { name: true } } },
            },
            teams: {
                select: {
                    id: true,
                    status: true,
                    partnerName: true,
                    customOwnerName: true,
                    ownerUser: { select: { name: true } },
                },
            },
            matches: {
                orderBy: [{ round: "asc" }, { position: "asc" }],
            },
        },
    });
    if (!category) {
        throw new AppError_1.AppError("Categoria não encontrada.", 404, "CATEGORY_NOT_FOUND");
    }
    if (category.status === client_1.EntityStatus.DRAFT && requesterRole !== "ADMIN" && requesterRole !== "SUPERADMIN") {
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
        winnerName: category.winnerName,
        bracketStyle: category.bracketStyle,
        matches: formatMatchupNames(category.matches),
        registrants: category.format === "DUO_FIXED"
            ? category.teams.map((t) => ({
                kind: "team",
                id: t.id,
                ownerName: t.customOwnerName ?? t.ownerUser.name,
                partnerName: t.partnerName,
                status: t.status,
            }))
            : category.registrations.map((r) => ({
                kind: "registration",
                id: r.id,
                name: r.customPlayerName ?? r.user.name,
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
function getRouteTarget(type, round, pos, isWinner, totalWinnerRounds, K, numRound1Matches, hasReduction) {
    const totalLoserRounds = hasReduction ? (numRound1Matches <= K / 2 ? 2 * totalWinnerRounds - 4 : 2 * totalWinnerRounds - 3) : 2 * totalWinnerRounds - 3;
    if (isWinner) {
        if (type === "WINNER") {
            if (round === totalWinnerRounds) {
                return { targetType: "GRAND_FINAL", targetRound: 1, targetPos: 1, targetSlot: "A" };
            }
            if (hasReduction && round === 1) {
                const useOddSpacing = numRound1Matches <= K / 4;
                if (useOddSpacing) {
                    const targetPos = 2 * pos - 1;
                    return { targetType: "WINNER", targetRound: 2, targetPos, targetSlot: "B" };
                }
                else {
                    const numPositionsWithBye = K - numRound1Matches;
                    if (pos <= numPositionsWithBye) {
                        return { targetType: "WINNER", targetRound: 2, targetPos: pos, targetSlot: "B" };
                    }
                    else {
                        const offset = pos - numPositionsWithBye - 1;
                        const targetPos = numPositionsWithBye + Math.floor(offset / 2) + 1;
                        const targetSlot = offset % 2 === 0 ? "A" : "B";
                        return { targetType: "WINNER", targetRound: 2, targetPos, targetSlot };
                    }
                }
            }
            const nextPos = Math.floor((pos - 1) / 2) + 1;
            const slot = (pos - 1) % 2 === 0 ? "A" : "B";
            return { targetType: "WINNER", targetRound: round + 1, targetPos: nextPos, targetSlot: slot };
        }
        if (type === "LOSER") {
            if (round === totalLoserRounds) {
                return { targetType: "GRAND_FINAL", targetRound: 1, targetPos: 1, targetSlot: "B" };
            }
            if (round % 2 !== 0) {
                // Odd rounds: 1 -> 2, 3 -> 4, 5 -> 6 (same number of matches)
                const slot = round === 1 ? "B" : "A";
                return { targetType: "LOSER", targetRound: round + 1, targetPos: pos, targetSlot: slot };
            }
            else {
                // Even rounds: 2 -> 3, 4 -> 5 (half the matches)
                const nextPos = Math.floor((pos - 1) / 2) + 1;
                const slot = (pos - 1) % 2 === 0 ? "A" : "B";
                return { targetType: "LOSER", targetRound: round + 1, targetPos: nextPos, targetSlot: slot };
            }
        }
        return null;
    }
    else {
        if (type === "WINNER") {
            if (round === totalWinnerRounds) {
                return { targetType: "THIRD_PLACE", targetRound: 1, targetPos: 1, targetSlot: "A" };
            }
            if (hasReduction) {
                if (round === 1) {
                    if (numRound1Matches <= K / 2) {
                        return { targetType: "LOSER", targetRound: 1, targetPos: pos, targetSlot: "B" };
                    }
                    else {
                        const numPositionsWithBye = K - numRound1Matches;
                        if (pos <= numPositionsWithBye) {
                            const loserRound1Matches = numRound1Matches - K / 2;
                            return { targetType: "LOSER", targetRound: 2, targetPos: loserRound1Matches + pos, targetSlot: "B" };
                        }
                        else {
                            const offset = pos - numPositionsWithBye - 1;
                            const targetPos = Math.floor(offset / 2) + 1;
                            const targetSlot = offset % 2 === 0 ? "A" : "B";
                            return { targetType: "LOSER", targetRound: 1, targetPos, targetSlot };
                        }
                    }
                }
                if (round === 2) {
                    const useOddSpacing = numRound1Matches <= K / 4;
                    const receivesWinner = useOddSpacing ? (pos % 2 !== 0 && (pos + 1) / 2 <= numRound1Matches) : (pos <= numRound1Matches);
                    const loserRound1Matches = numRound1Matches <= K / 2 ? numRound1Matches : numRound1Matches - K / 2;
                    const numWinnerRound2LosersToLoserRound1 = Math.max(0, 2 * loserRound1Matches - numRound1Matches);
                    const goesToLoserRound1 = receivesWinner && (useOddSpacing || pos <= numWinnerRound2LosersToLoserRound1);
                    if (goesToLoserRound1) {
                        const r1_pos = useOddSpacing ? (pos + 1) / 2 : pos;
                        const targetPos = useOddSpacing ? (numRound1Matches + 1 - r1_pos) : (numWinnerRound2LosersToLoserRound1 + 1 - r1_pos);
                        return { targetType: "LOSER", targetRound: 1, targetPos, targetSlot: "A" };
                    }
                    else {
                        let j = 0;
                        for (let p = 1; p <= pos; p++) {
                            const pReceives = useOddSpacing ? (p % 2 !== 0 && (p + 1) / 2 <= numRound1Matches) : (p <= numRound1Matches);
                            const pGoesToR1 = pReceives && (useOddSpacing || p <= numWinnerRound2LosersToLoserRound1);
                            if (!pGoesToR1)
                                j++;
                        }
                        return { targetType: "LOSER", targetRound: 2, targetPos: j, targetSlot: "A" };
                    }
                }
                if (round === totalWinnerRounds - 1) {
                    return { targetType: "LOSER", targetRound: 2 * round - 2, targetPos: pos, targetSlot: "B" };
                }
                return { targetType: "LOSER", targetRound: 2 * round - 2, targetPos: pos, targetSlot: "A" };
            }
            else {
                if (round === 1) {
                    const targetPos = Math.floor((pos - 1) / 2) + 1;
                    const slot = (pos - 1) % 2 === 0 ? "A" : "B";
                    return { targetType: "LOSER", targetRound: 1, targetPos, targetSlot: slot };
                }
                return { targetType: "LOSER", targetRound: 2 * round - 2, targetPos: pos, targetSlot: "A" };
            }
        }
        if (type === "LOSER") {
            if (round === totalLoserRounds) {
                return { targetType: "THIRD_PLACE", targetRound: 1, targetPos: 1, targetSlot: "B" };
            }
        }
    }
    return null;
}
async function generatePersistentBracket(categoryId, bracketStyle = "DOUBLE_ELIMINATION", numGroups = 2) {
    const category = await client_2.prisma.category.findUnique({
        where: { id: categoryId },
        include: {
            registrations: {
                where: { status: "CONFIRMED" },
                include: { user: { select: { name: true } } },
            },
            teams: {
                where: { status: "CONFIRMED" },
                include: { ownerUser: { select: { name: true } } },
            },
            tournament: { select: { name: true } },
        },
    });
    if (!category)
        throw new AppError_1.AppError("Categoria não encontrada.", 404);
    let participants = [];
    if (category.format === "DUO_FIXED") {
        participants = category.teams.map((t) => ({ id: t.id, name: `${t.ownerUser.name} + ${t.partnerName}` }));
    }
    else if (category.format === "DUO_RANDOM") {
        const players = category.registrations.map((r) => ({ id: r.id, name: r.customPlayerName ?? r.user.name }));
        const shuffledPlayers = [...players];
        for (let i = shuffledPlayers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
        }
        const paired = [];
        for (let i = 0; i < shuffledPlayers.length; i += 2) {
            if (i + 1 < shuffledPlayers.length) {
                paired.push({
                    id: `${shuffledPlayers[i].id}_${shuffledPlayers[i + 1].id}`,
                    name: `${shuffledPlayers[i].name} + ${shuffledPlayers[i + 1].name}`
                });
            }
            else {
                paired.push({
                    id: shuffledPlayers[i].id,
                    name: `${shuffledPlayers[i].name} + [A definir]`
                });
            }
        }
        participants = paired;
    }
    else {
        participants = category.registrations.map((r) => ({ id: r.id, name: r.customPlayerName ?? r.user.name }));
    }
    if (participants.length < 2) {
        throw new AppError_1.AppError("São necessários ao menos 2 participantes confirmados.", 400);
    }
    return client_2.prisma.$transaction(async (tx) => {
        await tx.match.deleteMany({ where: { categoryId } });
        await tx.category.update({
            where: { id: categoryId },
            data: { winnerName: null, bracketStyle },
        });
        if (bracketStyle === "GROUPS") {
            await generateGroupsBracketInternal(tx, categoryId, participants, numGroups);
            return tx.match.findMany({
                where: { categoryId },
                orderBy: [{ round: "asc" }, { position: "asc" }],
            });
        }
        const shuffled = shuffleParticipants(participants, Math.random().toString());
        const P = shuffled.length;
        let K = 2;
        while (K * 2 <= P) {
            K *= 2;
        }
        if (P === 2)
            K = 2;
        const hasReduction = P > K;
        const numRound1Matches = hasReduction ? P - K : 0;
        const totalWinnerRounds = hasReduction ? Math.log2(K) + 1 : Math.log2(K);
        const totalLoserRounds = hasReduction ? (numRound1Matches <= K / 2 ? 2 * totalWinnerRounds - 4 : 2 * totalWinnerRounds - 3) : 2 * totalWinnerRounds - 3;
        const matchesToCreate = [];
        // 1. Winner Bracket Matches
        if (hasReduction) {
            for (let pos = 1; pos <= numRound1Matches; pos++) {
                matchesToCreate.push({
                    categoryId,
                    round: 1,
                    position: pos,
                    bracketType: "WINNER",
                    competitorAId: null,
                    competitorAName: null,
                    competitorBId: null,
                    competitorBName: null,
                    winnerId: null,
                    score: null,
                });
            }
            for (let r = 2; r <= totalWinnerRounds; r++) {
                const matchesInRound = K / Math.pow(2, r - 1);
                for (let pos = 1; pos <= matchesInRound; pos++) {
                    matchesToCreate.push({
                        categoryId,
                        round: r,
                        position: pos,
                        bracketType: "WINNER",
                        competitorAId: null,
                        competitorAName: null,
                        competitorBId: null,
                        competitorBName: null,
                        winnerId: null,
                        score: null,
                    });
                }
            }
        }
        else {
            for (let r = 1; r <= totalWinnerRounds; r++) {
                const matchesInRound = K / Math.pow(2, r);
                for (let pos = 1; pos <= matchesInRound; pos++) {
                    matchesToCreate.push({
                        categoryId,
                        round: r,
                        position: pos,
                        bracketType: "WINNER",
                        competitorAId: null,
                        competitorAName: null,
                        competitorBId: null,
                        competitorBName: null,
                        winnerId: null,
                        score: null,
                    });
                }
            }
        }
        // 2. Loser Bracket Matches
        if (hasReduction) {
            const loserRound1Matches = numRound1Matches <= K / 2 ? numRound1Matches : numRound1Matches - K / 2;
            const loserRound2Matches = K / 2;
            // Loser Round 1: loserRound1Matches matches
            for (let pos = 1; pos <= loserRound1Matches; pos++) {
                matchesToCreate.push({
                    categoryId,
                    round: 1,
                    position: pos,
                    bracketType: "LOSER",
                    competitorAId: null,
                    competitorAName: null,
                    competitorBId: null,
                    competitorBName: null,
                    winnerId: null,
                    score: null,
                });
            }
            // Loser Round 2: loserRound2Matches matches
            for (let pos = 1; pos <= loserRound2Matches; pos++) {
                matchesToCreate.push({
                    categoryId,
                    round: 2,
                    position: pos,
                    bracketType: "LOSER",
                    competitorAId: null,
                    competitorAName: null,
                    competitorBId: null,
                    competitorBName: null,
                    winnerId: null,
                    score: null,
                });
            }
            // Loser Rounds 3 onwards
            for (let r = 3; r <= totalLoserRounds; r++) {
                let matchesInRound = 0;
                if (r % 2 !== 0) {
                    const wr = (r + 3) / 2;
                    matchesInRound = K / Math.pow(2, wr - 1);
                }
                else {
                    const prevRound = r - 1;
                    const wr = (prevRound + 3) / 2;
                    const prevMatches = K / Math.pow(2, wr - 1);
                    matchesInRound = prevMatches;
                }
                for (let pos = 1; pos <= matchesInRound; pos++) {
                    matchesToCreate.push({
                        categoryId,
                        round: r,
                        position: pos,
                        bracketType: "LOSER",
                        competitorAId: null,
                        competitorAName: null,
                        competitorBId: null,
                        competitorBName: null,
                        winnerId: null,
                        score: null,
                    });
                }
            }
        }
        else {
            for (let wr = 1; wr <= totalWinnerRounds - 1; wr++) {
                const minorRound = 2 * wr - 1;
                if (minorRound <= totalLoserRounds) {
                    const minorMatches = K / Math.pow(2, wr + 1);
                    for (let pos = 1; pos <= minorMatches; pos++) {
                        matchesToCreate.push({
                            categoryId,
                            round: minorRound,
                            position: pos,
                            bracketType: "LOSER",
                            competitorAId: null,
                            competitorAName: null,
                            competitorBId: null,
                            competitorBName: null,
                            winnerId: null,
                            score: null,
                        });
                    }
                }
                const majorRound = 2 * wr;
                if (majorRound <= totalLoserRounds) {
                    const majorMatches = K / Math.pow(2, wr + 1);
                    for (let pos = 1; pos <= majorMatches; pos++) {
                        matchesToCreate.push({
                            categoryId,
                            round: majorRound,
                            position: pos,
                            bracketType: "LOSER",
                            competitorAId: null,
                            competitorAName: null,
                            competitorBId: null,
                            competitorBName: null,
                            winnerId: null,
                            score: null,
                        });
                    }
                }
            }
        }
        // 3. Grand Final
        matchesToCreate.push({
            categoryId,
            round: 1,
            position: 1,
            bracketType: "GRAND_FINAL",
            competitorAId: null,
            competitorAName: null,
            competitorBId: null,
            competitorBName: null,
            winnerId: null,
            score: null,
        });
        // 4. Reset Final
        matchesToCreate.push({
            categoryId,
            round: 1,
            position: 1,
            bracketType: "RESET_FINAL",
            competitorAId: null,
            competitorAName: null,
            competitorBId: null,
            competitorBName: null,
            winnerId: null,
            score: null,
        });
        // 5. Third Place Match
        matchesToCreate.push({
            categoryId,
            round: 1,
            position: 1,
            bracketType: "THIRD_PLACE",
            competitorAId: null,
            competitorAName: null,
            competitorBId: null,
            competitorBName: null,
            winnerId: null,
            score: null,
        });
        const createdMatches = await Promise.all(matchesToCreate.map((m) => tx.match.create({ data: m })));
        const round1WinnerMatches = createdMatches.filter((m) => m.round === 1 && m.bracketType === "WINNER");
        if (hasReduction) {
            for (let idx = 0; idx < numRound1Matches; idx++) {
                const match = round1WinnerMatches.find((m) => m.position === idx + 1);
                if (match) {
                    match.competitorAId = shuffled[2 * idx].id;
                    match.competitorAName = shuffled[2 * idx].name;
                    match.competitorBId = shuffled[2 * idx + 1].id;
                    match.competitorBName = shuffled[2 * idx + 1].name;
                    await tx.match.update({
                        where: { id: match.id },
                        data: {
                            competitorAId: match.competitorAId,
                            competitorAName: match.competitorAName,
                            competitorBId: match.competitorBId,
                            competitorBName: match.competitorBName,
                        },
                    });
                }
            }
            const round2WinnerMatches = createdMatches.filter((m) => m.round === 2 && m.bracketType === "WINNER");
            const useOddSpacing = numRound1Matches <= K / 4;
            let byeIdx = 2 * numRound1Matches;
            for (let pos = 1; pos <= K / 2; pos++) {
                const receivesWinner = useOddSpacing ? (pos % 2 !== 0 && (pos + 1) / 2 <= numRound1Matches) : (pos <= numRound1Matches);
                const match = round2WinnerMatches.find((m) => m.position === pos);
                if (match) {
                    if (receivesWinner) {
                        if (byeIdx < P) {
                            match.competitorAId = shuffled[byeIdx].id;
                            match.competitorAName = shuffled[byeIdx].name;
                            byeIdx++;
                        }
                    }
                    else {
                        if (byeIdx < P) {
                            match.competitorAId = shuffled[byeIdx].id;
                            match.competitorAName = shuffled[byeIdx].name;
                            byeIdx++;
                        }
                        if (byeIdx < P) {
                            match.competitorBId = shuffled[byeIdx].id;
                            match.competitorBName = shuffled[byeIdx].name;
                            byeIdx++;
                        }
                    }
                    await tx.match.update({
                        where: { id: match.id },
                        data: {
                            competitorAId: match.competitorAId,
                            competitorAName: match.competitorAName,
                            competitorBId: match.competitorBId,
                            competitorBName: match.competitorBName,
                        },
                    });
                }
            }
        }
        else {
            for (let idx = 0; idx < round1WinnerMatches.length; idx++) {
                const match = round1WinnerMatches[idx];
                const p1Idx = 2 * idx;
                const p2Idx = 2 * idx + 1;
                if (p1Idx < P) {
                    match.competitorAId = shuffled[p1Idx].id;
                    match.competitorAName = shuffled[p1Idx].name;
                }
                if (p2Idx < P) {
                    match.competitorBId = shuffled[p2Idx].id;
                    match.competitorBName = shuffled[p2Idx].name;
                }
                await tx.match.update({
                    where: { id: match.id },
                    data: {
                        competitorAId: match.competitorAId,
                        competitorAName: match.competitorAName,
                        competitorBId: match.competitorBId,
                        competitorBName: match.competitorBName,
                    },
                });
            }
        }
        const potentials = await getCategoryPotentials(tx, categoryId);
        const matchesToPropagate = createdMatches.filter((m) => m.bracketType === "WINNER" && (m.round === 1 || (hasReduction && m.round === 2)));
        for (const m of matchesToPropagate) {
            await checkAndResolveWO(tx, categoryId, m.id);
        }
        await recalculateRankings(tx);
        return tx.match.findMany({
            where: { categoryId },
            orderBy: [{ round: "asc" }, { position: "asc" }],
        });
    });
}
async function resetMatchResult(tx, categoryId, matchId) {
    const match = await tx.match.findUnique({ where: { id: matchId } });
    if (!match || !match.winnerId)
        return;
    await tx.match.update({
        where: { id: matchId },
        data: { winnerId: null, score: null }
    });
    const matches = await tx.match.findMany({ where: { categoryId } });
    const totalWinnerRounds = Math.max(...matches.filter((m) => m.bracketType === "WINNER").map((m) => m.round));
    const category = await tx.category.findUnique({
        where: { id: categoryId },
        include: {
            registrations: { where: { status: "CONFIRMED" } },
            teams: { where: { status: "CONFIRMED" } },
        }
    });
    const exactP = category.format === "DUO_FIXED" ? category.teams.length : category.registrations.length;
    let K = 2;
    while (K * 2 <= exactP) {
        K *= 2;
    }
    if (exactP === 2)
        K = 2;
    const hasReduction = exactP > K;
    const numRound1Matches = hasReduction ? exactP - K : 0;
    const winnerRoute = getRouteTarget(match.bracketType, match.round, match.position, true, totalWinnerRounds, K, numRound1Matches, hasReduction);
    if (winnerRoute) {
        const destMatch = await tx.match.findFirst({
            where: { categoryId, round: winnerRoute.targetRound, position: winnerRoute.targetPos, bracketType: winnerRoute.targetType }
        });
        if (destMatch) {
            const updateData = {};
            if (winnerRoute.targetSlot === "A") {
                updateData.competitorAId = null;
                updateData.competitorAName = null;
            }
            else {
                updateData.competitorBId = null;
                updateData.competitorBName = null;
            }
            await tx.match.update({ where: { id: destMatch.id }, data: updateData });
            await resetMatchResult(tx, categoryId, destMatch.id);
        }
    }
    const loserRoute = getRouteTarget(match.bracketType, match.round, match.position, false, totalWinnerRounds, K, numRound1Matches, hasReduction);
    if (loserRoute) {
        const destMatch = await tx.match.findFirst({
            where: { categoryId, round: loserRoute.targetRound, position: loserRoute.targetPos, bracketType: loserRoute.targetType }
        });
        if (destMatch) {
            const updateData = {};
            if (loserRoute.targetSlot === "A") {
                updateData.competitorAId = null;
                updateData.competitorAName = null;
            }
            else {
                updateData.competitorBId = null;
                updateData.competitorBName = null;
            }
            await tx.match.update({ where: { id: destMatch.id }, data: updateData });
            await resetMatchResult(tx, categoryId, destMatch.id);
        }
    }
}
async function resetMatchWinner(matchId) {
    return client_2.prisma.$transaction(async (tx) => {
        const match = await tx.match.findUnique({ where: { id: matchId } });
        if (!match)
            throw new AppError_1.AppError("Partida não encontrada.", 404);
        await resetMatchResult(tx, match.categoryId, matchId);
        await recalculateRankings(tx);
        return tx.match.findUnique({ where: { id: matchId } });
    });
}
async function updateMatchWinner(matchId, winnerId, score) {
    return client_2.prisma.$transaction(async (tx) => {
        const match = await tx.match.findUnique({ where: { id: matchId } });
        if (!match)
            throw new AppError_1.AppError("Partida não encontrada.", 404);
        const winnerName = winnerId === match.competitorAId ? match.competitorAName : match.competitorBName;
        if (!winnerName)
            throw new AppError_1.AppError("Vencedor inválido.", 400);
        const loserId = winnerId === match.competitorAId ? match.competitorBId : match.competitorAId;
        const loserName = winnerId === match.competitorAId ? match.competitorBName : match.competitorAName;
        const updatedMatch = await tx.match.update({
            where: { id: matchId },
            data: { winnerId, score },
        });
        const matches = await tx.match.findMany({ where: { categoryId: match.categoryId } });
        const totalWinnerRounds = Math.max(...matches.filter((m) => m.bracketType === "WINNER").map((m) => m.round));
        const category = await tx.category.findUnique({
            where: { id: match.categoryId },
            include: {
                registrations: { where: { status: "CONFIRMED" } },
                teams: { where: { status: "CONFIRMED" } },
            }
        });
        if (!category)
            throw new AppError_1.AppError("Categoria não encontrada.", 404);
        const exactP = category.format === "DUO_FIXED" ? category.teams.length : category.registrations.length;
        let K = 2;
        while (K * 2 <= exactP) {
            K *= 2;
        }
        if (exactP === 2)
            K = 2;
        const hasReduction = exactP > K;
        const numRound1Matches = hasReduction ? exactP - K : 0;
        const totalLoserRounds = matches.filter((m) => m.bracketType === "LOSER").reduce((max, m) => m.round > max ? m.round : max, 0);
        if ((match.bracketType === "WINNER" || (match.bracketType === "LOSER" && match.round === totalLoserRounds)) && loserId && loserName) {
            await routeLoser(tx, match.categoryId, match.round, match.position, loserId, loserName, totalWinnerRounds, K, numRound1Matches, hasReduction, match.bracketType);
        }
        await advanceWinner(tx, match.categoryId, match.round, match.position, winnerId, winnerName, match.bracketType, totalWinnerRounds, K, numRound1Matches, hasReduction);
        await recalculateRankings(tx);
        return updatedMatch;
    });
}
async function routeLoser(tx, categoryId, currentRound, currentPosition, loserId, loserName, totalWinnerRounds, K, numRound1Matches, hasReduction, bracketType) {
    if (!loserId)
        return;
    const route = getRouteTarget(bracketType, currentRound, currentPosition, false, totalWinnerRounds, K, numRound1Matches, hasReduction);
    if (!route)
        return;
    const destMatch = await tx.match.findFirst({
        where: { categoryId, round: route.targetRound, position: route.targetPos, bracketType: route.targetType }
    });
    if (destMatch) {
        const updateData = {};
        if (route.targetSlot === "A") {
            updateData.competitorAId = loserId;
            updateData.competitorAName = loserName;
        }
        else {
            updateData.competitorBId = loserId;
            updateData.competitorBName = loserName;
        }
        const updated = await tx.match.update({
            where: { id: destMatch.id },
            data: updateData
        });
        await checkAndResolveWO(tx, categoryId, updated.id);
    }
}
async function advanceWinner(tx, categoryId, currentRound, currentPosition, winnerId, winnerName, bracketType, totalWinnerRounds, K, numRound1Matches, hasReduction) {
    if (!winnerId)
        return;
    const route = getRouteTarget(bracketType, currentRound, currentPosition, true, totalWinnerRounds, K, numRound1Matches, hasReduction);
    if (route) {
        const nextMatch = await tx.match.findFirst({
            where: { categoryId, round: route.targetRound, position: route.targetPos, bracketType: route.targetType },
        });
        if (nextMatch) {
            const updateData = {};
            if (route.targetSlot === "A") {
                updateData.competitorAId = winnerId;
                updateData.competitorAName = winnerName;
            }
            else {
                updateData.competitorBId = winnerId;
                updateData.competitorBName = winnerName;
            }
            const updated = await tx.match.update({ where: { id: nextMatch.id }, data: updateData });
            await checkAndResolveWO(tx, categoryId, updated.id);
        }
    }
    else if (bracketType === "GRAND_FINAL") {
        const gf = await tx.match.findFirst({ where: { categoryId, bracketType: "GRAND_FINAL" } });
        if (gf) {
            if (winnerId === gf.competitorBId) {
                const rf = await tx.match.findFirst({
                    where: { categoryId, bracketType: "RESET_FINAL" }
                });
                if (rf) {
                    await tx.match.update({
                        where: { id: rf.id },
                        data: {
                            competitorAId: gf.competitorAId,
                            competitorAName: gf.competitorAName,
                            competitorBId: gf.competitorBId,
                            competitorBName: gf.competitorBName,
                        }
                    });
                }
            }
            else {
                await tx.category.update({
                    where: { id: categoryId },
                    data: { winnerName },
                });
            }
        }
    }
    else if (bracketType === "RESET_FINAL") {
        await tx.category.update({
            where: { id: categoryId },
            data: { winnerName },
        });
    }
}
async function getCategoryPotentials(tx, categoryId) {
    const matches = await tx.match.findMany({ where: { categoryId } });
    const round1WinnerMatches = matches.filter((m) => m.round === 1 && m.bracketType === "WINNER");
    const totalRounds = Math.max(...matches.filter((m) => m.bracketType === "WINNER").map((m) => m.round));
    const category = await tx.category.findUnique({
        where: { id: categoryId },
        include: {
            registrations: { where: { status: "CONFIRMED" } },
            teams: { where: { status: "CONFIRMED" } },
        }
    });
    const exactP = category.format === "DUO_FIXED" ? category.teams.length : category.registrations.length;
    let K = 2;
    while (K * 2 <= exactP) {
        K *= 2;
    }
    if (exactP === 2)
        K = 2;
    const hasReduction = exactP > K;
    const numRound1Matches = hasReduction ? exactP - K : 0;
    const potentials = {};
    const getKey = (type, round, pos) => `${type}_${round}_${pos}`;
    // Initialize all matches from DB
    for (const m of matches) {
        potentials[getKey(m.bracketType, m.round, m.position)] = {
            hasA: m.round === 1 && m.bracketType === "WINNER" ? m.competitorAId != null : false,
            hasB: m.round === 1 && m.bracketType === "WINNER" ? m.competitorBId != null : false,
        };
    }
    // Seed bye inputs for Winner Round 2 if they are saved in Round 2 directly (e.g., when hasReduction is true)
    const round2WinnerMatches = matches.filter((m) => m.round === 2 && m.bracketType === "WINNER");
    for (const m of round2WinnerMatches) {
        const key = getKey("WINNER", 2, m.position);
        if (m.competitorAId)
            potentials[key].hasA = true;
        if (m.competitorBId)
            potentials[key].hasB = true;
    }
    // Queue for propagation
    const queue = [];
    for (const k in potentials) {
        if (potentials[k].hasA || potentials[k].hasB) {
            queue.push(k);
        }
    }
    const parseKey = (key) => {
        const parts = key.split("_");
        const pos = parseInt(parts.pop(), 10);
        const round = parseInt(parts.pop(), 10);
        const type = parts.join("_");
        return { type, round, pos };
    };
    while (queue.length > 0) {
        const currentKey = queue.shift();
        const { type, round, pos } = parseKey(currentKey);
        const pot = potentials[currentKey];
        const hasWinner = pot.hasA || pot.hasB;
        const hasLoser = pot.hasA && pot.hasB;
        if (hasWinner) {
            const route = getRouteTarget(type, round, pos, true, totalRounds, K, numRound1Matches, hasReduction);
            if (route) {
                const targetKey = getKey(route.targetType, route.targetRound, route.targetPos);
                if (potentials[targetKey]) {
                    const targetPot = potentials[targetKey];
                    const prevHas = route.targetSlot === "A" ? targetPot.hasA : targetPot.hasB;
                    if (route.targetSlot === "A")
                        targetPot.hasA = true;
                    else
                        targetPot.hasB = true;
                    if (prevHas !== true) {
                        if (!queue.includes(targetKey))
                            queue.push(targetKey);
                    }
                }
            }
        }
        if (hasLoser) {
            const route = getRouteTarget(type, round, pos, false, totalRounds, K, numRound1Matches, hasReduction);
            if (route) {
                const targetKey = getKey(route.targetType, route.targetRound, route.targetPos);
                if (potentials[targetKey]) {
                    const targetPot = potentials[targetKey];
                    const prevHas = route.targetSlot === "A" ? targetPot.hasA : targetPot.hasB;
                    if (route.targetSlot === "A")
                        targetPot.hasA = true;
                    else
                        targetPot.hasB = true;
                    if (prevHas !== true) {
                        if (!queue.includes(targetKey))
                            queue.push(targetKey);
                    }
                }
            }
        }
    }
    return potentials;
}
async function checkAndResolveWO(tx, categoryId, matchId) {
    const potentials = await getCategoryPotentials(tx, categoryId);
    const match = await tx.match.findUnique({ where: { id: matchId } });
    if (!match || match.winnerId)
        return;
    const getKey = (type, round, pos) => `${type}_${round}_${pos}`;
    const key = getKey(match.bracketType, match.round, match.position);
    const pot = potentials[key];
    if (!pot)
        return;
    if (!pot.hasA && pot.hasB) {
        if (match.competitorBId) {
            await tx.match.update({
                where: { id: match.id },
                data: { winnerId: match.competitorBId, score: "W.O." }
            });
            // Fetch exactP, totalRounds, etc. for routing
            const matches = await tx.match.findMany({ where: { categoryId } });
            const totalWinnerRounds = Math.max(...matches.filter((m) => m.bracketType === "WINNER").map((m) => m.round));
            const category = await tx.category.findUnique({
                where: { id: categoryId },
                include: {
                    registrations: { where: { status: "CONFIRMED" } },
                    teams: { where: { status: "CONFIRMED" } },
                }
            });
            const exactP = category.format === "DUO_FIXED" ? category.teams.length : category.registrations.length;
            let K = 2;
            while (K * 2 <= exactP) {
                K *= 2;
            }
            if (exactP === 2)
                K = 2;
            const hasReduction = exactP > K;
            const numRound1Matches = hasReduction ? exactP - K : 0;
            await advanceWinner(tx, categoryId, match.round, match.position, match.competitorBId, match.competitorBName, match.bracketType, totalWinnerRounds, K, numRound1Matches, hasReduction);
        }
    }
    else if (pot.hasA && !pot.hasB) {
        if (match.competitorAId) {
            await tx.match.update({
                where: { id: match.id },
                data: { winnerId: match.competitorAId, score: "W.O." }
            });
            // Fetch exactP, totalRounds, etc. for routing
            const matches = await tx.match.findMany({ where: { categoryId } });
            const totalWinnerRounds = Math.max(...matches.filter((m) => m.bracketType === "WINNER").map((m) => m.round));
            const category = await tx.category.findUnique({
                where: { id: categoryId },
                include: {
                    registrations: { where: { status: "CONFIRMED" } },
                    teams: { where: { status: "CONFIRMED" } },
                }
            });
            const exactP = category.format === "DUO_FIXED" ? category.teams.length : category.registrations.length;
            let K = 2;
            while (K * 2 <= exactP) {
                K *= 2;
            }
            if (exactP === 2)
                K = 2;
            const hasReduction = exactP > K;
            const numRound1Matches = hasReduction ? exactP - K : 0;
            await advanceWinner(tx, categoryId, match.round, match.position, match.competitorAId, match.competitorAName, match.bracketType, totalWinnerRounds, K, numRound1Matches, hasReduction);
        }
    }
}
async function recalculateRankings(tx) {
    const client = tx || client_2.prisma;
    // 1. Fetch all matches that have a winnerId
    const matches = await client.match.findMany({
        where: { winnerId: { not: null } },
        include: {
            category: {
                select: { format: true }
            }
        }
    });
    const duoStats = {};
    const indStats = {};
    const addIndividualPoints = (name, points, win = false) => {
        const trimmed = name.trim();
        if (!trimmed)
            return;
        if (!indStats[trimmed])
            indStats[trimmed] = { wins: 0, points: 0 };
        indStats[trimmed].points += points;
        if (win)
            indStats[trimmed].wins += 1;
    };
    const addDuoPoints = (p1, p2, points, win = false) => {
        const names = [p1.trim(), p2.trim()].sort();
        const key = `${names[0]} | ${names[1]}`;
        if (!duoStats[key])
            duoStats[key] = { wins: 0, points: 0 };
        duoStats[key].points += points;
        if (win)
            duoStats[key].wins += 1;
    };
    for (const m of matches) {
        const isDuo = m.category.format === "DUO_FIXED";
        const winnerName = m.winnerId === m.competitorAId ? m.competitorAName : m.competitorBName;
        if (!winnerName)
            continue;
        if (isDuo) {
            const parts = winnerName.split(" + ");
            if (parts.length === 2) {
                addDuoPoints(parts[0], parts[1], 3.0, true);
                addIndividualPoints(parts[0], 3.0, true);
                addIndividualPoints(parts[1], 3.0, true);
            }
            else {
                addIndividualPoints(winnerName, 3.0, true);
            }
        }
        else {
            addIndividualPoints(winnerName, 3.0, true);
        }
    }
    const categories = await client.category.findMany({
        include: {
            matches: true
        }
    });
    for (const cat of categories) {
        if (!cat.winnerName || cat.matches.length === 0)
            continue;
        const isDuo = cat.format === "DUO_FIXED";
        const sortedMatches = [...cat.matches].sort((a, b) => b.round - a.round || b.position - a.position);
        const finalMatch = sortedMatches[0];
        if (!finalMatch || !finalMatch.winnerId)
            continue;
        const firstPlaceName = finalMatch.winnerId === finalMatch.competitorAId ? finalMatch.competitorAName : finalMatch.competitorBName;
        const secondPlaceName = finalMatch.winnerId === finalMatch.competitorAId ? finalMatch.competitorBName : finalMatch.competitorAName;
        if (firstPlaceName) {
            if (isDuo) {
                const parts = firstPlaceName.split(" + ");
                if (parts.length === 2) {
                    addDuoPoints(parts[0], parts[1], 25.0);
                    addIndividualPoints(parts[0], 25.0);
                    addIndividualPoints(parts[1], 25.0);
                }
                else {
                    addIndividualPoints(firstPlaceName, 25.0);
                }
            }
            else {
                addIndividualPoints(firstPlaceName, 25.0);
            }
        }
        if (secondPlaceName) {
            if (isDuo) {
                const parts = secondPlaceName.split(" + ");
                if (parts.length === 2) {
                    addDuoPoints(parts[0], parts[1], 18.0);
                    addIndividualPoints(parts[0], 18.0);
                    addIndividualPoints(parts[1], 18.0);
                }
                else {
                    addIndividualPoints(secondPlaceName, 18.0);
                }
            }
            else {
                addIndividualPoints(secondPlaceName, 18.0);
            }
        }
        const thirdPlaceMatch = cat.matches.find((m) => m.bracketType === "THIRD_PLACE");
        if (thirdPlaceMatch && thirdPlaceMatch.winnerId) {
            const thirdPlaceName = thirdPlaceMatch.winnerId === thirdPlaceMatch.competitorAId ? thirdPlaceMatch.competitorAName : thirdPlaceMatch.competitorBName;
            const fourthPlaceName = thirdPlaceMatch.winnerId === thirdPlaceMatch.competitorAId ? thirdPlaceMatch.competitorBName : thirdPlaceMatch.competitorAName;
            if (thirdPlaceName) {
                if (isDuo) {
                    const parts = thirdPlaceName.split(" + ");
                    if (parts.length === 2) {
                        addDuoPoints(parts[0], parts[1], 15.0);
                        addIndividualPoints(parts[0], 15.0);
                        addIndividualPoints(parts[1], 15.0);
                    }
                    else {
                        addIndividualPoints(thirdPlaceName, 15.0);
                    }
                }
                else {
                    addIndividualPoints(thirdPlaceName, 15.0);
                }
            }
            if (fourthPlaceName) {
                if (isDuo) {
                    const parts = fourthPlaceName.split(" + ");
                    if (parts.length === 2) {
                        addDuoPoints(parts[0], parts[1], 12.0);
                        addIndividualPoints(parts[0], 12.0);
                        addIndividualPoints(parts[1], 12.0);
                    }
                    else {
                        addIndividualPoints(fourthPlaceName, 12.0);
                    }
                }
                else {
                    addIndividualPoints(fourthPlaceName, 12.0);
                }
            }
        }
        else {
            const semiFinalRound = finalMatch.round - 1;
            if (semiFinalRound > 0) {
                const semiFinalMatches = cat.matches.filter((m) => m.round === semiFinalRound);
                const semiFinalLosers = [];
                for (const sfm of semiFinalMatches) {
                    if (!sfm.winnerId)
                        continue;
                    const loserName = sfm.winnerId === sfm.competitorAId ? sfm.competitorBName : sfm.competitorAName;
                    if (!loserName)
                        continue;
                    const winsCount = cat.matches.filter((m) => m.winnerId && (m.competitorAName === loserName || m.competitorBName === loserName) && (m.competitorAId === m.winnerId ? m.competitorAName : m.competitorBName) === loserName).length;
                    semiFinalLosers.push({ name: loserName, winsCount });
                }
                semiFinalLosers.sort((a, b) => b.winsCount - a.winsCount);
                if (semiFinalLosers[0]) {
                    const name3 = semiFinalLosers[0].name;
                    if (isDuo) {
                        const parts = name3.split(" + ");
                        if (parts.length === 2) {
                            addDuoPoints(parts[0], parts[1], 15.0);
                            addIndividualPoints(parts[0], 15.0);
                            addIndividualPoints(parts[1], 15.0);
                        }
                        else {
                            addIndividualPoints(name3, 15.0);
                        }
                    }
                    else {
                        addIndividualPoints(name3, 15.0);
                    }
                }
                if (semiFinalLosers[1]) {
                    const name4 = semiFinalLosers[1].name;
                    if (isDuo) {
                        const parts = name4.split(" + ");
                        if (parts.length === 2) {
                            addDuoPoints(parts[0], parts[1], 12.0);
                            addIndividualPoints(parts[0], 12.0);
                            addIndividualPoints(parts[1], 12.0);
                        }
                        else {
                            addIndividualPoints(name4, 12.0);
                        }
                    }
                    else {
                        addIndividualPoints(name4, 12.0);
                    }
                }
            }
        }
    }
    const executeSave = async (db) => {
        await db.duoRanking.deleteMany({ where: { isManual: false } });
        await db.individualRanking.deleteMany({ where: { isManual: false } });
        for (const [key, stats] of Object.entries(duoStats)) {
            const parts = key.split(" | ");
            const existingManual = await db.duoRanking.findFirst({
                where: { playerAName: parts[0], playerBName: parts[1], isManual: true }
            });
            if (existingManual)
                continue;
            await db.duoRanking.create({
                data: {
                    playerAName: parts[0],
                    playerBName: parts[1],
                    wins: stats.wins,
                    points: stats.points,
                }
            });
        }
        for (const [name, stats] of Object.entries(indStats)) {
            const existingManual = await db.individualRanking.findFirst({
                where: { playerName: name, isManual: true }
            });
            if (existingManual)
                continue;
            await db.individualRanking.create({
                data: {
                    playerName: name,
                    wins: stats.wins,
                    points: stats.points,
                }
            });
        }
    };
    if (tx) {
        await executeSave(tx);
    }
    else {
        await client_2.prisma.$transaction(async (db) => {
            await executeSave(db);
        });
    }
}
function formatMatchupNames(matches) {
    const typeOrder = {
        "WINNER": 1,
        "LOSER": 2,
        "GRAND_FINAL": 3,
        "RESET_FINAL": 4
    };
    const sorted = [...matches].sort((a, b) => {
        const orderA = typeOrder[a.bracketType] || 99;
        const orderB = typeOrder[b.bracketType] || 99;
        if (orderA !== orderB)
            return orderA - orderB;
        if (a.round !== b.round)
            return a.round - b.round;
        return a.position - b.position;
    });
    const matchMap = new Map();
    sorted.forEach((m, idx) => {
        matchMap.set(`${m.bracketType}:${m.round}:${m.position}`, idx + 1);
    });
    const round1WinnerMatches = sorted.filter(m => m.round === 1 && m.bracketType === "WINNER");
    const totalWinnerRounds = Math.max(...sorted.filter(m => m.bracketType === "WINNER").map(m => m.round), 1);
    let K = 2;
    let hasReduction = false;
    let numRound1Matches = 0;
    if (totalWinnerRounds > 1) {
        const K_est = Math.pow(2, totalWinnerRounds - 1);
        if (round1WinnerMatches.length < K_est) {
            hasReduction = true;
            K = K_est;
            numRound1Matches = round1WinnerMatches.length;
        }
        else {
            hasReduction = false;
            K = K_est * 2;
            numRound1Matches = 0;
        }
    }
    const sourceMap = new Map();
    sorted.forEach((m, idx) => {
        const label = `Jogo ${idx + 1}`;
        const wRoute = getRouteTarget(m.bracketType, m.round, m.position, true, totalWinnerRounds, K, numRound1Matches, hasReduction);
        if (wRoute) {
            const key = `${wRoute.targetType}:${wRoute.targetRound}:${wRoute.targetPos}:${wRoute.targetSlot}`;
            sourceMap.set(key, { label, type: "winner" });
        }
        const lRoute = getRouteTarget(m.bracketType, m.round, m.position, false, totalWinnerRounds, K, numRound1Matches, hasReduction);
        if (lRoute) {
            const key = `${lRoute.targetType}:${lRoute.targetRound}:${lRoute.targetPos}:${lRoute.targetSlot}`;
            sourceMap.set(key, { label, type: "loser" });
        }
    });
    return sorted.map((m, idx) => {
        const label = `Jogo ${idx + 1}`;
        let competitorAName = m.competitorAName;
        let competitorBName = m.competitorBName;
        const keyA = `${m.bracketType}:${m.round}:${m.position}:A`;
        const sourceA = sourceMap.get(keyA);
        if (!competitorAName && sourceA) {
            competitorAName = sourceA.type === "winner" ? `Vencedor do ${sourceA.label}` : `Perdedor do ${sourceA.label}`;
        }
        const keyB = `${m.bracketType}:${m.round}:${m.position}:B`;
        const sourceB = sourceMap.get(keyB);
        if (!competitorBName && sourceB) {
            competitorBName = sourceB.type === "winner" ? `Vencedor do ${sourceB.label}` : `Perdedor do ${sourceB.label}`;
        }
        if (!competitorAName) {
            if (m.bracketType === "GRAND_FINAL")
                competitorAName = "Finalista Winner";
            else
                competitorAName = "A definir";
        }
        if (!competitorBName) {
            if (m.bracketType === "GRAND_FINAL")
                competitorBName = "Finalista Loser";
            else if (m.bracketType === "RESET_FINAL")
                competitorBName = "Finalista Loser (se vencer GF)";
            else
                competitorBName = "A definir";
        }
        return {
            ...m,
            label,
            competitorAName,
            competitorBName,
        };
    });
}
function generateRoundRobin(participants) {
    const list = [...participants];
    if (list.length % 2 !== 0) {
        list.push({ id: null, name: "BYE" });
    }
    const numParticipants = list.length;
    const numRounds = numParticipants - 1;
    const matchesPerRound = numParticipants / 2;
    const schedule = [];
    for (let round = 1; round <= numRounds; round++) {
        for (let matchIdx = 0; matchIdx < matchesPerRound; matchIdx++) {
            const home = (round + matchIdx) % (numParticipants - 1);
            let away = (numParticipants - 1 - matchIdx + round) % (numParticipants - 1);
            if (matchIdx === 0) {
                away = numParticipants - 1;
            }
            const competitorA = list[home];
            const competitorB = list[away];
            if (competitorA.name !== "BYE" && competitorB.name !== "BYE") {
                schedule.push({ competitorA, competitorB, round });
            }
        }
    }
    return schedule;
}
async function generateGroupsBracketInternal(tx, categoryId, participants, numGroups) {
    // Shuffle participants
    const shuffled = shuffleParticipants(participants, Math.random().toString());
    // Distribute into groups
    const groups = Array.from({ length: numGroups }, () => []);
    shuffled.forEach((p, idx) => {
        groups[idx % numGroups].push(p);
    });
    const matchesToCreate = [];
    let globalPos = 1;
    for (let i = 0; i < numGroups; i++) {
        const groupLetter = String.fromCharCode(65 + i); // A, B, C...
        const groupLabel = `GRUPO_${groupLetter}`;
        const groupParticipants = groups[i];
        if (groupParticipants.length < 2)
            continue;
        // Generate round robin schedule for this group
        const schedule = generateRoundRobin(groupParticipants);
        // Create matches
        for (const matchInfo of schedule) {
            matchesToCreate.push({
                categoryId,
                round: matchInfo.round,
                position: globalPos++,
                bracketType: groupLabel, // e.g. "GRUPO_A"
                competitorAId: matchInfo.competitorA.id,
                competitorAName: matchInfo.competitorA.name,
                competitorBId: matchInfo.competitorB.id,
                competitorBName: matchInfo.competitorB.name,
            });
        }
    }
    if (matchesToCreate.length > 0) {
        await tx.match.createMany({
            data: matchesToCreate
        });
    }
}
async function updateMatchManual(matchId, data) {
    // Directly update the match record in the database
    const updatedMatch = await client_2.prisma.match.update({
        where: { id: matchId },
        data,
    });
    // Recalculate rankings if we set a winner manually
    await client_2.prisma.$transaction(async (tx) => {
        await recalculateRankings(tx);
    });
    return updatedMatch;
}
//# sourceMappingURL=categories.service.js.map