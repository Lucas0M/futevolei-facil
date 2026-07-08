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
const categoriesService = __importStar(require("./categories.service"));
const categoryExportService = __importStar(require("./categoryExport.service"));
const categories_schema_1 = require("./categories.schema");
async function createCategoryHandler(req, res) {
    const input = categories_schema_1.createCategorySchema.parse(req.body);
    const category = await categoriesService.createCategory(req.params.tournamentId, input);
    res.status(201).json(category);
}
async function updateCategoryHandler(req, res) {
    const input = categories_schema_1.updateCategorySchema.parse(req.body);
    const category = await categoriesService.updateCategory(req.params.id, input);
    res.status(200).json(category);
}
async function cancelCategoryHandler(req, res) {
    const category = await categoriesService.cancelCategory(req.params.id);
    res.status(200).json(category);
}
async function publishCategoryHandler(req, res) {
    const category = await categoriesService.publishCategory(req.params.id);
    res.status(200).json(category);
}
async function getCategoryDetailHandler(req, res) {
    const category = await categoriesService.getCategoryDetail(req.params.id, req.user?.role ?? "PLAYER");
    res.status(200).json(category);
}
async function exportCategoryRegistrantsHandler(req, res) {
    const csv = await categoryExportService.exportCategoryRegistrantsCsv(req.params.id);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="inscritos-${req.params.id}.csv"`);
    res.status(200).send(csv);
}
async function generateCategoryBracketHandler(req, res) {
    const bracket = await categoriesService.generateCategoryBracket(req.params.id);
    res.status(200).json(bracket);
}
//# sourceMappingURL=categories.controller.js.map