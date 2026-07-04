import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// This schema is the single source of truth for what environment variables
// the app expects. If something required is missing, the app fails fast
// at startup instead of crashing later in a random request.
const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("Futevôlei Torneios <onboarding@resend.dev>"),

  MERCADO_PAGO_ACCESS_TOKEN: z.string().optional().default(""),
  MERCADO_PAGO_PUBLIC_KEY: z.string().optional().default(""),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().optional().default(""),

  FRONTEND_URL: z.string().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Printing the flattened errors makes it obvious which variable is missing
  // or invalid, instead of a generic crash stack trace.
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error(
    "Invalid environment variables. Check your .env file against .env.example.",
  );
}

export const env = parsed.data;
