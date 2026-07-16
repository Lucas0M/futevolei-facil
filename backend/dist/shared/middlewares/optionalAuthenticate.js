"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = optionalAuthenticate;
const jwt_1 = require("../utils/jwt");
// Used on public routes that still want to know WHO is asking (e.g. to hide
// admin-only DRAFT tournaments), without requiring login to view them at all.
// Unlike `authenticate`, this never throws - an invalid/missing token just
// means the request continues as an anonymous visitor.
function optionalAuthenticate(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "");
        try {
            const payload = (0, jwt_1.verifyToken)(token);
            req.user = { id: payload.sub, role: payload.role };
        }
        catch {
            // Invalid/expired token on a public route: ignore and treat as anonymous.
        }
    }
    next();
}
//# sourceMappingURL=optionalAuthenticate.js.map