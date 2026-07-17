import { Router } from "express";
import { prisma } from "../../prisma/client";
import { authenticate } from "../../shared/middlewares/authenticate";
import { authorize } from "../../shared/middlewares/authorize";
import { asyncHandler } from "../../shared/utils/asyncHandler";

export const rankingsRoutes = Router();

rankingsRoutes.get("/duo", asyncHandler(async (_req, res) => {
  const rankings = await prisma.duoRanking.findMany({
    orderBy: [
      { points: "desc" },
      { wins: "desc" },
    ],
  });
  const players = await prisma.player.findMany();
  const playerMap = new Map(players.map(p => [p.name, { gender: p.gender, photoUrl: p.photoUrl }]));
  const mapped = rankings.map(r => {
    const pA = playerMap.get(r.playerAName);
    const pB = playerMap.get(r.playerBName);
    
    let duoType = "MIXED";
    if (pA?.gender === "MALE" && pB?.gender === "MALE") duoType = "MALE";
    else if (pA?.gender === "FEMALE" && pB?.gender === "FEMALE") duoType = "FEMALE";
    
    return {
      ...r,
      duoType,
      photoUrlA: pA?.photoUrl || null,
      photoUrlB: pB?.photoUrl || null
    };
  });
  res.json(mapped);
}));

rankingsRoutes.get("/individual", asyncHandler(async (_req, res) => {
  const rankings = await prisma.individualRanking.findMany({
    orderBy: [
      { points: "desc" },
      { wins: "desc" },
    ],
  });
  const players = await prisma.player.findMany();
  const playerMap = new Map(players.map(p => [p.name, { gender: p.gender, photoUrl: p.photoUrl }]));
  const mapped = rankings.map(r => {
    const p = playerMap.get(r.playerName);
    return {
      ...r,
      gender: p?.gender || "MALE",
      photoUrl: p?.photoUrl || null
    };
  });
  res.json(mapped);
}));

rankingsRoutes.get("/feminine", asyncHandler(async (_req, res) => {
  const rankings = await prisma.feminineRanking.findMany({
    orderBy: [
      { points: "desc" },
      { wins: "desc" },
    ],
  });
  const players = await prisma.player.findMany();
  const playerMap = new Map(players.map(p => [p.name, { gender: p.gender, photoUrl: p.photoUrl }]));
  const mapped = rankings.map(r => {
    const p = playerMap.get(r.playerName);
    return {
      ...r,
      gender: p?.gender || "FEMALE",
      photoUrl: p?.photoUrl || null
    };
  });
  res.json(mapped);
}));

rankingsRoutes.post("/duo/manual", authenticate, authorize("ADMIN"), asyncHandler(async (req, res) => {
  const { playerAName, playerBName, wins, points } = req.body;
  const sorted = [playerAName, playerBName].sort();
  const record = await prisma.duoRanking.upsert({
    where: {
      playerAName_playerBName: {
        playerAName: sorted[0],
        playerBName: sorted[1],
      },
    },
    update: {
      wins: Number(wins),
      points: Number(points),
      isManual: true,
    },
    create: {
      playerAName: sorted[0],
      playerBName: sorted[1],
      wins: Number(wins),
      points: Number(points),
      isManual: true,
    },
  });
  res.json(record);
}));

rankingsRoutes.post("/individual/manual", authenticate, authorize("ADMIN"), asyncHandler(async (req, res) => {
  const { playerName, wins, points } = req.body;
  const record = await prisma.individualRanking.upsert({
    where: { playerName },
    update: {
      wins: Number(wins),
      points: Number(points),
      isManual: true,
    },
    create: {
      playerName,
      wins: Number(wins),
      points: Number(points),
      isManual: true,
    },
  });
  res.json(record);
}));

rankingsRoutes.post("/feminine/manual", authenticate, authorize("ADMIN"), asyncHandler(async (req, res) => {
  const { playerName, wins, points } = req.body;
  const record = await prisma.feminineRanking.upsert({
    where: { playerName },
    update: {
      wins: Number(wins),
      points: Number(points),
      isManual: true,
    },
    create: {
      playerName,
      wins: Number(wins),
      points: Number(points),
      isManual: true,
    },
  });
  res.json(record);
}));

rankingsRoutes.delete("/duo/:id", authenticate, authorize("ADMIN"), asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  await prisma.duoRanking.delete({ where: { id } });
  res.status(204).end();
}));

rankingsRoutes.delete("/individual/:id", authenticate, authorize("ADMIN"), asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  await prisma.individualRanking.delete({ where: { id } });
  res.status(204).end();
}));

rankingsRoutes.delete("/feminine/:id", authenticate, authorize("ADMIN"), asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  await prisma.feminineRanking.delete({ where: { id } });
  res.status(204).end();
}));
