import { Request, Response } from "express";
import * as paymentsService from "./payments.service";
import * as checkoutService from "./checkout.service";
import { confirmTeamPaymentSchema, checkoutTeamSchema } from "./payments.schema";

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

export async function checkoutRegistrationHandler(req: Request, res: Response) {
  const result = await checkoutService.createRegistrationCheckout(req.params.id, req.user!.id);
  res.status(200).json(result);
}

export async function checkoutTeamHandler(req: Request, res: Response) {
  const input = checkoutTeamSchema.parse(req.body);
  const result = await checkoutService.createTeamCheckout(req.params.id, req.user!.id, input.portion);
  res.status(200).json(result);
}
