import { Router } from "express";
import { prisma } from "../../prisma/client";
import { authenticate } from "../../shared/middlewares/authenticate";
import { authorize } from "../../shared/middlewares/authorize";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { AppError } from "../../shared/errors/AppError";

export const playersRoutes = Router();

// List all players
playersRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const players = await prisma.player.findMany({
      orderBy: { name: "asc" }
    });
    res.json(players);
  })
);

// Create player
playersRoutes.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    const { name, gender, photoUrl } = req.body;
    if (!name || !gender) {
      throw new AppError("Nome e sexo são obrigatórios.", 400);
    }
    if (gender !== "MALE" && gender !== "FEMALE") {
      throw new AppError("Sexo deve ser MALE ou FEMALE.", 400);
    }

    // Check unique name
    const existing = await prisma.player.findUnique({ where: { name } });
    if (existing) {
      throw new AppError("Já existe um participante cadastrado com este nome.", 400);
    }

    const player = await prisma.player.create({
      data: { name, gender, photoUrl }
    });
    res.status(201).json(player);
  })
);

// Update player
playersRoutes.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const { name, gender, photoUrl } = req.body;
    if (!name || !gender) {
      throw new AppError("Nome e sexo são obrigatórios.", 400);
    }
    if (gender !== "MALE" && gender !== "FEMALE") {
      throw new AppError("Sexo deve ser MALE ou FEMALE.", 400);
    }

    // Check unique name excluding this player
    const existing = await prisma.player.findFirst({
      where: { name, id: { not: id } }
    });
    if (existing) {
      throw new AppError("Já existe outro participante cadastrado com este nome.", 400);
    }

    const player = await prisma.player.update({
      where: { id },
      data: { name, gender, photoUrl }
    });
    res.json(player);
  })
);

// Delete player
playersRoutes.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    await prisma.player.delete({ where: { id } });
    res.status(204).end();
  })
);
