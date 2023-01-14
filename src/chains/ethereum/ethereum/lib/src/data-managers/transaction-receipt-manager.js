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
var _TransactionReceiptManager_blockchain;
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = __importDefault(require("./manager"));
const utils_1 = require("@ganache/utils");
const ethereum_transaction_1 = require("@ganache/ethereum-transaction");
const ethereum_address_1 = require("@ganache/ethereum-address");
class TransactionReceiptManager extends manager_1.default {
    constructor(base, blockchain) {
        super(base, ethereum_transaction_1.InternalTransactionReceipt);
        _TransactionReceiptManager_blockchain.set(this, void 0);
        __classPrivateFieldSet(this, _TransactionReceiptManager_blockchain, blockchain, "f");
    }
    async get(key) {
        const receipt = await super.get(key);
        if (receipt) {
            return receipt;
        }
        else if (__classPrivateFieldGet(this, _TransactionReceiptManager_blockchain, "f").fallback) {
            const res = await __classPrivateFieldGet(this, _TransactionReceiptManager_blockchain, "f").fallback.request("eth_getTransactionReceipt", [typeof key === "string" ? key : utils_1.Data.from(key)]);
            if (!res)
                return null;
            const status = res.status === "0x1" ? utils_1.Quantity.One.toBuffer() : utils_1.BUFFER_ZERO;
            const cumulativeGasUsed = utils_1.Quantity.toBuffer(res.cumulativeGasUsed);
            const logsBloom = utils_1.Data.toBuffer(res.logsBloom, 256);
            const logs = res.logs.map(log => [
                ethereum_address_1.Address.from(log.address).toBuffer(),
                log.topics.map(topic => utils_1.Data.toBuffer(topic)),
                Array.isArray(log.data)
                    ? log.data.map(data => utils_1.Data.toBuffer(data))
                    : utils_1.Data.toBuffer(log.data)
            ]);
            const gasUsed = utils_1.Quantity.toBuffer(res.gasUsed);
            const contractAddress = res.contractAddress == null
                ? utils_1.BUFFER_EMPTY
                : ethereum_address_1.Address.from(res.contractAddress).toBuffer();
            return ethereum_transaction_1.InternalTransactionReceipt.fromValues(status, cumulativeGasUsed, logsBloom, logs, gasUsed, contractAddress);
        }
    }
}
exports.default = TransactionReceiptManager;
_TransactionReceiptManager_blockchain = new WeakMap();
//# sourceMappingURL=transaction-receipt-manager.js.map