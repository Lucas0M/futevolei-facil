"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const resend_1 = require("resend");
const env_1 = require("../../config/env");
const logger_1 = require("../../config/logger");
const resend = env_1.env.RESEND_API_KEY ? new resend_1.Resend(env_1.env.RESEND_API_KEY) : null;
// Centralized email sending. Every feature that needs to email a user
// (password reset now, registration/payment notifications later - RF23)
// should go through this function instead of calling Resend directly.
async function sendEmail({ to, subject, html }) {
    if (!resend) {
        // Fails loudly in logs instead of silently pretending the email was sent,
        // which would be confusing while RESEND_API_KEY is not configured yet.
        logger_1.logger.warn({ to, subject }, "RESEND_API_KEY not set - email was NOT sent");
        return;
    }
    const { error } = await resend.emails.send({
        from: env_1.env.EMAIL_FROM,
        to,
        subject,
        html,
    });
    if (error) {
        logger_1.logger.error({ error, to, subject }, "Failed to send email via Resend");
        throw new Error("Failed to send email");
    }
}
//# sourceMappingURL=mailer.js.map