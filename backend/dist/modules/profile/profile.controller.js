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
exports.getProfileHandler = getProfileHandler;
exports.updateProfileHandler = updateProfileHandler;
exports.updatePasswordHandler = updatePasswordHandler;
const profileService = __importStar(require("./profile.service"));
const profile_schema_1 = require("./profile.schema");
async function getProfileHandler(req, res) {
    const user = await profileService.getProfile(req.user.id);
    res.status(200).json(user);
}
async function updateProfileHandler(req, res) {
    const data = profile_schema_1.updateProfileSchema.parse(req.body);
    const user = await profileService.updateProfile(req.user.id, data);
    res.status(200).json(user);
}
async function updatePasswordHandler(req, res) {
    const data = profile_schema_1.updatePasswordSchema.parse(req.body);
    await profileService.updatePassword(req.user.id, data);
    res.status(204).end();
}
//# sourceMappingURL=profile.controller.js.map