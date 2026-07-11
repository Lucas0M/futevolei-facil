"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rankingsRoutes = void 0;
const express_1 = require("express");
const client_1 = require("../../prisma/client");
exports.rankingsRoutes = (0, express_1.Router)();
exports.rankingsRoutes.get("/duo", async (_req, res) => {
    const rankings = await client_1.prisma.duoRanking.findMany({
        orderBy: [
            { points: "desc" },
            { wins: "desc" },
        ],
    });
    res.json(rankings);
});
exports.rankingsRoutes.get("/individual", async (_req, res) => {
    const rankings = await client_1.prisma.individualRanking.findMany({
        orderBy: [
            { points: "desc" },
            { wins: "desc" },
        ],
    });
    res.json(rankings);
});
//# sourceMappingURL=rankings.routes.js.map