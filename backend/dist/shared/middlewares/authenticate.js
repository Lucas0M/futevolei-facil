"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jwt_1 = require("../utils/jwt");
const AppError_1 = require("../errors/AppError");
// Augments Express's Request type so `req.user` is typed everywhere
// instead of using `any`. See src/types/express/index.d.ts.
function authenticate(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError_1.AppError("Você precisa estar autenticado.", 401, "UNAUTHENTICATED");
    }
    const token = authHeader.replace("Bearer ", "");
    let payload;
    try {
        payload = (0, jwt_1.verifyToken)(token);
    }
    catch {
        throw new AppError_1.AppError("Sessão inválida ou expirada. Faça login novamente.", 401, "INVALID_TOKEN");
    }
    req.user = { id: payload.sub, role: payload.role };
    next();
}
//# sourceMappingURL=authenticate.js.map