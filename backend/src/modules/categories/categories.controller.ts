import { Request, Response } from "express";
import * as categoriesService from "./categories.service";
import * as categoryExportService from "./categoryExport.service";
import {
  createCategorySchema,
  updateCategorySchema,
} from "./categories.schema";

export async function createCategoryHandler(
  req: Request,
  res: Response,
) {
  const input = createCategorySchema.parse(req.body);
  const tournamentId = req.params.tournamentId as string;
  const category = await categoriesService.createCategory(tournamentId, input);
  res.status(201).json(category);
}

export async function updateCategoryHandler(
  req: Request,
  res: Response,
) {
  const input = updateCategorySchema.parse(req.body);
  const categoryId = req.params.id as string;
  const category = await categoriesService.updateCategory(categoryId, input);
  res.status(200).json(category);
}

export async function cancelCategoryHandler(
  req: Request,
  res: Response,
) {
  const categoryId = req.params.id as string;
  const category = await categoriesService.deleteCategory(categoryId);
  res.status(200).json(category);
}

export async function publishCategoryHandler(
  req: Request,
  res: Response,
) {
  const categoryId = req.params.id as string;
  const category = await categoriesService.publishCategory(categoryId);
  res.status(200).json(category);
}

export async function getCategoryDetailHandler(
  req: Request,
  res: Response,
) {
  const categoryId = req.params.id as string;
  const category = await categoriesService.getCategoryDetail(
    categoryId,
    req.user?.role ?? "PLAYER",
  );
  res.status(200).json(category);
}

export async function exportCategoryRegistrantsHandler(
  req: Request,
  res: Response,
) {
  const categoryId = req.params.id as string;
  const csv =
    await categoryExportService.exportCategoryRegistrantsCsv(categoryId);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="inscritos-${categoryId}.csv"`,
  );
  res.status(200).send(csv);
}

export async function generateCategoryBracketHandler(
  req: Request,
  res: Response,
) {
  const categoryId = req.params.id as string;
  const bracket = await categoriesService.generateCategoryBracket(categoryId);
  res.status(200).json(bracket);
}

export async function generatePersistentBracketHandler(
  req: Request,
  res: Response,
) {
  const categoryId = req.params.id as string;
  const { bracketStyle, numGroups } = req.body;
  const bracket = await categoriesService.generatePersistentBracket(
    categoryId,
    bracketStyle,
    numGroups ? Number(numGroups) : undefined,
  );
  res.status(200).json(bracket);
}

export async function updateMatchWinnerHandler(
  req: Request,
  res: Response,
) {
  const matchId = req.params.matchId as string;
  const { winnerId, score } = req.body;
  let match;
  if (winnerId === "RESET") {
    match = await categoriesService.resetMatchWinner(matchId);
  } else {
    match = await categoriesService.updateMatchWinner(matchId, winnerId, score);
  }
  res.status(200).json(match);
}

export async function updateMatchManualHandler(
  req: Request,
  res: Response,
) {
  const matchId = req.params.matchId as string;
  const match = await categoriesService.updateMatchManual(matchId, req.body);
  res.status(200).json(match);
}

