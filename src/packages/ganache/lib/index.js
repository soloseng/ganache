"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__experimental_info = exports.provider = exports.server = void 0;
// polyfill "setImmediate" for the browser
// this is removed by webpack for our Node.js build
require("setimmediate");
var core_1 = require("@ganache/core");
Object.defineProperty(exports, "server", { enumerable: true, get: function () { return core_1.server; } });
Object.defineProperty(exports, "provider", { enumerable: true, get: function () { return core_1.provider; } });
/**
 * @experimental
 */
Object.defineProperty(exports, "__experimental_info", { enumerable: true, get: function () { return core_1.__experimental_info; } });
const core_2 = __importDefault(require("@ganache/core"));
exports.default = core_2.default;
//# sourceMappingURL=index.js.map