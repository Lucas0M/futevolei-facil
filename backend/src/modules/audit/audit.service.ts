import { prisma } from "../../prisma/client";

export interface LogFilters {
  userId?: string;
  action?: string;
  module?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export async function listLogs(filters: LogFilters) {
  const page = Number(filters.page) || 1;
  const pageSize = Number(filters.pageSize) || 20;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = { equals: filters.action, mode: "insensitive" };
  }

  if (filters.module) {
    where.module = { equals: filters.module, mode: "insensitive" };
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      // Set to end of day if only date is passed
      const date = new Date(filters.endDate);
      if (filters.endDate.length <= 10) {
        date.setUTCHours(23, 59, 59, 999);
      }
      where.createdAt.lte = date;
    }
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
