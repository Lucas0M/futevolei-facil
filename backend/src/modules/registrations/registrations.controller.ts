import { Request, Response } from "express";
import * as registrationsService from "./registrations.service";
import { createTeamRegistrationSchema, createIndividualRegistrationSchema, updateTeamPartnerSchema } from "./registrations.schema";

export async function createRegistrationHandler(req: Request, res: Response) {
  const isDuo = req.body?.partnerName !== undefined;
  const parsed = isDuo 
    ? createTeamRegistrationSchema.parse(req.body)
    : createIndividualRegistrationSchema.parse(req.body ?? {});
    
  const registration = await registrationsService.createRegistration(req.params.categoryId, req.user!.id, req.user!.role, parsed);
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
  const { partnerName, customOwnerName } = req.body;
  const team = await registrationsService.updateTeamPartnerName(req.params.id, { partnerName, customOwnerName });
  res.status(200).json(team);
}

export async function adminUpdateRegistrationHandler(req: Request, res: Response) {
  const { customPlayerName } = req.body;
  const registration = await registrationsService.updateRegistrationPlayerName(req.params.id, { customPlayerName });
  res.status(200).json(registration);
}

export async function listMyRegistrationsHandler(req: Request, res: Response) {
  const result = await registrationsService.listMyRegistrations(req.user!.id);
  res.status(200).json(result);
}
