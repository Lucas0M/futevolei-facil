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
exports.createTournamentHandler = createTournamentHandler;
exports.updateTournamentHandler = updateTournamentHandler;
exports.cancelTournamentHandler = cancelTournamentHandler;
exports.publishTournamentHandler = publishTournamentHandler;
exports.listTournamentsHandler = listTournamentsHandler;
exports.getTournamentDetailHandler = getTournamentDetailHandler;
const tournamentsService = __importStar(require("./tournaments.service"));
const tournaments_schema_1 = require("./tournaments.schema");
async function createTournamentHandler(req, res) {
    const input = tournaments_schema_1.createTournamentSchema.parse(req.body);
    const tournament = await tournamentsService.createTournament(req.user.id, input);
    res.status(201).json(tournament);
}
async function updateTournamentHandler(req, res) {
    const input = tournaments_schema_1.updateTournamentSchema.parse(req.body);
    const tournament = await tournamentsService.updateTournament(req.params.id, input);
    res.status(200).json(tournament);
}
async function cancelTournamentHandler(req, res) {
    const tournament = await tournamentsService.cancelTournament(req.params.id);
    res.status(200).json(tournament);
}
async function publishTournamentHandler(req, res) {
    const tournament = await tournamentsService.publishTournament(req.params.id);
    res.status(200).json(tournament);
}
async function listTournamentsHandler(req, res) {
    const query = tournaments_schema_1.listTournamentsQuerySchema.parse(req.query);
    const result = await tournamentsService.listTournaments({ ...query, requesterRole: req.user?.role ?? "PLAYER" });
    res.status(200).json(result);
}
async function getTournamentDetailHandler(req, res) {
    const tournament = await tournamentsService.getTournamentDetail(req.params.id, req.user?.role ?? "PLAYER");
    res.status(200).json(tournament);
}
//# sourceMappingURL=tournaments.controller.js.map