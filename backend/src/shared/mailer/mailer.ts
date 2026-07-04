import { Resend } from "resend";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

// Centralized email sending. Every feature that needs to email a user
// (password reset now, registration/payment notifications later - RF23)
// should go through this function instead of calling Resend directly.
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  if (!resend) {
    // Fails loudly in logs instead of silently pretending the email was sent,
    // which would be confusing while RESEND_API_KEY is not configured yet.
    logger.warn({ to, subject }, "RESEND_API_KEY not set - email was NOT sent");
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    logger.error({ error, to, subject }, "Failed to send email via Resend");
    throw new Error("Failed to send email");
  }
}
