"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
// Express 4 does not automatically catch rejected promises thrown inside
// async route handlers - without this wrapper, an error inside an `async`
// controller would crash the process instead of being caught by errorHandler.
function asyncHandler(handler) {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=asyncHandler.js.map