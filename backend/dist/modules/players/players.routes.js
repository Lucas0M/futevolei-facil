"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playersRoutes = void 0;
const express_1 = require("express");
const client_1 = require("../../prisma/client");
const authenticate_1 = require("../../shared/middlewares/authenticate");
const authorize_1 = require("../../shared/middlewares/authorize");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
const AppError_1 = require("../../shared/errors/AppError");
exports.playersRoutes = (0, express_1.Router)();
// List all players
exports.playersRoutes.get("/", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 10;
    const search = req.query.search ? req.query.search.trim() : "";
    const where = {};
    if (search) {
        where.name = {
            contains: search,
            mode: "insensitive",
        };
    }
    if (page !== undefined) {
        const skip = (page - 1) * pageSize;
        const [players, total] = await client_1.prisma.$transaction([
            client_1.prisma.player.findMany({
                where,
                orderBy: { name: "asc" },
                skip,
                take: pageSize,
            }),
            client_1.prisma.player.count({ where }),
        ]);
        res.json({
            data: players,
            meta: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    }
    else {
        const players = await client_1.prisma.player.findMany({
            where,
            orderBy: { name: "asc" }
        });
        res.json(players);
    }
}));
// Create player
exports.playersRoutes.post("/", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { name, gender, photoUrl } = req.body;
    if (!name || !gender) {
        throw new AppError_1.AppError("Nome e sexo são obrigatórios.", 400);
    }
    if (gender !== "MALE" && gender !== "FEMALE") {
        throw new AppError_1.AppError("Sexo deve ser MALE ou FEMALE.", 400);
    }
    // Check unique name
    const existing = await client_1.prisma.player.findUnique({ where: { name } });
    if (existing) {
        throw new AppError_1.AppError("Já existe um participante cadastrado com este nome.", 400);
    }
    const player = await client_1.prisma.player.create({
        data: { name, gender, photoUrl }
    });
    res.status(201).json(player);
}));
// Update player
exports.playersRoutes.put("/:id", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const { name, gender, photoUrl } = req.body;
    if (!name || !gender) {
        throw new AppError_1.AppError("Nome e sexo são obrigatórios.", 400);
    }
    if (gender !== "MALE" && gender !== "FEMALE") {
        throw new AppError_1.AppError("Sexo deve ser MALE ou FEMALE.", 400);
    }
    // Check unique name excluding this player
    const existing = await client_1.prisma.player.findFirst({
        where: { name, id: { not: id } }
    });
    if (existing) {
        throw new AppError_1.AppError("Já existe outro participante cadastrado com este nome.", 400);
    }
    const player = await client_1.prisma.player.update({
        where: { id },
        data: { name, gender, photoUrl }
    });
    res.json(player);
}));
// Delete player
exports.playersRoutes.delete("/:id", authenticate_1.authenticate, (0, authorize_1.authorize)("ADMIN"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    await client_1.prisma.player.delete({ where: { id } });
    res.status(204).end();
}));
//# sourceMappingURL=players.routes.js.map