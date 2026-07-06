import { MercadoPagoConfig, Preference } from "mercadopago";
import { env } from "../../config/env";

// Single shared config instance, reused by every feature that needs to
// talk to Mercado Pago (checkout now, webhooks later).
export const mercadoPagoConfig = new MercadoPagoConfig({
  accessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
});

export const preferenceClient = new Preference(mercadoPagoConfig);
