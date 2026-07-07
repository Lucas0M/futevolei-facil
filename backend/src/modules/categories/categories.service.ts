import { EntityStatus } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AppError } from "../../shared/errors/AppError";
import { CreateCategoryInput, UpdateCategoryInput } from "./categories.schema";

export async function createCategory(tournamentId: string, input: CreateCategoryInput) {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) {
    throw new AppError("Torneio não encontrado.", 404, "TOURNAMENT_NOT_FOUND");
  }

  return prisma.category.create({
    data: { ...input, tournamentId, status: EntityStatus.DRAFT },
  });
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput) {
  const category = await findCategoryOrThrow(categoryId);

  if (category.status === EntityStatus.CANCELLED) {
    throw new AppError("Não é possível editar uma categoria cancelada.", 400, "CATEGORY_CANCELLED");
  }

  return prisma.category.update({ where: { id: categoryId }, data: input });
}

export async function cancelCategory(categoryId: string) {
  const category = await findCategoryOrThrow(categoryId);

  if (category.status === EntityStatus.CANCELLED) {
    throw new AppError("Esta categoria já está cancelada.", 400, "CATEGORY_ALREADY_CANCELLED");
  }

  return prisma.category.update({ where: { id: categoryId }, data: { status: EntityStatus.CANCELLED } });
}

export async function publishCategory(categoryId: string) {
  const category = await findCategoryOrThrow(categoryId);

  if (category.status !== EntityStatus.DRAFT) {
    throw new AppError("Apenas categorias em rascunho podem ser publicadas.", 400, "INVALID_STATUS_TRANSITION");
  }

  return prisma.category.update({ where: { id: categoryId }, data: { status: EntityStatus.PUBLISHED } });
}

// Detail view: full info + minimal, non-sensitive registrant list (RN10).
export async function getCategoryDetail(categoryId: string, requesterRole: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      tournament: { select: { id: true, name: true, eventDate: true, location: true } },
      registrations: { select: { status: true, user: { select: { name: true } } } },
      teams: { select: { status: true, partnerName: true, ownerUser: { select: { name: true } } } },
    },
  });

  if (!category) {
    throw new AppError("Categoria não encontrada.", 404, "CATEGORY_NOT_FOUND");
  }
  if (category.status === EntityStatus.DRAFT && requesterRole !== "ADMIN") {
    throw new AppError("Categoria não encontrada.", 404, "CATEGORY_NOT_FOUND");
  }

  const occupiedSlots =
    category.format === "DUO_FIXED"
      ? category.teams.filter((t) => t.status === "PENDING_PAYMENT" || t.status === "CONFIRMED").length
      : category.registrations.filter((r) => r.status === "PENDING_PAYMENT" || r.status === "CONFIRMED").length;

  return {
    id: category.id,
    name: category.name,
    format: category.format,
    entryFee: category.entryFee,
    maxSlots: category.maxSlots,
    occupiedSlots,
    availableSlots: Math.max(category.maxSlots - occupiedSlots, 0),
    registrationDeadline: category.registrationDeadline,
    status: category.status,
    tournament: category.tournament,
    registrants:
      category.format === "DUO_FIXED"
        ? category.teams.map((t) => ({ ownerName: t.ownerUser.name, partnerName: t.partnerName, status: t.status }))
        : category.registrations.map((r) => ({ name: r.user.name, status: r.status })),
  };
}

async function findCategoryOrThrow(categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new AppError("Categoria não encontrada.", 404, "CATEGORY_NOT_FOUND");
  }
  return category;
}
