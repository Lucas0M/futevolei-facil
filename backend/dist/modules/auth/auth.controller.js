"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHandler = registerHandler;
exports.loginHandler = loginHandler;
exports.forgotPasswordHandler = forgotPasswordHandler;
exports.resetPasswordHandler = resetPasswordHandler;
const authService = __importStar(require("./auth.service"));
const auth_schema_1 = require("./auth.schema");
async function registerHandler(req, res) {
    const input = auth_schema_1.registerSchema.parse(req.body);
    const result = await authService.register(input);
    res.status(201).json(result);
}
async function loginHandler(req, res) {
    const input = auth_schema_1.loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.status(200).json(result);
}
async function forgotPasswordHandler(req, res) {
    const input = auth_schema_1.forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(input);
    // Generic message on purpose - see comment in auth.service.ts.
    res.status(200).json({ message: "Se este e-mail estiver cadastrado, você receberá um link de redefinição." });
}
async function resetPasswordHandler(req, res) {
    const input = auth_schema_1.resetPasswordSchema.parse(req.body);
    await authService.resetPassword(input);
    res.status(200).json({ message: "Senha redefinida com sucesso." });
}
//# sourceMappingURL=auth.controller.js.map