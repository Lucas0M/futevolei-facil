"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRegistration = createRegistration;
exports.cancelOwnRegistration = cancelOwnRegistration;
exports.cancelOwnTeam = cancelOwnTeam;
exports.adminCancelRegistration = adminCancelRegistration;
exports.adminCancelTeam = adminCancelTeam;
exports.updateTeamPartnerName = updateTeamPartnerName;
exports.listMyRegistrations = listMyRegistrations;
const client_1 = require("@prisma/client");
const client_2 = require("../../prisma/client");
const AppError_1 = require("../../shared/errors/AppError");
// ---------------------------------------------------------------------------
// CREATE (RF10, RF11, RF14, RN01, RN03, RN08, RN09)
// ---------------------------------------------------------------------------
async function createRegistration(categoryId, userId, body) {
    const category = await client_2.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
        throw new AppError_1.AppError("Categoria não encontrada.", 404, "CATEGORY_NOT_FOUND");
    }
    assertCategoryIsOpenForRegistration(category.status, category.registrationDeadline);
    if (category.format === "DUO_FIXED") {
        if (!body.partnerName) {
            throw new AppError_1.AppError("Nome do parceiro é obrigatório para esta categoria.", 422, "PARTNER_NAME_REQUIRED");
        }
        return createTeamRegistration(category, userId, { partnerName: body.partnerName });
    }
    return createIndividualRegistration(category, userId);
}
async function createIndividualRegistration(category, userId) {
    const existing = await client_2.prisma.registration.findUnique({
        where: { categoryId_userId: { categoryId: category.id, userId } },
    });
    if (existing && existing.status !== "CANCELLED" && existing.status !== "EXPIRED") {
        throw new AppError_1.AppError("Você já está inscrito nesta categoria.", 409, "ALREADY_REGISTERED");
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
                data: { amountDue: category.entryFee, status: client_1.RegistrationStatus.PENDING_PAYMENT, reservedUntil },
            });
        }
        return tx.registration.create({
            data: {
                categoryId: category.id,
                userId,
                amountDue: category.entryFee,
                status: client_1.RegistrationStatus.PENDING_PAYMENT,
                reservedUntil,
            },
        });
    });
}
async function createTeamRegistration(category, ownerUserId, input) {
    const owner = await client_2.prisma.user.findUnique({ where: { id: ownerUserId } });
    if (!owner) {
        throw new AppError_1.AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
    }
    if (normalizeName(input.partnerName) === normalizeName(owner.name)) {
        throw new AppError_1.AppError("O parceiro não pode ser você mesmo.", 422, "INVALID_PARTNER");
    }
    const existing = await client_2.prisma.team.findUnique({
        where: { categoryId_ownerUserId: { categoryId: category.id, ownerUserId } },
    });
    if (existing && existing.status !== "CANCELLED" && existing.status !== "EXPIRED") {
        throw new AppError_1.AppError("Você já inscreveu uma dupla nesta categoria.", 409, "ALREADY_REGISTERED");
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
    return client_2.prisma.team.update({ where: { id: teamId }, data: { partnerName: input.partnerName } });
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