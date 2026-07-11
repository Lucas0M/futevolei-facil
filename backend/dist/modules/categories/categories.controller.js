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
exports.createCategoryHandler = createCategoryHandler;
exports.updateCategoryHandler = updateCategoryHandler;
exports.cancelCategoryHandler = cancelCategoryHandler;
exports.publishCategoryHandler = publishCategoryHandler;
exports.getCategoryDetailHandler = getCategoryDetailHandler;
exports.exportCategoryRegistrantsHandler = exportCategoryRegistrantsHandler;
exports.generateCategoryBracketHandler = generateCategoryBracketHandler;
exports.generatePersistentBracketHandler = generatePersistentBracketHandler;
exports.updateMatchWinnerHandler = updateMatchWinnerHandler;
const categoriesService = __importStar(require("./categories.service"));
const categoryExportService = __importStar(require("./categoryExport.service"));
const categories_schema_1 = require("./categories.schema");
async function createCategoryHandler(req, res) {
    const input = categories_schema_1.createCategorySchema.parse(req.body);
    const tournamentId = req.params.tournamentId;
    const category = await categoriesService.createCategory(tournamentId, input);
    res.status(201).json(category);
}
async function updateCategoryHandler(req, res) {
    const input = categories_schema_1.updateCategorySchema.parse(req.body);
    const categoryId = req.params.id;
    const category = await categoriesService.updateCategory(categoryId, input);
    res.status(200).json(category);
}
async function cancelCategoryHandler(req, res) {
    const categoryId = req.params.id;
    const category = await categoriesService.deleteCategory(categoryId);
    res.status(200).json(category);
}
async function publishCategoryHandler(req, res) {
    const categoryId = req.params.id;
    const category = await categoriesService.publishCategory(categoryId);
    res.status(200).json(category);
}
async function getCategoryDetailHandler(req, res) {
    const categoryId = req.params.id;
    const category = await categoriesService.getCategoryDetail(categoryId, req.user?.role ?? "PLAYER");
    res.status(200).json(category);
}
async function exportCategoryRegistrantsHandler(req, res) {
    const categoryId = req.params.id;
    const csv = await categoryExportService.exportCategoryRegistrantsCsv(categoryId);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="inscritos-${categoryId}.csv"`);
    res.status(200).send(csv);
}
async function generateCategoryBracketHandler(req, res) {
    const categoryId = req.params.id;
    const bracket = await categoriesService.generateCategoryBracket(categoryId);
    res.status(200).json(bracket);
}
async function generatePersistentBracketHandler(req, res) {
    const categoryId = req.params.id;
    const bracket = await categoriesService.generatePersistentBracket(categoryId);
    res.status(200).json(bracket);
}
async function updateMatchWinnerHandler(req, res) {
    const matchId = req.params.matchId;
    const { winnerId, score } = req.body;
    const match = await categoriesService.updateMatchWinner(matchId, winnerId, score);
    res.status(200).json(match);
}
//# sourceMappingURL=categories.controller.js.map