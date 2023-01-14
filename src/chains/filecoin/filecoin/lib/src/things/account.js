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
var _Account_balance;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = void 0;
const utils_1 = require("@ganache/utils");
const address_1 = require("./address");
const balance_1 = require("./balance");
const serializable_object_1 = require("./serializable-object");
class Account extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        _Account_balance.set(this, void 0);
        this.address = super.initializeValue(this.config.address, options);
        __classPrivateFieldSet(this, _Account_balance, super.initializeValue(this.config.balance, options), "f");
        this.nonce = super.initializeValue(this.config.nonce, options);
    }
    get config() {
        return {
            address: {
                deserializedName: "address",
                serializedName: "Address",
                defaultValue: literal => literal ? new address_1.Address(literal) : address_1.Address.random()
            },
            balance: {
                deserializedName: "balance",
                serializedName: "Balance",
                defaultValue: literal => literal ? new balance_1.Balance(literal) : new balance_1.Balance("0")
            },
            nonce: {
                deserializedName: "nonce",
                serializedName: "Nonce",
                defaultValue: 0
            }
        };
    }
    static random(defaultFIL, rng = new utils_1.RandomNumberGenerator(), protocol = address_1.AddressProtocol.BLS, network = address_1.AddressNetwork.Testnet) {
        return new Account({
            address: address_1.Address.random(rng, protocol, network),
            balance: new balance_1.Balance(balance_1.Balance.FILToLowestDenomination(defaultFIL).toString()),
            nonce: 0
        });
    }
    addBalance(val) {
        __classPrivateFieldGet(this, _Account_balance, "f").add(val);
    }
    subtractBalance(val) {
        __classPrivateFieldGet(this, _Account_balance, "f").sub(val);
    }
    get balance() {
        return __classPrivateFieldGet(this, _Account_balance, "f");
    }
}
exports.Account = Account;
_Account_balance = new WeakMap();
//# sourceMappingURL=account.js.map