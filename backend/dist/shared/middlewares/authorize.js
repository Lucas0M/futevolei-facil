"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const AppError_1 = require("../errors/AppError");
// Usage: router.post("/tournaments", authenticate, authorize("ADMIN"), handler)
// Must always run AFTER `authenticate`, since it relies on req.user.
function authorize(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) {
            throw new AppError_1.AppError("Você precisa estar autenticado.", 401, "UNAUTHENTICATED");
        }
        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError_1.AppError("Você não tem permissão para realizar esta ação.", 403, "FORBIDDEN");
        }
        next();
    };
}
//# sourceMappingURL=authorize.js.map