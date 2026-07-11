"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCategoryRegistrantsCsv = exportCategoryRegistrantsCsv;
const client_1 = require("../../prisma/client");
const AppError_1 = require("../../shared/errors/AppError");
// RF21 - CSV export of a category's registrants, for use on event day.
async function exportCategoryRegistrantsCsv(categoryId) {
    const category = await client_1.prisma.category.findUnique({
        where: { id: categoryId },
        include: {
            registrations: { include: { user: true } },
            teams: { include: { ownerUser: true } },
        },
    });
    if (!category) {
        throw new AppError_1.AppError("Categoria não encontrada.", 404, "CATEGORY_NOT_FOUND");
    }
    const rows = [];
    if (category.format === "DUO_FIXED") {
        rows.push("Dono da dupla,E-mail do dono,Telefone do dono,Nome do parceiro,Status,Valor devido");
        for (const team of category.teams) {
            rows.push([team.customOwnerName ?? team.ownerUser.name, team.ownerUser.email, team.ownerUser.phone ?? "", team.partnerName, team.status, team.amountDue.toString()]
                .map(escapeCsvField)
                .join(","));
        }
    }
    else {
        rows.push("Nome,E-mail,Telefone,Status,Valor devido");
        for (const registration of category.registrations) {
            rows.push([
                registration.customPlayerName ?? registration.user.name,
                registration.user.email,
                registration.user.phone ?? "",
                registration.status,
                registration.amountDue.toString(),
            ]
                .map(escapeCsvField)
                .join(","));
        }
    }
    return rows.join("\n");
}
function escapeCsvField(value) {
    if (/[",\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
//# sourceMappingURL=categoryExport.service.js.map