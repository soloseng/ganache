"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _TezosConnector_api;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TezosConnector = exports.TezosProvider = void 0;
const emittery_1 = __importDefault(require("emittery"));
const provider_1 = __importDefault(require("./src/provider"));
const api_1 = __importDefault(require("./src/api"));
exports.TezosProvider = provider_1.default;
class TezosConnector extends emittery_1.default {
    constructor(providerOptions, requestCoordinator) {
        super();
        _TezosConnector_api.set(this, void 0);
        const api = (__classPrivateFieldSet(this, _TezosConnector_api, new api_1.default(), "f"));
        this.provider = new provider_1.default(providerOptions);
    }
    async connect() { }
    format(result) {
        return JSON.stringify(result);
    }
    formatError(error) {
        return JSON.stringify(error);
    }
    parse(message) {
        return JSON.parse(message);
    }
    handle(payload, _connection) {
        return Promise.resolve(123);
    }
    close() {
        return {};
    }
}
exports.TezosConnector = TezosConnector;
_TezosConnector_api = new WeakMap();
//# sourceMappingURL=index.js.map