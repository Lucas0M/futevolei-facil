"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutTeamSchema = exports.confirmTeamPaymentSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.confirmTeamPaymentSchema = zod_1.z.object({
    portion: zod_1.z.nativeEnum(client_1.TeamPaymentPortion),
});
// Same shape - the player also needs to choose which portion they're paying
// when starting a Mercado Pago checkout for a DUO_FIXED team.
exports.checkoutTeamSchema = zod_1.z.object({
    portion: zod_1.z.nativeEnum(client_1.TeamPaymentPortion),
});
//# sourceMappingURL=payments.schema.js.map