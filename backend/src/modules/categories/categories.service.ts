import {
  CategoryFormat,
  EntityStatus,
  RegistrationStatus,
  TeamRegistrationStatus,
} from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AppError } from "../../shared/errors/AppError";
import { CreateCategoryInput, UpdateCategoryInput } from "./categories.schema";

export async function createCategory(
  tournamentId: string,
  input: CreateCategoryInput,
) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) {
    throw new AppError("Torneio não encontrado.", 404, "TOURNAMENT_NOT_FOUND");
  }

  return prisma.category.create({
    data: { ...input, tournamentId, status: EntityStatus.DRAFT },
  });
}

export async function updateCategory(
  categoryId: string,
  input: UpdateCategoryInput,
) {
  const category = await findCategoryOrThrow(categoryId);

  if (category.status === EntityStatus.CANCELLED) {
    throw new AppError(
      "Não é possível editar uma categoria cancelada.",
      400,
      "CATEGORY_CANCELLED",
    );
  }

  return prisma.category.update({ where: { id: categoryId }, data: input });
}

export async function cancelCategory(categoryId: string) {
  const category = await findCategoryOrThrow(categoryId);

  if (category.status === EntityStatus.CANCELLED) {
    throw new AppError(
      "Esta categoria já está cancelada.",
      400,
      "CATEGORY_ALREADY_CANCELLED",
    );
  }

  return prisma.category.update({
    where: { id: categoryId },
    data: { status: EntityStatus.CANCELLED },
  });
}

export async function publishCategory(categoryId: string) {
  const category = await findCategoryOrThrow(categoryId);

  if (category.status !== EntityStatus.DRAFT) {
    throw new AppError(
      "Apenas categorias em rascunho podem ser publicadas.",
      400,
      "INVALID_STATUS_TRANSITION",
    );
  }

  return prisma.category.update({
    where: { id: categoryId },
    data: { status: EntityStatus.PUBLISHED },
  });
}

// Detail view: full info + minimal, non-sensitive registrant list (RN10).
export async function getCategoryDetail(
  categoryId: string,
  requesterRole: string,
) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      tournament: {
        select: { id: true, name: true, eventDate: true, location: true },
      },
      registrations: {
        select: { status: true, user: { select: { name: true } } },
      },
      teams: {
        select: {
          status: true,
          partnerName: true,
          ownerUser: { select: { name: true } },
        },
      },
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
      ? category.teams.filter(
          (t) => t.status === "PENDING_PAYMENT" || t.status === "CONFIRMED",
        ).length
      : category.registrations.filter(
          (r) => r.status === "PENDING_PAYMENT" || r.status === "CONFIRMED",
        ).length;

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
        ? category.teams.map((t) => ({
            kind: "team" as const,
            id: t.id,
            ownerName: t.ownerUser.name,
            partnerName: t.partnerName,
            status: t.status,
          }))
        : category.registrations.map((r) => ({
            kind: "registration" as const,
            id: r.id,
            name: r.user.name,
            status: r.status,
          })),
  };
}

export interface GeneratedBracketParticipant {
  id: string;
  name: string;
  registeredAt: Date;
}

export interface GeneratedBracketMatch {
  position: number;
  competitorA: GeneratedBracketParticipant;
  competitorB: GeneratedBracketParticipant | null;
}

export interface GeneratedBracket {
  categoryId: string;
  categoryName: string;
  tournamentName: string;
  format: CategoryFormat;
  participantCount: number;
  matches: GeneratedBracketMatch[];
  byes: GeneratedBracketParticipant[];
}

export async function generateCategoryBracket(
  categoryId: string,
): Promise<GeneratedBracket> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      tournament: { select: { name: true } },
      registrations: {
        where: { status: RegistrationStatus.CONFIRMED },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      teams: {
        where: { status: TeamRegistrationStatus.CONFIRMED },
        include: { ownerUser: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!category) {
    throw new AppError("Categoria não encontrada.", 404, "CATEGORY_NOT_FOUND");
  }
  if (
    category.status === EntityStatus.DRAFT ||
    category.status === EntityStatus.CANCELLED
  ) {
    throw new AppError(
      "Esta categoria ainda não está pronta para gerar chaveamento.",
      400,
      "CATEGORY_NOT_READY",
    );
  }

  const participants =
    category.format === CategoryFormat.DUO_FIXED
      ? category.teams.map((team) => ({
          id: team.id,
          name: `${team.ownerUser.name} + ${team.partnerName}`,
          registeredAt: team.createdAt,
        }))
      : category.registrations.map((registration) => ({
          id: registration.id,
          name: registration.user.name,
          registeredAt: registration.createdAt,
        }));

  if (participants.length < 2) {
    throw new AppError(
      "São necessários ao menos dois inscritos confirmados para gerar o chaveamento.",
      400,
      "BRACKET_TOO_SMALL",
    );
  }

  const seededParticipants = shuffleParticipants(participants, category.id);
  const matches: GeneratedBracketMatch[] = [];
  const byes: GeneratedBracketParticipant[] = [];

  for (let index = 0; index < seededParticipants.length; index += 2) {
    const competitorA = seededParticipants[index];
    const competitorB = seededParticipants[index + 1] ?? null;

    if (!competitorB) {
      byes.push(competitorA);
      continue;
    }

    matches.push({
      position: matches.length + 1,
      competitorA,
      competitorB,
    });
  }

  return {
    categoryId: category.id,
    categoryName: category.name,
    tournamentName: category.tournament.name,
    format: category.format,
    participantCount: participants.length,
    matches,
    byes,
  };
}

function shuffleParticipants<T extends { id: string }>(
  participants: T[],
  seedSource: string,
) {
  const shuffled = [...participants];
  let seed = hashString(seedSource);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = nextSeed(seed);
    const swapIndex = seed % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function nextSeed(seed: number) {
  return (Math.imul(seed ^ 0x5bd1e995, 0x6c078965) + 0x7fffffff) >>> 0;
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

async function findCategoryOrThrow(categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    throw new AppError("Categoria não encontrada.", 404, "CATEGORY_NOT_FOUND");
  }
  return category;
}
