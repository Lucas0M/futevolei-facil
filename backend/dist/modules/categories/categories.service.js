"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
exports.publishCategory = publishCategory;
exports.getCategoryDetail = getCategoryDetail;
exports.generateCategoryBracket = generateCategoryBracket;
exports.generatePersistentBracket = generatePersistentBracket;
exports.updateMatchWinner = updateMatchWinner;
exports.recalculateRankings = recalculateRankings;
exports.formatMatchupNames = formatMatchupNames;
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
        winnerName: category.winnerName,
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
async function generatePersistentBracket(categoryId) {
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
    const participants = category.format === "DUO_FIXED"
        ? category.teams.map((t) => ({ id: t.id, name: `${t.ownerUser.name} + ${t.partnerName}` }))
        : category.registrations.map((r) => ({ id: r.id, name: r.customPlayerName ?? r.user.name }));
    if (participants.length < 2) {
        throw new AppError_1.AppError("São necessários ao menos 2 participantes confirmados.", 400);
    }
    const shuffled = shuffleParticipants(participants, categoryId);
    const P = shuffled.length;
    let M = 2;
    while (M < P) {
        M *= 2;
    }
    const totalRounds = Math.log2(M);
    return client_2.prisma.$transaction(async (tx) => {
        await tx.match.deleteMany({ where: { categoryId } });
        await tx.category.update({
            where: { id: categoryId },
            data: { winnerName: null },
        });
        const matchesToCreate = [];
        for (let r = 1; r <= totalRounds; r++) {
            const matchesInRound = M / Math.pow(2, r);
            for (let pos = 1; pos <= matchesInRound; pos++) {
                matchesToCreate.push({
                    categoryId,
                    round: r,
                    position: pos,
                    competitorAId: null,
                    competitorAName: null,
                    competitorBId: null,
                    competitorBName: null,
                    winnerId: null,
                    score: null,
                });
            }
        }
        const createdMatches = await Promise.all(matchesToCreate.map((m) => tx.match.create({ data: m })));
        const round1Matches = createdMatches.filter((m) => m.round === 1);
        const numDoubleMatches = P - round1Matches.length;
        let playerIdx = 0;
        for (let idx = 0; idx < round1Matches.length; idx++) {
            const match = round1Matches[idx];
            if (idx < numDoubleMatches) {
                if (playerIdx < P) {
                    match.competitorAId = shuffled[playerIdx].id;
                    match.competitorAName = shuffled[playerIdx].name;
                    playerIdx++;
                }
                if (playerIdx < P) {
                    match.competitorBId = shuffled[playerIdx].id;
                    match.competitorBName = shuffled[playerIdx].name;
                    playerIdx++;
                }
            }
            else {
                if (playerIdx < P) {
                    match.competitorAId = shuffled[playerIdx].id;
                    match.competitorAName = shuffled[playerIdx].name;
                    playerIdx++;
                }
                match.competitorBId = null;
                match.competitorBName = null;
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
            if (match.competitorAId && !match.competitorBId) {
                match.winnerId = match.competitorAId;
                match.score = "W.O.";
                await tx.match.update({
                    where: { id: match.id },
                    data: { winnerId: match.winnerId, score: match.score },
                });
                await advanceWinner(tx, categoryId, 1, match.position, match.competitorAId, match.competitorAName);
            }
        }
        await recalculateRankings(tx);
        return tx.match.findMany({
            where: { categoryId },
            orderBy: [{ round: "asc" }, { position: "asc" }],
        });
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
        const updatedMatch = await tx.match.update({
            where: { id: matchId },
            data: { winnerId, score },
        });
        await advanceWinner(tx, match.categoryId, match.round, match.position, winnerId, winnerName);
        await recalculateRankings(tx);
        return updatedMatch;
    });
}
async function advanceWinner(tx, categoryId, currentRound, currentPosition, winnerId, winnerName) {
    const nextRound = currentRound + 1;
    const nextPosition = Math.floor((currentPosition - 1) / 2) + 1;
    const isCompetitorA = (currentPosition - 1) % 2 === 0;
    const nextMatch = await tx.match.findFirst({
        where: { categoryId, round: nextRound, position: nextPosition },
    });
    if (nextMatch) {
        const updateData = {};
        if (isCompetitorA) {
            updateData.competitorAId = winnerId;
            updateData.competitorAName = winnerName;
        }
        else {
            updateData.competitorBId = winnerId;
            updateData.competitorBName = winnerName;
        }
        await tx.match.update({ where: { id: nextMatch.id }, data: updateData });
    }
    else {
        await tx.category.update({
            where: { id: categoryId },
            data: { winnerName },
        });
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
    const executeSave = async (db) => {
        await db.duoRanking.deleteMany({});
        await db.individualRanking.deleteMany({});
        for (const [key, stats] of Object.entries(duoStats)) {
            const parts = key.split(" | ");
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
    const sorted = [...matches].sort((a, b) => a.round - b.round || a.position - b.position);
    const matchMap = new Map();
    sorted.forEach((m, idx) => {
        matchMap.set(`${m.round}:${m.position}`, idx + 1);
    });
    return sorted.map((m) => {
        let competitorAName = m.competitorAName;
        let competitorBName = m.competitorBName;
        if (m.round > 1) {
            const prevRound = m.round - 1;
            const posA = (m.position - 1) * 2 + 1;
            const posB = (m.position - 1) * 2 + 2;
            const idxA = matchMap.get(`${prevRound}:${posA}`);
            const idxB = matchMap.get(`${prevRound}:${posB}`);
            if (!competitorAName) {
                competitorAName = idxA ? `Vencedor do Jogo ${idxA}` : "A definir";
            }
            if (!competitorBName) {
                competitorBName = idxB ? `Vencedor do Jogo ${idxB}` : "A definir";
            }
        }
        return {
            ...m,
            competitorAName,
            competitorBName,
        };
    });
}
//# sourceMappingURL=categories.service.js.map