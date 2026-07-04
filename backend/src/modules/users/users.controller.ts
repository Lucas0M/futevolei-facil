import { Request, Response } from "express";
import * as usersService from "./users.service";
import { listUsersQuerySchema } from "./users.schema";

export async function getMeHandler(req: Request, res: Response) {
  // req.user is guaranteed to exist here because this route runs after `authenticate`.
  const user = await usersService.getMe(req.user!.id);
  res.status(200).json(user);
}

export async function listUsersHandler(req: Request, res: Response) {
  const query = listUsersQuerySchema.parse(req.query);
  const result = await usersService.listUsers(query);
  res.status(200).json(result);
}

export async function promoteToAdminHandler(req: Request, res: Response) {
  const user = await usersService.promoteToAdmin(req.params.id);
  res.status(200).json(user);
}
