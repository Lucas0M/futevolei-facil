"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const env_1 = require("./env");
// In development we use pino-pretty for human-readable colored logs.
// In production, logs are plain JSON so they can be collected by any
// log aggregation tool (Datadog, CloudWatch, etc.) without extra parsing.
exports.logger = (0, pino_1.default)({
    level: env_1.env.NODE_ENV === "production" ? "info" : "debug",
    transport: env_1.env.NODE_ENV === "production"
        ? undefined
        : {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
            },
        },
});
//# sourceMappingURL=logger.js.map