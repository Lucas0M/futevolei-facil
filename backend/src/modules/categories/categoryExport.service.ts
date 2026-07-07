import { prisma } from "../../prisma/client";
import { AppError } from "../../shared/errors/AppError";

// RF21 - CSV export of a category's registrants, for use on event day.
export async function exportCategoryRegistrantsCsv(categoryId: string): Promise<string> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      registrations: { include: { user: true } },
      teams: { include: { ownerUser: true } },
    },
  });

  if (!category) {
    throw new AppError("Categoria não encontrada.", 404, "CATEGORY_NOT_FOUND");
  }

  const rows: string[] = [];

  if (category.format === "DUO_FIXED") {
    rows.push("Dono da dupla,E-mail do dono,Telefone do dono,Nome do parceiro,Status,Valor devido");
    for (const team of category.teams) {
      rows.push(
        [team.ownerUser.name, team.ownerUser.email, team.ownerUser.phone ?? "", team.partnerName, team.status, team.amountDue.toString()]
          .map(escapeCsvField)
          .join(",")
      );
    }
  } else {
    rows.push("Nome,E-mail,Telefone,Status,Valor devido");
    for (const registration of category.registrations) {
      rows.push(
        [
          registration.user.name,
          registration.user.email,
          registration.user.phone ?? "",
          registration.status,
          registration.amountDue.toString(),
        ]
          .map(escapeCsvField)
          .join(",")
      );
    }
  }

  return rows.join("\n");
}

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
