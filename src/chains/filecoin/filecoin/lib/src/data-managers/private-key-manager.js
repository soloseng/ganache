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
var _PrivateKeyManager_addressesWithPrivateKeys;
Object.defineProperty(exports, "__esModule", { value: true });
const NOTFOUND = 404;
class PrivateKeyManager {
    constructor(base, addressesWithPrivateKeys) {
        _PrivateKeyManager_addressesWithPrivateKeys.set(this, void 0);
        this.base = base;
        __classPrivateFieldSet(this, _PrivateKeyManager_addressesWithPrivateKeys, addressesWithPrivateKeys, "f");
    }
    get addressesWithPrivateKeys() {
        return __classPrivateFieldGet(this, _PrivateKeyManager_addressesWithPrivateKeys, "f");
    }
    static async initialize(base) {
        let addressesWithPrivateKeys;
        try {
            const result = await base.get(PrivateKeyManager.AccountsWithPrivateKeysKey);
            addressesWithPrivateKeys = JSON.parse(result.toString());
        }
        catch (e) {
            if (e.status === NOTFOUND) {
                // if the array doesn't exist yet, initialize it
                addressesWithPrivateKeys = [];
                await base.put(PrivateKeyManager.AccountsWithPrivateKeysKey, Buffer.from(JSON.stringify(addressesWithPrivateKeys)));
            }
            else {
                throw e;
            }
        }
        const manager = new PrivateKeyManager(base, addressesWithPrivateKeys);
        return manager;
    }
    async getPrivateKey(address) {
        address = address.toLowerCase();
        try {
            const privateKey = await this.base.get(Buffer.from(address));
            return privateKey.toString("hex");
        }
        catch (e) {
            if (e.status === NOTFOUND) {
                return null;
            }
            throw e;
        }
    }
    /**
     * NOTE: This function should only be called from
     * `AccountManager.putAccount` to ensure fields are written
     * atomically. Only call this function if you know what you're doing.
     */
    putPrivateKey(address, privateKey) {
        address = address.toLowerCase();
        this.base.put(Buffer.from(address), Buffer.from(privateKey, "hex"));
        if (!__classPrivateFieldGet(this, _PrivateKeyManager_addressesWithPrivateKeys, "f").includes(address)) {
            __classPrivateFieldGet(this, _PrivateKeyManager_addressesWithPrivateKeys, "f").push(address);
            // TODO(perf): (Issue ganache#875) If the number of private
            // keys becomes very large (a highly unlikely event), this would
            // kill performance whenever accounts were created
            this.base.put(PrivateKeyManager.AccountsWithPrivateKeysKey, Buffer.from(JSON.stringify(__classPrivateFieldGet(this, _PrivateKeyManager_addressesWithPrivateKeys, "f"))));
        }
    }
    async hasPrivateKey(address) {
        address = address.toLowerCase();
        return __classPrivateFieldGet(this, _PrivateKeyManager_addressesWithPrivateKeys, "f").includes(address);
    }
    async deletePrivateKey(address) {
        address = address.toLowerCase();
        if (__classPrivateFieldGet(this, _PrivateKeyManager_addressesWithPrivateKeys, "f").includes(address)) {
            __classPrivateFieldSet(this, _PrivateKeyManager_addressesWithPrivateKeys, __classPrivateFieldGet(this, _PrivateKeyManager_addressesWithPrivateKeys, "f").filter(a => a !== address), "f");
            this.base.del(Buffer.from(address));
            // TODO(perf): (Issue ganache#875) If the number of private
            // keys becomes very large (a highly unlikely event), this would
            // kill performance whenever accounts were created
            await this.base.put(PrivateKeyManager.AccountsWithPrivateKeysKey, Buffer.from(JSON.stringify(__classPrivateFieldGet(this, _PrivateKeyManager_addressesWithPrivateKeys, "f"))));
        }
    }
    async setDefault(address) {
        address = address.toLowerCase();
        if (await this.hasPrivateKey(address)) {
            __classPrivateFieldSet(this, _PrivateKeyManager_addressesWithPrivateKeys, __classPrivateFieldGet(this, _PrivateKeyManager_addressesWithPrivateKeys, "f").filter(a => a !== address), "f");
            __classPrivateFieldGet(this, _PrivateKeyManager_addressesWithPrivateKeys, "f").unshift(address);
            // TODO(perf): (Issue ganache#875) If the number of private
            // keys becomes very large (a highly unlikely event), this would
            // kill performance whenever accounts were created
            await this.base.put(PrivateKeyManager.AccountsWithPrivateKeysKey, Buffer.from(JSON.stringify(__classPrivateFieldGet(this, _PrivateKeyManager_addressesWithPrivateKeys, "f"))));
        }
        else {
            throw new Error(`Cannot set ${address} as the default address as it's not part of the wallet.`);
        }
    }
}
exports.default = PrivateKeyManager;
_PrivateKeyManager_addressesWithPrivateKeys = new WeakMap();
PrivateKeyManager.AccountsWithPrivateKeysKey = Buffer.from("accounts-with-private-keys");
//# sourceMappingURL=private-key-manager.js.map