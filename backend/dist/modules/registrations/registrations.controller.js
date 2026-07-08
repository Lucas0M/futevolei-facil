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
exports.listMyRegistrationsHandler = listMyRegistrationsHandler;
const registrationsService = __importStar(require("./registrations.service"));
const registrations_schema_1 = require("./registrations.schema");
async function createRegistrationHandler(req, res) {
    // partnerName is only required for DUO_FIXED categories; the service
    // decides whether it's needed based on the category's format.
    const parsed = registrations_schema_1.createTeamRegistrationSchema.partial().parse(req.body ?? {});
    const registration = await registrationsService.createRegistration(req.params.categoryId, req.user.id, parsed);
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
    const input = registrations_schema_1.updateTeamPartnerSchema.parse(req.body);
    const team = await registrationsService.updateTeamPartnerName(req.params.id, input);
    res.status(200).json(team);
}
async function listMyRegistrationsHandler(req, res) {
    const result = await registrationsService.listMyRegistrations(req.user.id);
    res.status(200).json(result);
}
//# sourceMappingURL=registrations.controller.js.map