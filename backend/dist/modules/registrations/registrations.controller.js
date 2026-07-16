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
exports.createRegistrationHandler = createRegistrationHandler;
exports.cancelOwnRegistrationHandler = cancelOwnRegistrationHandler;
exports.cancelOwnTeamHandler = cancelOwnTeamHandler;
exports.adminCancelRegistrationHandler = adminCancelRegistrationHandler;
exports.adminCancelTeamHandler = adminCancelTeamHandler;
exports.updateTeamPartnerHandler = updateTeamPartnerHandler;
exports.adminUpdateRegistrationHandler = adminUpdateRegistrationHandler;
exports.listMyRegistrationsHandler = listMyRegistrationsHandler;
const registrationsService = __importStar(require("./registrations.service"));
const registrations_schema_1 = require("./registrations.schema");
async function createRegistrationHandler(req, res) {
    const isDuo = req.body?.partnerName !== undefined;
    const parsed = isDuo
        ? registrations_schema_1.createTeamRegistrationSchema.parse(req.body)
        : registrations_schema_1.createIndividualRegistrationSchema.parse(req.body ?? {});
    const registration = await registrationsService.createRegistration(req.params.categoryId, req.user.id, req.user.role, parsed);
    res.status(201).json(registration);
}
async function cancelOwnRegistrationHandler(req, res) {
    const registration = await registrationsService.cancelOwnRegistration(req.params.id, req.user.id);
    res.status(200).json(registration);
}
async function cancelOwnTeamHandler(req, res) {
    const team = await registrationsService.cancelOwnTeam(req.params.id, req.user.id);
    res.status(200).json(team);
}
async function adminCancelRegistrationHandler(req, res) {
    const registration = await registrationsService.adminCancelRegistration(req.params.id);
    res.status(200).json(registration);
}
async function adminCancelTeamHandler(req, res) {
    const team = await registrationsService.adminCancelTeam(req.params.id);
    res.status(200).json(team);
}
async function updateTeamPartnerHandler(req, res) {
    const { partnerName, customOwnerName } = req.body;
    const team = await registrationsService.updateTeamPartnerName(req.params.id, { partnerName, customOwnerName });
    res.status(200).json(team);
}
async function adminUpdateRegistrationHandler(req, res) {
    const { customPlayerName } = req.body;
    const registration = await registrationsService.updateRegistrationPlayerName(req.params.id, { customPlayerName });
    res.status(200).json(registration);
}
async function listMyRegistrationsHandler(req, res) {
    const result = await registrationsService.listMyRegistrations(req.user.id);
    res.status(200).json(result);
}
//# sourceMappingURL=registrations.controller.js.map