"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Connector_provider;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connector = exports.StorageDealStatus = exports.FilecoinProvider = void 0;
const emittery_1 = __importDefault(require("emittery"));
const utils_1 = require("@ganache/utils");
const provider_1 = require("./provider");
var provider_2 = require("./provider");
Object.defineProperty(exports, "FilecoinProvider", { enumerable: true, get: function () { return provider_2.FilecoinProvider; } });
var storage_deal_status_1 = require("./types/storage-deal-status");
Object.defineProperty(exports, "StorageDealStatus", { enumerable: true, get: function () { return storage_deal_status_1.StorageDealStatus; } });
/**
 * @internal
 */
class Connector extends emittery_1.default {
    constructor(providerOptions = {}, executor) {
        super();
        _Connector_provider.set(this, void 0);
        __classPrivateFieldSet(this, _Connector_provider, new provider_1.FilecoinProvider(providerOptions, executor), "f");
    }
    get provider() {
        return __classPrivateFieldGet(this, _Connector_provider, "f");
    }
    async connect() {
        await __classPrivateFieldGet(this, _Connector_provider, "f").initialize();
        // no need to wait for #provider.once("connect") as the initialize()
        // promise has already accounted for that after the promise is resolved
        await this.emit("ready");
    }
    parse(message) {
        return JSON.parse(message);
    }
    handle(payload, _connection) {
        return __classPrivateFieldGet(this, _Connector_provider, "f")._requestRaw(payload);
    }
    format(result, payload) {
        const json = (0, utils_1.makeResponse)(payload.id, result);
        return JSON.stringify(json);
    }
    formatError(error, payload) {
        const json = (0, utils_1.makeError)(payload && payload.id ? payload.id : undefined, error);
        return JSON.stringify(json);
    }
    async close() {
        return await __classPrivateFieldGet(this, _Connector_provider, "f").stop();
    }
}
exports.Connector = Connector;
_Connector_provider = new WeakMap();
//# sourceMappingURL=connector.js.map