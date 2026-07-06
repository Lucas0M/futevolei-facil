import { Request, Response } from "express";
import * as paymentsService from "./payments.service";
import { confirmTeamPaymentSchema } from "./payments.schema";

export async function confirmRegistrationPaymentHandler(req: Request, res: Response) {
  const registration = await paymentsService.confirmRegistrationPayment(req.params.id, req.user!.id);
  res.status(200).json(registration);
}

export async function confirmTeamPaymentHandler(req: Request, res: Response) {
  const input = confirmTeamPaymentSchema.parse(req.body);
  const team = await paymentsService.confirmTeamPayment(req.params.id, input, req.user!.id);
  res.status(200).json(team);
}

export async function listMyPaymentsHandler(req: Request, res: Response) {
  const payments = await paymentsService.listMyPayments(req.user!.id);
  res.status(200).json(payments);
}
