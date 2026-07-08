import { Request, Response } from "express";
import * as categoriesService from "./categories.service";
import * as categoryExportService from "./categoryExport.service";
import {
  createCategorySchema,
  updateCategorySchema,
} from "./categories.schema";

export async function createCategoryHandler(
  req: Request<{ tournamentId: string }>,
  res: Response,
) {
  const input = createCategorySchema.parse(req.body);
  const { tournamentId } = req.params;
  const category = await categoriesService.createCategory(tournamentId, input);
  res.status(201).json(category);
}

export async function updateCategoryHandler(
  req: Request<{ id: string }>,
  res: Response,
) {
  const input = updateCategorySchema.parse(req.body);
  const { id: categoryId } = req.params;
  const category = await categoriesService.updateCategory(categoryId, input);
  res.status(200).json(category);
}

export async function cancelCategoryHandler(
  req: Request<{ id: string }>,
  res: Response,
) {
  const { id: categoryId } = req.params;
  const category = await categoriesService.cancelCategory(categoryId);
  res.status(200).json(category);
}

export async function publishCategoryHandler(
  req: Request<{ id: string }>,
  res: Response,
) {
  const { id: categoryId } = req.params;
  const category = await categoriesService.publishCategory(categoryId);
  res.status(200).json(category);
}

export async function getCategoryDetailHandler(
  req: Request<{ id: string }>,
  res: Response,
) {
  const { id: categoryId } = req.params;
  const category = await categoriesService.getCategoryDetail(
    categoryId,
    req.user?.role ?? "PLAYER",
  );
  res.status(200).json(category);
}

export async function exportCategoryRegistrantsHandler(
  req: Request<{ id: string }>,
  res: Response,
) {
  const { id: categoryId } = req.params;
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
  req: Request<{ id: string }>,
  res: Response,
) {
  const { id: categoryId } = req.params;
  const bracket = await categoriesService.generateCategoryBracket(categoryId);
  res.status(200).json(bracket);
}
