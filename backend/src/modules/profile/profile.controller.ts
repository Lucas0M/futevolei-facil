import { Request, Response } from "express";
import * as profileService from "./profile.service";
import { updateProfileSchema, updatePasswordSchema } from "./profile.schema";

export async function getProfileHandler(req: Request, res: Response) {
  const user = await profileService.getProfile(req.user!.id);
  res.status(200).json(user);
}

export async function updateProfileHandler(req: Request, res: Response) {
  const data = updateProfileSchema.parse(req.body);
  const user = await profileService.updateProfile(req.user!.id, data);
  res.status(200).json(user);
}

export async function updatePasswordHandler(req: Request, res: Response) {
  const data = updatePasswordSchema.parse(req.body);
  await profileService.updatePassword(req.user!.id, data);
  res.status(204).end();
}
