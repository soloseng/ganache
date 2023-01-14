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
var _Manager_Type, _Manager_options;
Object.defineProperty(exports, "__esModule", { value: true });
const NOTFOUND = 404;
class Manager {
    constructor(base, type, options) {
        _Manager_Type.set(this, void 0);
        _Manager_options.set(this, void 0);
        __classPrivateFieldSet(this, _Manager_Type, type, "f");
        __classPrivateFieldSet(this, _Manager_options, options, "f");
        this.base = base;
    }
    async getRaw(key) {
        if (typeof key === "string" || typeof key === "number") {
            key = Buffer.from(`${key}`);
        }
        if (key.length === 0) {
            return null;
        }
        return this.base.get(key).catch(e => {
            if (e.status === NOTFOUND)
                return null;
            throw e;
        });
    }
    async get(key) {
        const raw = await this.getRaw(key);
        if (!raw)
            return null;
        return new (__classPrivateFieldGet(this, _Manager_Type, "f"))(JSON.parse(raw.toString()), __classPrivateFieldGet(this, _Manager_options, "f"));
    }
    async setRaw(key, value) {
        if (typeof key === "string" || typeof key === "number") {
            key = Buffer.from(`${key}`);
        }
        if (key.length === 0) {
            return;
        }
        return await this.base.put(key, value);
    }
    async set(key, value) {
        return await this.setRaw(key, Buffer.from(JSON.stringify(value.serialize())));
    }
    del(key) {
        return this.base.del(key);
    }
}
exports.default = Manager;
_Manager_Type = new WeakMap(), _Manager_options = new WeakMap();
//# sourceMappingURL=manager.js.map