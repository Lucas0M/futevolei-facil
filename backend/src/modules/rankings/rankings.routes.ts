import { Router } from "express";
import { prisma } from "../../prisma/client";

export const rankingsRoutes = Router();

rankingsRoutes.get("/duo", async (_req, res) => {
  const rankings = await prisma.duoRanking.findMany({
    orderBy: [
      { points: "desc" },
      { wins: "desc" },
    ],
  });
  res.json(rankings);
});

rankingsRoutes.get("/individual", async (_req, res) => {
  const rankings = await prisma.individualRanking.findMany({
    orderBy: [
      { points: "desc" },
      { wins: "desc" },
    ],
  });
  res.json(rankings);
});
