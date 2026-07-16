"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRegistration = createRegistration;
exports.cancelOwnRegistration = cancelOwnRegistration;
exports.cancelOwnTeam = cancelOwnTeam;
exports.adminCancelRegistration = adminCancelRegistration;
exports.adminCancelTeam = adminCancelTeam;
exports.updateTeamPartnerName = updateTeamPartnerName;
exports.updateRegistrationPlayerName = updateRegistrationPlayerName;
exports.listMyRegistrations = listMyRegistrations;
const client_1 = require("@prisma/client");
const client_2 = require("../../prisma/client");
const AppError_1 = require("../../shared/errors/AppError");
// ---------------------------------------------------------------------------
// CREATE (RF10, RF11, RF14, RN01, RN03, RN08, RN09)
// ---------------------------------------------------------------------------
async function createRegistration(categoryId, userId, userRole, body) {
    const category = await client_2.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
        throw new AppError_1.AppError("Categoria não encontrada.", 404, "CATEGORY_NOT_FOUND");
    }
    if (userRole !== "ADMIN") {
        assertCategoryIsOpenForRegistration(category.status, category.registrationDeadline);
    }
    let targetUserId = userId;
    if (userRole === "ADMIN") {
        const dummyEmail = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}@ares.com`;
        const dummyUser = await client_2.prisma.user.create({
            data: {
                email: dummyEmail,
                passwordHash: "manual-registration",
                name: body.customPlayerName || body.customOwnerName || "Jogador Manual",
                role: "PLAYER"
            }
        });
        targetUserId = dummyUser.id;
    }
    if (category.format === "DUO_FIXED") {
        if (!body.partnerName) {
            throw new AppError_1.AppError("Nome do parceiro é obrigatório para esta categoria.", 422, "PARTNER_NAME_REQUIRED");
        }
        return createTeamRegistration(category, targetUserId, userRole, { partnerName: body.partnerName, customOwnerName: body.customOwnerName || body.customPlayerName });
    }
    return createIndividualRegistration(category, targetUserId, userRole, { customPlayerName: body.customPlayerName });
}
async function createIndividualRegistration(category, userId, userRole, input) {
    const existing = await client_2.prisma.registration.findUnique({
        where: { categoryId_userId: { categoryId: category.id, userId } },
    });
    if (existing && existing.status !== "CANCELLED" && existing.status !== "EXPIRED") {
        throw new AppError_1.AppError("Você já está inscrito nesta categoria.", 409, "ALREADY_REGISTERED");
    }
    const user = await client_2.prisma.user.findUnique({ where: { id: userId } });
    const nameToCheck = input.customPlayerName || user?.name || "";
    const normalized = normalizeName(nameToCheck);
    // Check duplicate name in registrations
    const activeRegs = await client_2.prisma.registration.findMany({
        where: { categoryId: category.id, status: { notIn: ["CANCELLED", "EXPIRED"] } },
        include: { user: true }
    });
    for (const r of activeRegs) {
        if (r.id !== existing?.id && normalizeName(r.customPlayerName || r.user.name) === normalized) {
            throw new AppError_1.AppError(`O jogador "${nameToCheck}" já está inscrito nesta categoria.`, 409, "DUPLICATE_PLAYER_NAME");
        }
    }
    // Check duplicate name in teams
    const activeTeams = await client_2.prisma.team.findMany({
        where: { categoryId: category.id, status: { notIn: ["CANCELLED", "EXPIRED"] } },
        include: { ownerUser: true }
    });
    for (const t of activeTeams) {
        if (normalizeName(t.customOwnerName || t.ownerUser.name) === normalized || normalizeName(t.partnerName) === normalized) {
            throw new AppError_1.AppError(`O jogador "${nameToCheck}" já está inscrito em uma dupla nesta categoria.`, 409, "DUPLICATE_PLAYER_NAME");
        }
    }
    return client_2.prisma.$transaction(async (tx) => {
        await tx.$queryRaw `SELECT id FROM categories WHERE id = ${category.id} FOR UPDATE`;
        await expireStaleReservations(tx, category.id);
        const occupiedSlots = await tx.registration.count({
            where: { categoryId: category.id, status: { in: ["PENDING_PAYMENT", "CONFIRMED"] } },
        });
        if (occupiedSlots >= category.maxSlots) {
            throw new AppError_1.AppError("Esta categoria já atingiu o limite de vagas.", 409, "CATEGORY_FULL");
        }
        const reservedUntil = new Date(Date.now() + category.reservationTtlMinutes * 60 * 1000);
        if (existing) {
            // Clear out any payment from the row's previous life (e.g. an old
            // APPROVED payment from a prior confirmed-then-cancelled cycle).
            await tx.payment.deleteMany({ where: { registrationId: existing.id } });
            return tx.registration.update({
                where: { id: existing.id },
                data: {
                    amountDue: category.entryFee,
                    status: client_1.RegistrationStatus.PENDING_PAYMENT,
                    reservedUntil,
                    customPlayerName: userRole === "ADMIN" ? input.customPlayerName : null,
                },
            });
        }
        return tx.registration.create({
            data: {
                categoryId: category.id,
                userId,
                amountDue: category.entryFee,
                status: client_1.RegistrationStatus.PENDING_PAYMENT,
                reservedUntil,
                customPlayerName: userRole === "ADMIN" ? input.customPlayerName : null,
            },
        });
    });
}
async function createTeamRegistration(category, ownerUserId, userRole, input) {
    const owner = await client_2.prisma.user.findUnique({ where: { id: ownerUserId } });
    if (!owner) {
        throw new AppError_1.AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
    }
    const ownerNameToCheck = input.customOwnerName || owner.name;
    if (normalizeName(input.partnerName) === normalizeName(ownerNameToCheck)) {
        throw new AppError_1.AppError("O parceiro não pode ser você mesmo.", 422, "INVALID_PARTNER");
    }
    const existing = await client_2.prisma.team.findUnique({
        where: { categoryId_ownerUserId: { categoryId: category.id, ownerUserId } },
    });
    if (existing && existing.status !== "CANCELLED" && existing.status !== "EXPIRED") {
        throw new AppError_1.AppError("Você já inscreveu uma dupla nesta categoria.", 409, "ALREADY_REGISTERED");
    }
    const normalizedOwner = normalizeName(ownerNameToCheck);
    const normalizedPartner = normalizeName(input.partnerName);
    // Check duplicate name in registrations
    const activeRegs = await client_2.prisma.registration.findMany({
        where: { categoryId: category.id, status: { notIn: ["CANCELLED", "EXPIRED"] } },
        include: { user: true }
    });
    for (const r of activeRegs) {
        const rName = normalizeName(r.customPlayerName || r.user.name);
        if (rName === normalizedOwner) {
            throw new AppError_1.AppError(`O jogador "${ownerNameToCheck}" já está inscrito nesta categoria.`, 409, "DUPLICATE_PLAYER_NAME");
        }
        if (rName === normalizedPartner) {
            throw new AppError_1.AppError(`O jogador "${input.partnerName}" já está inscrito nesta categoria.`, 409, "DUPLICATE_PLAYER_NAME");
        }
    }
    // Check duplicate name in teams
    const activeTeams = await client_2.prisma.team.findMany({
        where: { categoryId: category.id, status: { notIn: ["CANCELLED", "EXPIRED"] } },
        include: { ownerUser: true }
    });
    for (const t of activeTeams) {
        if (t.id === existing?.id)
            continue;
        const tOwner = normalizeName(t.customOwnerName || t.ownerUser.name);
        const tPartner = normalizeName(t.partnerName);
        if (tOwner === normalizedOwner || tPartner === normalizedOwner) {
            throw new AppError_1.AppError(`O jogador "${ownerNameToCheck}" já está inscrito em outra dupla nesta categoria.`, 409, "DUPLICATE_PLAYER_NAME");
        }
        if (tOwner === normalizedPartner || tPartner === normalizedPartner) {
            throw new AppError_1.AppError(`O jogador "${input.partnerName}" já está inscrito em outra dupla nesta categoria.`, 409, "DUPLICATE_PLAYER_NAME");
        }
    }
    return client_2.prisma.$transaction(async (tx) => {
        await tx.$queryRaw `SELECT id FROM categories WHERE id = ${category.id} FOR UPDATE`;
        await expireStaleReservations(tx, category.id);
        const occupiedSlots = await tx.team.count({
            where: { categoryId: category.id, status: { in: ["PENDING_PAYMENT", "CONFIRMED"] } },
        });
        if (occupiedSlots >= category.maxSlots) {
            throw new AppError_1.AppError("Esta categoria já atingiu o limite de vagas.", 409, "CATEGORY_FULL");
        }
        const reservedUntil = new Date(Date.now() + category.reservationTtlMinutes * 60 * 1000);
        if (existing) {
            await tx.payment.deleteMany({ where: { teamId: existing.id } });
            return tx.team.update({
                where: { id: existing.id },
                data: {
                    partnerName: input.partnerName,
                    amountDue: category.entryFee,
                    status: client_1.TeamRegistrationStatus.PENDING_PAYMENT,
                    reservedUntil,
                    customOwnerName: userRole === "ADMIN" ? input.customOwnerName : null,
                },
            });
        }
        return tx.team.create({
            data: {
                categoryId: category.id,
                ownerUserId,
                partnerName: input.partnerName,
                amountDue: category.entryFee,
                status: client_1.TeamRegistrationStatus.PENDING_PAYMENT,
                reservedUntil,
                customOwnerName: userRole === "ADMIN" ? input.customOwnerName : null,
            },
        });
    });
}
function assertCategoryIsOpenForRegistration(status, registrationDeadline) {
    if (status !== client_1.EntityStatus.PUBLISHED) {
        throw new AppError_1.AppError("Esta categoria não está com inscrições abertas.", 400, "CATEGORY_NOT_OPEN");
    }
    if (registrationDeadline < new Date()) {
        throw new AppError_1.AppError("O prazo de inscrição para esta categoria já encerrou.", 400, "REGISTRATION_DEADLINE_PASSED");
    }
}
async function expireStaleReservations(tx, categoryId) {
    const now = new Date();
    await tx.registration.updateMany({
        where: { categoryId, status: "PENDING_PAYMENT", reservedUntil: { lt: now } },
        data: { status: "EXPIRED" },
    });
    await tx.team.updateMany({
        where: { categoryId, status: "PENDING_PAYMENT", reservedUntil: { lt: now } },
        data: { status: "EXPIRED" },
    });
}
function normalizeName(name) {
    return name.trim().toLowerCase();
}
// ---------------------------------------------------------------------------
// CANCEL BY PLAYER (RF12, RN04)
// ---------------------------------------------------------------------------
async function cancelOwnRegistration(registrationId, userId) {
    const registration = await client_2.prisma.registration.findUnique({
        where: { id: registrationId },
        include: { category: true },
    });
    if (!registration) {
        throw new AppError_1.AppError("Inscrição não encontrada.", 404, "REGISTRATION_NOT_FOUND");
    }
    if (registration.userId !== userId) {
        throw new AppError_1.AppError("Você não pode cancelar uma inscrição que não é sua.", 403, "FORBIDDEN");
    }
    assertNotYetConfirmed(registration.status);
    await assertWithinCancellationWindow(registration.category.tournamentId, registration.category.cancellationDeadlineHours);
    return client_2.prisma.registration.update({ where: { id: registrationId }, data: { status: "CANCELLED" } });
}
async function cancelOwnTeam(teamId, userId) {
    const team = await client_2.prisma.team.findUnique({ where: { id: teamId }, include: { category: true } });
    if (!team) {
        throw new AppError_1.AppError("Inscrição de dupla não encontrada.", 404, "TEAM_NOT_FOUND");
    }
    if (team.ownerUserId !== userId) {
        throw new AppError_1.AppError("Você não pode cancelar uma inscrição que não é sua.", 403, "FORBIDDEN");
    }
    assertNotYetConfirmed(team.status);
    await assertWithinCancellationWindow(team.category.tournamentId, team.category.cancellationDeadlineHours);
    return client_2.prisma.team.update({ where: { id: teamId }, data: { status: "CANCELLED" } });
}
function assertNotYetConfirmed(status) {
    if (status === "CONFIRMED") {
        throw new AppError_1.AppError("Sua inscrição já está confirmada e paga. Para cancelar, entre em contato diretamente com o organizador.", 400, "CANNOT_SELF_CANCEL_CONFIRMED");
    }
}
async function assertWithinCancellationWindow(tournamentId, cancellationDeadlineHours) {
    const tournament = await client_2.prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament)
        return;
    const deadline = new Date(tournament.eventDate.getTime() - cancellationDeadlineHours * 60 * 60 * 1000);
    if (new Date() > deadline) {
        throw new AppError_1.AppError("O prazo para cancelamento já passou. Entre em contato com o organizador.", 400, "CANCELLATION_DEADLINE_PASSED");
    }
}
// ---------------------------------------------------------------------------
// ADMIN REMOVAL (RF13)
// ---------------------------------------------------------------------------
async function adminCancelRegistration(registrationId) {
    const registration = await client_2.prisma.registration.findUnique({ where: { id: registrationId } });
    if (!registration) {
        throw new AppError_1.AppError("Inscrição não encontrada.", 404, "REGISTRATION_NOT_FOUND");
    }
    return client_2.prisma.registration.update({ where: { id: registrationId }, data: { status: "CANCELLED" } });
}
async function adminCancelTeam(teamId) {
    const team = await client_2.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
        throw new AppError_1.AppError("Inscrição de dupla não encontrada.", 404, "TEAM_NOT_FOUND");
    }
    return client_2.prisma.team.update({ where: { id: teamId }, data: { status: "CANCELLED" } });
}
async function updateTeamPartnerName(teamId, input) {
    const team = await client_2.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
        throw new AppError_1.AppError("Inscrição de dupla não encontrada.", 404, "TEAM_NOT_FOUND");
    }
    return client_2.prisma.team.update({
        where: { id: teamId },
        data: {
            partnerName: input.partnerName !== undefined ? input.partnerName : team.partnerName,
            customOwnerName: input.customOwnerName !== undefined ? input.customOwnerName : team.customOwnerName,
        }
    });
}
async function updateRegistrationPlayerName(registrationId, input) {
    const registration = await client_2.prisma.registration.findUnique({ where: { id: registrationId } });
    if (!registration) {
        throw new AppError_1.AppError("Inscrição não encontrada.", 404, "REGISTRATION_NOT_FOUND");
    }
    return client_2.prisma.registration.update({
        where: { id: registrationId },
        data: {
            customPlayerName: input.customPlayerName,
        }
    });
}
// ---------------------------------------------------------------------------
// LIST MY REGISTRATIONS
// ---------------------------------------------------------------------------
async function listMyRegistrations(userId) {
    const [registrations, teams] = await client_2.prisma.$transaction([
        client_2.prisma.registration.findMany({
            where: { userId },
            include: {
                category: {
                    select: { id: true, name: true, format: true, tournament: { select: { id: true, name: true, eventDate: true } } },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        client_2.prisma.team.findMany({
            where: { ownerUserId: userId },
            include: {
                category: {
                    select: { id: true, name: true, format: true, tournament: { select: { id: true, name: true, eventDate: true } } },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);
    return { registrations, teams };
}
//# sourceMappingURL=registrations.service.js.map