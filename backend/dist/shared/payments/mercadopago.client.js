"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preferenceClient = exports.mercadoPagoConfig = void 0;
const mercadopago_1 = require("mercadopago");
const env_1 = require("../../config/env");
// Single shared config instance, reused by every feature that needs to
// talk to Mercado Pago (checkout now, webhooks later).
exports.mercadoPagoConfig = new mercadopago_1.MercadoPagoConfig({
    accessToken: env_1.env.MERCADO_PAGO_ACCESS_TOKEN,
});
exports.preferenceClient = new mercadopago_1.Preference(exports.mercadoPagoConfig);
//# sourceMappingURL=mercadopago.client.js.map