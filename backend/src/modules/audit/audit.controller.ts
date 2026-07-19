import { Request, Response } from "express";
import * as auditService from "./audit.service";

export async function listLogsHandler(req: Request, res: Response) {
  const filters = {
    userId: req.query.userId as string,
    action: req.query.action as string,
    module: req.query.module as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  };

  const result = await auditService.listLogs(filters);
  res.status(200).json(result);
}
