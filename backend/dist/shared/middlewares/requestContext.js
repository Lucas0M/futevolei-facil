"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestContextMiddleware = requestContextMiddleware;
const requestContext_1 = require("../utils/requestContext");
function requestContextMiddleware(req, _res, next) {
    // Capture client IP address (supporting proxy headers)
    const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
        req.ip ||
        req.socket.remoteAddress ||
        undefined;
    const userAgent = req.headers["user-agent"];
    const context = {
        ip,
        userAgent,
    };
    // Bind the context to the Request object as well for easy mutation
    req.context = context;
    requestContext_1.requestContextStorage.run(context, () => {
        next();
    });
}
//# sourceMappingURL=requestContext.js.map