interface PasswordResetEmailInput {
  userName: string;
  resetLink: string;
}

// Templates return raw HTML strings. Kept simple on purpose for the MVP -
// no external template engine needed for a handful of transactional emails.
export function passwordResetEmail({ userName, resetLink }: PasswordResetEmailInput): {
  subject: string;
  html: string;
} {
  return {
    subject: "Redefinição de senha - Futevôlei Torneios",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Olá, ${userName}!</h2>
        <p>Recebemos uma solicitação para redefinir sua senha.</p>
        <p>
          <a href="${resetLink}" style="background:#16a34a;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">
            Redefinir minha senha
          </a>
        </p>
        <p>Se você não solicitou isso, pode ignorar este e-mail com segurança.</p>
        <p>Este link expira em 1 hora.</p>
      </div>
    `,
  };
}
