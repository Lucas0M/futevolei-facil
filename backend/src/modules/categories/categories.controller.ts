import { Request, Response } from "express";
import * as categoriesService from "./categories.service";
import * as categoryExportService from "./categoryExport.service";
import { createCategorySchema, updateCategorySchema } from "./categories.schema";

export async function createCategoryHandler(req: Request, res: Response) {
  const input = createCategorySchema.parse(req.body);
  const category = await categoriesService.createCategory(req.params.tournamentId, input);
  res.status(201).json(category);
}

export async function updateCategoryHandler(req: Request, res: Response) {
  const input = updateCategorySchema.parse(req.body);
  const category = await categoriesService.updateCategory(req.params.id, input);
  res.status(200).json(category);
}

export async function cancelCategoryHandler(req: Request, res: Response) {
  const category = await categoriesService.cancelCategory(req.params.id);
  res.status(200).json(category);
}

export async function publishCategoryHandler(req: Request, res: Response) {
  const category = await categoriesService.publishCategory(req.params.id);
  res.status(200).json(category);
}

export async function getCategoryDetailHandler(req: Request, res: Response) {
  const category = await categoriesService.getCategoryDetail(req.params.id, req.user?.role ?? "PLAYER");
  res.status(200).json(category);
}

export async function exportCategoryRegistrantsHandler(req: Request, res: Response) {
  const csv = await categoryExportService.exportCategoryRegistrantsCsv(req.params.id);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="inscritos-${req.params.id}.csv"`);
  res.status(200).send(csv);
}
