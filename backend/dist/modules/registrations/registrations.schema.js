"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeamPartnerSchema = exports.createTeamRegistrationSchema = exports.createIndividualRegistrationSchema = void 0;
const zod_1 = require("zod");
// Used for INDIVIDUAL and DUO_RANDOM tournaments - no extra data needed,
// the player just registers themself.
exports.createIndividualRegistrationSchema = zod_1.z.object({
    customPlayerName: zod_1.z.string().min(2, "Nome deve ter pelo menos 2 caracteres.").optional(),
});
// Used for DUO_FIXED tournaments - the owner (logged-in user) registers
// themself + a partner identified only by name (no account needed).
exports.createTeamRegistrationSchema = zod_1.z.object({
    partnerName: zod_1.z.string().min(2, "Nome do parceiro deve ter pelo menos 2 caracteres."),
    customOwnerName: zod_1.z.string().min(2, "Nome deve ter pelo menos 2 caracteres.").optional(),
});
exports.updateTeamPartnerSchema = zod_1.z.object({
    partnerName: zod_1.z.string().min(2, "Nome do parceiro deve ter pelo menos 2 caracteres."),
});
//# sourceMappingURL=registrations.schema.js.map