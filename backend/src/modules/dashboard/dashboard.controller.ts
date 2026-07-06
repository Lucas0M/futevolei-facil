import { Request, Response } from "express";
import * as dashboardService from "./dashboard.service";

export async function getDashboardHandler(_req: Request, res: Response) {
  const summary = await dashboardService.getDashboardSummary();
  res.status(200).json(summary);
}
