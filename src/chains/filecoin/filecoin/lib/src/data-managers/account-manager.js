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
var _AccountManager_privateKeyManager, _AccountManager_database;
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = __importDefault(require("./manager"));
const account_1 = require("../things/account");
const address_1 = require("../things/address");
class AccountManager extends manager_1.default {
    constructor(base, privateKeyManager, database) {
        super(base, account_1.Account);
        _AccountManager_privateKeyManager.set(this, void 0);
        _AccountManager_database.set(this, void 0);
        // the account manager doesn't handle private keys directly
        // we need to use the private key manager for that
        __classPrivateFieldSet(this, _AccountManager_privateKeyManager, privateKeyManager, "f");
        __classPrivateFieldSet(this, _AccountManager_database, database, "f");
    }
    static async initialize(base, privateKeyManager, database) {
        const manager = new AccountManager(base, privateKeyManager, database);
        return manager;
    }
    // TODO(perf): (Issue ganache#876) There's probably a bit of
    // performance optimizations that could be done here. putAccount
    // is called whenever the account changes (balance, nonce,
    // private key)
    async putAccount(account) {
        await __classPrivateFieldGet(this, _AccountManager_database, "f").batch(() => {
            super.set(account.address.value, account);
            if (account.address.privateKey) {
                __classPrivateFieldGet(this, _AccountManager_privateKeyManager, "f").putPrivateKey(account.address.value, account.address.privateKey);
            }
        });
    }
    async getAccount(address) {
        let account = await super.get(address);
        if (!account) {
            account = new account_1.Account({
                address: new address_1.Address(address)
            });
            await this.putAccount(account);
        }
        const privateKey = await __classPrivateFieldGet(this, _AccountManager_privateKeyManager, "f").getPrivateKey(account.address.value);
        if (privateKey) {
            account.address.setPrivateKey(privateKey);
        }
        return account;
    }
    /**
     * Returns an array of accounts which we have private keys
     * for. The order is the order in which they were stored.
     * To add a controllable account, use `AccountManager.putAccount(account)`
     * where `account.address.privateKey` is set.
     */
    async getControllableAccounts() {
        const addresses = __classPrivateFieldGet(this, _AccountManager_privateKeyManager, "f").addressesWithPrivateKeys;
        const accounts = await Promise.all(addresses.map(async (address) => await this.getAccount(address)));
        return accounts;
    }
    async mintFunds(address, amount) {
        const account = await this.getAccount(address);
        account.addBalance(amount);
        await this.putAccount(account);
    }
    async transferFunds(from, to, amount) {
        const fromAccount = await this.getAccount(from);
        const toAccount = await this.getAccount(to);
        if (fromAccount.balance.value >= amount) {
            fromAccount.subtractBalance(amount);
            toAccount.addBalance(amount);
            await this.putAccount(fromAccount);
            await this.putAccount(toAccount);
            return true;
        }
        else {
            return false;
        }
    }
    async incrementNonce(address) {
        const account = await this.getAccount(address);
        account.nonce++;
        await this.putAccount(account);
    }
}
exports.default = AccountManager;
_AccountManager_privateKeyManager = new WeakMap(), _AccountManager_database = new WeakMap();
//# sourceMappingURL=account-manager.js.map