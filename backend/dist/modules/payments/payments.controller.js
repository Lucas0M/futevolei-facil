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
exports.confirmRegistrationPaymentHandler = confirmRegistrationPaymentHandler;
exports.confirmTeamPaymentHandler = confirmTeamPaymentHandler;
exports.listMyPaymentsHandler = listMyPaymentsHandler;
exports.checkoutRegistrationHandler = checkoutRegistrationHandler;
exports.checkoutTeamHandler = checkoutTeamHandler;
const paymentsService = __importStar(require("./payments.service"));
const checkoutService = __importStar(require("./checkout.service"));
const payments_schema_1 = require("./payments.schema");
async function confirmRegistrationPaymentHandler(req, res) {
    const registration = await paymentsService.confirmRegistrationPayment(req.params.id, req.user.id);
    res.status(200).json(registration);
}
async function confirmTeamPaymentHandler(req, res) {
    const input = payments_schema_1.confirmTeamPaymentSchema.parse(req.body);
    const team = await paymentsService.confirmTeamPayment(req.params.id, input, req.user.id);
    res.status(200).json(team);
}
async function listMyPaymentsHandler(req, res) {
    const payments = await paymentsService.listMyPayments(req.user.id);
    res.status(200).json(payments);
}
async function checkoutRegistrationHandler(req, res) {
    const result = await checkoutService.createRegistrationCheckout(req.params.id, req.user.id);
    res.status(200).json(result);
}
async function checkoutTeamHandler(req, res) {
    const input = payments_schema_1.checkoutTeamSchema.parse(req.body);
    const result = await checkoutService.createTeamCheckout(req.params.id, req.user.id, input.portion);
    res.status(200).json(result);
}
//# sourceMappingURL=payments.controller.js.map