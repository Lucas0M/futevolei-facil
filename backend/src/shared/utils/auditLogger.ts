import { requestContextStorage } from "./requestContext";
import { rawPrisma } from "../../prisma/client";

export function maskSensitiveData(data: any): any {
  if (!data) return data;
  if (typeof data !== "object") return data;
  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }
  const masked = { ...data };
  const sensitiveKeys = [
    "password",
    "passwordHash",
    "token",
    "newPassword",
    "currentPassword",
    "passwordResetTokens",
    "jwt",
    "secret",
  ];
  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.includes(key)) {
      masked[key] = "[MASCARADO]";
    } else if (typeof masked[key] === "object") {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  return masked;
}

function getModelNamePt(model: string): string {
  switch (model.toLowerCase()) {
    case "user": return "Usuário";
    case "tournament": return "Torneio";
    case "category": return "Categoria";
    case "registration": return "Inscrição";
    case "team": return "Equipe";
    case "payment": return "Pagamento";
    case "match": return "Partida";
    case "player": return "Atleta";
    case "duoranking":
    case "individualranking":
    case "feminineranking":
      return "Ranking";
    default: return model;
  }
}

export function getModuleName(model: string): string {
  switch (model.toLowerCase()) {
    case "user": return "Usuários";
    case "tournament":
    case "category":
    case "match":
      return "Torneios";
    case "registration": return "Inscrições";
    case "team": return "Equipes";
    case "payment": return "Pagamentos";
    case "player": return "Atletas";
    case "duoranking":
    case "individualranking":
    case "feminineranking":
      return "Rankings";
    default: return "Outros";
  }
}

export function generateDescription(model: string, action: string, record: any): string {
  const modelPt = getModelNamePt(model);
  const identifier = record?.name || record?.title || record?.email || record?.playerName || record?.id || "";
  const identifierStr = identifier ? ` "${identifier}"` : "";

  switch (action.toUpperCase()) {
    case "CREATE":
      return `Criou ${modelPt.toLowerCase()}${identifierStr}`;
    case "UPDATE":
      return `Atualizou ${modelPt.toLowerCase()}${identifierStr}`;
    case "DELETE":
      return `Excluiu ${modelPt.toLowerCase()}${identifierStr}`;
    default:
      return `${action} no módulo ${modelPt}`;
  }
}

export interface AuditLogPayload {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  module: string;
  entity: string;
  entityId?: string;
  description: string;
  oldData?: any;
  newData?: any;
  ip?: string;
  userAgent?: string;
}

export async function writeAuditLog(payload: AuditLogPayload) {
  try {
    const context = requestContextStorage.getStore();

    // Use payload values or fall back to request context
    const userId = payload.userId || context?.userId;
    const ip = payload.ip || context?.ip || null;
    const userAgent = payload.userAgent || context?.userAgent || null;

    let userName = payload.userName || null;
    let userEmail = payload.userEmail || null;
    let userRole = payload.userRole || context?.userRole || null;

    // Fetch user info from database if authenticated and not provided in payload
    if (userId && (!userName || !userEmail)) {
      const user = await rawPrisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, role: true },
      });
      if (user) {
        userName = user.name;
        userEmail = user.email;
        userRole = user.role;
      }
    }

    await rawPrisma.auditLog.create({
      data: {
        userId,
        userName,
        userEmail,
        userRole,
        action: payload.action,
        module: payload.module,
        entity: payload.entity,
        entityId: payload.entityId || null,
        description: payload.description,
        oldData: payload.oldData ? maskSensitiveData(payload.oldData) : null,
        newData: payload.newData ? maskSensitiveData(payload.newData) : null,
        ip,
        userAgent,
      },
    });
  } catch (error) {
    // Audit logging failure should not halt the request/transaction
    console.error("Failed to write audit log:", error);
  }
}
