import { Request, Response } from "express";
import * as registrationsService from "./registrations.service";
import { createTeamRegistrationSchema, updateTeamPartnerSchema } from "./registrations.schema";

export async function createRegistrationHandler(req: Request, res: Response) {
  // partnerName is only required for DUO_FIXED categories; the service
  // decides whether it's needed based on the category's format.
  const parsed = createTeamRegistrationSchema.partial().parse(req.body ?? {});
  const registration = await registrationsService.createRegistration(req.params.categoryId, req.user!.id, parsed);
  res.status(201).json(registration);
}

export async function cancelOwnRegistrationHandler(req: Request, res: Response) {
  const registration = await registrationsService.cancelOwnRegistration(req.params.id, req.user!.id);
  res.status(200).json(registration);
}

export async function cancelOwnTeamHandler(req: Request, res: Response) {
  const team = await registrationsService.cancelOwnTeam(req.params.id, req.user!.id);
  res.status(200).json(team);
}

export async function adminCancelRegistrationHandler(req: Request, res: Response) {
  const registration = await registrationsService.adminCancelRegistration(req.params.id);
  res.status(200).json(registration);
}

export async function adminCancelTeamHandler(req: Request, res: Response) {
  const team = await registrationsService.adminCancelTeam(req.params.id);
  res.status(200).json(team);
}

export async function updateTeamPartnerHandler(req: Request, res: Response) {
  const input = updateTeamPartnerSchema.parse(req.body);
  const team = await registrationsService.updateTeamPartnerName(req.params.id, input);
  res.status(200).json(team);
}

export async function listMyRegistrationsHandler(req: Request, res: Response) {
  const result = await registrationsService.listMyRegistrations(req.user!.id);
  res.status(200).json(result);
}
