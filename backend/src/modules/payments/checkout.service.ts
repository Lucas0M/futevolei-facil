import { Prisma, TeamPaymentPortion } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AppError } from "../../shared/errors/AppError";
import { preferenceClient } from "../../shared/payments/mercadopago.client";
import { env } from "../../config/env";

// ---------------------------------------------------------------------------
// RF15 - Mercado Pago checkout (Checkout Pro: hosted payment page).
// NOTE: without a public webhook URL yet (RF18, pending), the payment
// approved on Mercado Pago's side does NOT automatically flip our
// Registration/Team to CONFIRMED. Until the webhook is implemented, use the
// manual confirmation endpoints (RF16) after verifying the payment went
// through in the Mercado Pago dashboard.
// ---------------------------------------------------------------------------

export async function createRegistrationCheckout(registrationId: string, userId: string) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { tournament: true, payment: true },
  });

  if (!registration) {
    throw new AppError("Inscrição não encontrada.", 404, "REGISTRATION_NOT_FOUND");
  }
  if (registration.userId !== userId) {
    throw new AppError("Você não pode pagar uma inscrição que não é sua.", 403, "FORBIDDEN");
  }
  if (registration.status !== "PENDING_PAYMENT") {
    throw new AppError("Esta inscrição não está aguardando pagamento.", 400, "INVALID_REGISTRATION_STATUS");
  }
  if (registration.payment?.status === "APPROVED") {
    throw new AppError("Esta inscrição já foi paga.", 409, "PAYMENT_ALREADY_EXISTS");
  }

  const preference = await preferenceClient.create({
    body: {
      items: [
        {
          id: registration.tournamentId,
          title: registration.tournament.name,
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(registration.amountDue),
        },
      ],
      external_reference: registration.id,
      back_urls: {
        success: `${env.FRONTEND_URL}/pagamento/sucesso`,
        failure: `${env.FRONTEND_URL}/pagamento/erro`,
        pending: `${env.FRONTEND_URL}/pagamento/pendente`,
      },
    },
  });

  // Reuse the existing Payment row if one already exists (Payment.registrationId
  // is unique - a registration can only ever have ONE payment row, gateway or
  // manual), otherwise create it now, in PENDING state.
  if (registration.payment) {
    await prisma.payment.update({
      where: { id: registration.payment.id },
      data: {
        method: "GATEWAY",
        status: "PENDING",
        amount: registration.amountDue,
        gatewayPreferenceId: preference.id,
      },
    });
  } else {
    await prisma.payment.create({
      data: {
        registrationId: registration.id,
        amount: registration.amountDue,
        method: "GATEWAY",
        status: "PENDING",
        gatewayPreferenceId: preference.id,
      },
    });
  }

  // sandbox_init_point only exists when using TEST- credentials; falling back
  // to init_point covers production credentials automatically.
  return { checkoutUrl: preference.sandbox_init_point ?? preference.init_point };
}

export async function createTeamCheckout(teamId: string, userId: string, portion: TeamPaymentPortion) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { tournament: true, payments: true },
  });

  if (!team) {
    throw new AppError("Inscrição de dupla não encontrada.", 404, "TEAM_NOT_FOUND");
  }
  if (team.ownerUserId !== userId) {
    throw new AppError("Você não pode pagar uma inscrição que não é sua.", 403, "FORBIDDEN");
  }
  if (team.status !== "PENDING_PAYMENT") {
    throw new AppError("Esta dupla não está aguardando pagamento.", 400, "INVALID_TEAM_STATUS");
  }

  const approvedPortions = team.payments.filter((p) => p.status === "APPROVED").map((p) => p.teamPortion);

  if (portion === "FULL" && approvedPortions.length > 0) {
    throw new AppError("Já existe pagamento parcial confirmado para esta dupla.", 409, "PARTIAL_PAYMENT_ALREADY_EXISTS");
  }
  if (portion !== "FULL" && approvedPortions.includes("FULL")) {
    throw new AppError("O pagamento da dupla inteira já foi confirmado.", 409, "PAYMENT_ALREADY_EXISTS");
  }
  if (portion !== "FULL" && approvedPortions.includes(portion)) {
    throw new AppError("Esta parte do pagamento já foi confirmada.", 409, "PAYMENT_ALREADY_EXISTS");
  }

  const amount = portion === "FULL" ? team.amountDue : (team.amountDue as Prisma.Decimal).div(2);

  const preference = await preferenceClient.create({
    body: {
      items: [
        {
          id: team.tournamentId,
          title: `${team.tournament.name} (${portion === "FULL" ? "dupla" : "parte individual"})`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(amount),
        },
      ],
      // Encodes both the team and which portion this checkout is for, so a
      // future webhook handler can tell them apart from a single field.
      external_reference: `${team.id}:${portion}`,
      back_urls: {
        success: `${env.FRONTEND_URL}/pagamento/sucesso`,
        failure: `${env.FRONTEND_URL}/pagamento/erro`,
        pending: `${env.FRONTEND_URL}/pagamento/pendente`,
      },
    },
  });

  const existingPayment = team.payments.find((p) => p.teamPortion === portion);

  if (existingPayment) {
    await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        method: "GATEWAY",
        status: "PENDING",
        amount,
        gatewayPreferenceId: preference.id,
      },
    });
  } else {
    await prisma.payment.create({
      data: {
        teamId: team.id,
        teamPortion: portion,
        amount,
        method: "GATEWAY",
        status: "PENDING",
        gatewayPreferenceId: preference.id,
      },
    });
  }

  return { checkoutUrl: preference.sandbox_init_point ?? preference.init_point };
}
