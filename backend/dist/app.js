"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./shared/middlewares/errorHandler");
const auth_routes_1 = require("./modules/auth/auth.routes");
const users_routes_1 = require("./modules/users/users.routes");
const tournaments_routes_1 = require("./modules/tournaments/tournaments.routes");
const categories_routes_1 = require("./modules/categories/categories.routes");
const categoryRegistrations_routes_1 = require("./modules/registrations/categoryRegistrations.routes");
const registrations_routes_1 = require("./modules/registrations/registrations.routes");
const teams_routes_1 = require("./modules/registrations/teams.routes");
const payments_routes_1 = require("./modules/payments/payments.routes");
const dashboard_routes_1 = require("./modules/dashboard/dashboard.routes");
const rankings_routes_1 = require("./modules/rankings/rankings.routes");
const players_routes_1 = require("./modules/players/players.routes");
function createApp() {
    const app = (0, express_1.default)();
    const allowedOrigins = [env_1.env.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"];
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || env_1.env.NODE_ENV === "development") {
                callback(null, true);
            }
            else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: "10mb" }));
    app.get("/health", (_req, res) => {
        res.json({ status: "ok" });
    });
    app.use("/api/auth", auth_routes_1.authRoutes);
    app.use("/api/users", users_routes_1.usersRoutes);
    app.use("/api/tournaments", tournaments_routes_1.tournamentsRoutes);
    app.use("/api/tournaments", categories_routes_1.tournamentCategoriesRoutes);
    app.use("/api/categories", categories_routes_1.categoriesRoutes);
    app.use("/api/categories", categoryRegistrations_routes_1.categoryRegistrationsRoutes);
    app.use("/api/registrations", registrations_routes_1.registrationsRoutes);
    app.use("/api/teams", teams_routes_1.teamsRoutes);
    app.use("/api/payments", payments_routes_1.paymentsRoutes);
    app.use("/api/admin/dashboard", dashboard_routes_1.dashboardRoutes);
    app.use("/api/rankings", rankings_routes_1.rankingsRoutes);
    app.use("/api/players", players_routes_1.playersRoutes);
    // Error handler must always be the LAST middleware registered.
    app.use(errorHandler_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map