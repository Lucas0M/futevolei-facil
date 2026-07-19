import { Request, Response } from "express";
import * as authService from "./auth.service";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.schema";

export async function registerHandler(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  res.status(201).json(result);
}

export async function loginHandler(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);

  // Log successful login
  const { writeAuditLog } = require("../../shared/utils/auditLogger");
  await writeAuditLog({
    userId: result.user.id,
    userName: result.user.name,
    userEmail: result.user.email,
    userRole: result.user.role,
    action: "LOGIN",
    module: "Usuários",
    entity: "User",
    entityId: result.user.id,
    description: `Efetuou login no sistema`,
  });

  res.status(200).json(result);
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  const input = forgotPasswordSchema.parse(req.body);
  await authService.forgotPassword(input);
  // Generic message on purpose - see comment in auth.service.ts.
  res.status(200).json({ message: "Se este e-mail estiver cadastrado, você receberá um link de redefinição." });
}

export async function resetPasswordHandler(req: Request, res: Response) {
  const input = resetPasswordSchema.parse(req.body);
  await authService.resetPassword(input);
  res.status(200).json({ message: "Senha redefinida com sucesso." });
}

export async function logoutHandler(req: Request, res: Response) {
  if (req.user) {
    const { writeAuditLog } = require("../../shared/utils/auditLogger");
    await writeAuditLog({
      userId: req.user.id,
      action: "LOGOUT",
      module: "Usuários",
      entity: "User",
      entityId: req.user.id,
      description: "Efetuou logout do sistema",
    });
  }
  res.status(200).json({ message: "Logout efetuado com sucesso." });
}

