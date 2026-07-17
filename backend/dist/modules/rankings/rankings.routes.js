"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rankingsRoutes = void 0;
const express_1 = require("express");
const client_1 = require("../../prisma/client");
const authenticate_1 = require("../../shared/middlewares/authenticate");
const authorize_1 = require("../../shared/middlewares/authorize");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
exports.rankingsRoutes = (0, express_1.Router)();
exports.rankingsRoutes.get("/duo", (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const rankings = await client_1.prisma.duoRanking.findMany({
        orderBy: [
            { points: "desc" },
            { wins: "desc" },
        ],
    });
    const players = await client_1.prisma.player.findMany();
    const playerMap = new Map(players.map(p => [p.name, { gender: p.gender, photoUrl: p.photoUrl }]));
    const mapped = rankings.map(r => {
        const pA = playerMap.get(r.playerAName);
        const pB = playerMap.get(r.playerBName);
        let duoType = "MIXED";
        if (pA?.gender === "MALE" && pB?.gender === "MALE")
            duoType = "MALE";
        else if (pA?.gender === "FEMALE" && pB?.gender === "FEMALE")
            duoType = "FEMALE";
        return {
            ...r,
            duoType,
            photoUrlA: pA?.photoUrl || null,
            photoUrlB: pB?.photoUrl || null
        };
    });
    res.json(mapped);
}));
exports.rankingsRoutes.get("/individual", (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const rankings = await client_1.prisma.individualRanking.findMany({
        orderBy: [
            { points: "desc" },
            { wins: "desc" },
        ],
    });
    const players = await client_1.prisma.player.findMany();
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
exports.rankingsRoutes.get("/feminine", (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const rankings = await client_1.prisma.feminineRanking.findMany({
        orderBy: [
            { points: "desc" },
            { wins: "desc" },
        ],
    });
    const players = await client_1.prisma.player.findMany();
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
exports.rankingsRoutes.post("/duo/manual", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { playerAName, playerBName, wins, points } = req.body;
    const sorted = [playerAName, playerBName].sort();
    const record = await client_1.prisma.duoRanking.upsert({
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
exports.rankingsRoutes.post("/individual/manual", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { playerName, wins, points } = req.body;
    const record = await client_1.prisma.individualRanking.upsert({
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
exports.rankingsRoutes.post("/feminine/manual", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { playerName, wins, points } = req.body;
    const record = await client_1.prisma.feminineRanking.upsert({
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
exports.rankingsRoutes.delete("/duo/:id", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    await client_1.prisma.duoRanking.delete({ where: { id } });
    res.status(204).end();
}));
exports.rankingsRoutes.delete("/individual/:id", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    await client_1.prisma.individualRanking.delete({ where: { id } });
    res.status(204).end();
}));
exports.rankingsRoutes.delete("/feminine/:id", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    await client_1.prisma.feminineRanking.delete({ where: { id } });
    res.status(204).end();
}));
//# sourceMappingURL=rankings.routes.js.map