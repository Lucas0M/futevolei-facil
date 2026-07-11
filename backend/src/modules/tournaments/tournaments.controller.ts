import { Request, Response } from "express";
import * as tournamentsService from "./tournaments.service";
import { createTournamentSchema, updateTournamentSchema, listTournamentsQuerySchema } from "./tournaments.schema";

export async function createTournamentHandler(req: Request, res: Response) {
  const input = createTournamentSchema.parse(req.body);
  const tournament = await tournamentsService.createTournament(req.user!.id, input);
  res.status(201).json(tournament);
}

export async function updateTournamentHandler(req: Request, res: Response) {
  const input = updateTournamentSchema.parse(req.body);
  const tournament = await tournamentsService.updateTournament(req.params.id, input);
  res.status(200).json(tournament);
}

export async function cancelTournamentHandler(req: Request, res: Response) {
  const tournament = await tournamentsService.deleteTournament(req.params.id);
  res.status(200).json(tournament);
}

export async function publishTournamentHandler(req: Request, res: Response) {
  const tournament = await tournamentsService.publishTournament(req.params.id);
  res.status(200).json(tournament);
}

export async function listTournamentsHandler(req: Request, res: Response) {
  const query = listTournamentsQuerySchema.parse(req.query);
  const result = await tournamentsService.listTournaments({ ...query, requesterRole: req.user?.role ?? "PLAYER" });
  res.status(200).json(result);
}

export async function getTournamentDetailHandler(req: Request, res: Response) {
  const tournament = await tournamentsService.getTournamentDetail(req.params.id, req.user?.role ?? "PLAYER");
  res.status(200).json(tournament);
}

export async function getTournamentPendingPaymentsHandler(req: Request, res: Response) {
  const pendingPayments = await tournamentsService.getTournamentPendingPayments(req.params.id);
  res.status(200).json(pendingPayments);
}
