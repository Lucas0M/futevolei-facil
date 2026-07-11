"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmRegistrationPayment = confirmRegistrationPayment;
exports.confirmTeamPayment = confirmTeamPayment;
exports.listMyPayments = listMyPayments;
const client_1 = require("../../prisma/client");
const AppError_1 = require("../../shared/errors/AppError");
// ---------------------------------------------------------------------------
// RF16 - manual payment confirmation (admin registers a payment made outside
// the platform, e.g. cash/PIX handed directly to the organizer).
// ---------------------------------------------------------------------------
// INDIVIDUAL / DUO_RANDOM registrations - single payment covers the whole fee.
async function confirmRegistrationPayment(registrationId, adminId) {
    const registration = await client_1.prisma.registration.findUnique({
        where: { id: registrationId },
        include: { payment: true },
    });
    if (!registration) {
        throw new AppError_1.AppError("Inscrição não encontrada.", 404, "REGISTRATION_NOT_FOUND");
    }
    if (registration.status !== "PENDING_PAYMENT") {
        throw new AppError_1.AppError("Esta inscrição não está aguardando pagamento (já foi confirmada, cancelada ou expirada).", 400, "INVALID_REGISTRATION_STATUS");
    }
    if (registration.payment?.status === "APPROVED") {
        throw new AppError_1.AppError("Já existe um pagamento registrado para esta inscrição.", 409, "PAYMENT_ALREADY_EXISTS");
    }
    return client_1.prisma.$transaction(async (tx) => {
        // Reuses a PENDING payment row left over from an abandoned/incomplete
        // Mercado Pago checkout attempt, instead of creating a second row
        // (Payment.registrationId is unique - only one payment ever exists per registration).
        if (registration.payment) {
            await tx.payment.update({
                where: { id: registration.payment.id },
                data: {
                    method: "MANUAL",
                    status: "APPROVED",
                    amount: registration.amountDue,
                    confirmedByAdminId: adminId,
                    paidAt: new Date(),
                },
            });
        }
        else {
            await tx.payment.create({
                data: {
                    registrationId: registration.id,
                    amount: registration.amountDue,
                    method: "MANUAL",
                    status: "APPROVED",
                    confirmedByAdminId: adminId,
                    paidAt: new Date(),
                },
            });
        }
        return tx.registration.update({
            where: { id: registration.id },
            data: { status: "CONFIRMED" },
        });
    });
}
// DUO_FIXED teams - up to 2 payments (OWNER_SHARE + PARTNER_SHARE) or 1 (FULL).
// See prisma schema comments on Team/Payment for the full reasoning.
async function confirmTeamPayment(teamId, input, adminId) {
    const team = await client_1.prisma.team.findUnique({
        where: { id: teamId },
        include: { payments: true },
    });
    if (!team) {
        throw new AppError_1.AppError("Inscrição de dupla não encontrada.", 404, "TEAM_NOT_FOUND");
    }
    if (team.status !== "PENDING_PAYMENT") {
        throw new AppError_1.AppError("Esta dupla não está aguardando pagamento (já foi confirmada, cancelada ou expirada).", 400, "INVALID_TEAM_STATUS");
    }
    const { portion } = input;
    const approvedPortions = team.payments.filter((p) => p.status === "APPROVED").map((p) => p.teamPortion);
    if (portion === "FULL") {
        if (approvedPortions.length > 0) {
            throw new AppError_1.AppError("Já existe pagamento parcial registrado para esta dupla. Confirme a parte que falta em vez de 'dupla inteira'.", 409, "PARTIAL_PAYMENT_ALREADY_EXISTS");
        }
    }
    else {
        if (approvedPortions.includes("FULL")) {
            throw new AppError_1.AppError("O pagamento da dupla inteira já foi confirmado.", 409, "PAYMENT_ALREADY_EXISTS");
        }
        if (approvedPortions.includes(portion)) {
            throw new AppError_1.AppError("Esta parte do pagamento já foi confirmada.", 409, "PAYMENT_ALREADY_EXISTS");
        }
    }
    const amount = portion === "FULL" ? team.amountDue.mul(2) : team.amountDue;
    const existingPayment = team.payments.find((p) => p.teamPortion === portion);
    return client_1.prisma.$transaction(async (tx) => {
        // Reuses a PENDING payment row left over from an abandoned/incomplete
        // Mercado Pago checkout attempt for this exact portion, instead of
        // creating a duplicate (Payment has a unique constraint on [teamId, teamPortion]).
        if (existingPayment) {
            await tx.payment.update({
                where: { id: existingPayment.id },
                data: {
                    method: "MANUAL",
                    status: "APPROVED",
                    amount,
                    confirmedByAdminId: adminId,
                    paidAt: new Date(),
                },
            });
        }
        else {
            await tx.payment.create({
                data: {
                    teamId: team.id,
                    teamPortion: portion,
                    amount,
                    method: "MANUAL",
                    status: "APPROVED",
                    confirmedByAdminId: adminId,
                    paidAt: new Date(),
                },
            });
        }
        // RN02 - a team is only CONFIRMED when both shares (or the full amount) are paid.
        const isFullyPaid = portion === "FULL" || approvedPortions.includes(portion === "OWNER_SHARE" ? "PARTNER_SHARE" : "OWNER_SHARE");
        return tx.team.update({
            where: { id: team.id },
            data: { status: isFullyPaid ? "CONFIRMED" : "PENDING_PAYMENT" },
        });
    });
}
// ---------------------------------------------------------------------------
// RF19 - payment history for the logged-in user
// ---------------------------------------------------------------------------
async function listMyPayments(userId) {
    return client_1.prisma.payment.findMany({
        where: {
            OR: [{ registration: { userId } }, { team: { ownerUserId: userId } }],
        },
        include: {
            registration: { include: { tournament: { select: { id: true, name: true } } } },
            team: { include: { tournament: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
    });
}
//# sourceMappingURL=payments.service.js.map