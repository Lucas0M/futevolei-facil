"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// This schema is the single source of truth for what environment variables
// the app expects. If something required is missing, the app fails fast
// at startup instead of crashing later in a random request.
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(3333),
    NODE_ENV: zod_1.z
        .enum(["development", "test", "production"])
        .default("development"),
    DATABASE_URL: zod_1.z.string().min(1, "DATABASE_URL is required"),
    JWT_SECRET: zod_1.z.string().min(1, "JWT_SECRET is required"),
    JWT_EXPIRES_IN: zod_1.z.string().default("7d"),
    RESEND_API_KEY: zod_1.z.string().optional().default(""),
    EMAIL_FROM: zod_1.z.string().default("Futevôlei Torneios <onboarding@resend.dev>"),
    MERCADO_PAGO_ACCESS_TOKEN: zod_1.z.string().optional().default(""),
    MERCADO_PAGO_PUBLIC_KEY: zod_1.z.string().optional().default(""),
    MERCADO_PAGO_WEBHOOK_SECRET: zod_1.z.string().optional().default(""),
    FRONTEND_URL: zod_1.z.string().default("http://localhost:5173"),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    // Printing the flattened errors makes it obvious which variable is missing
    // or invalid, instead of a generic crash stack trace.
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables. Check your .env file against .env.example.");
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map