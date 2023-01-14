"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _InternalTransactionReceipt_init;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalTransactionReceipt = void 0;
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const rlp_1 = require("@ganache/rlp");
const utils_1 = require("@ganache/utils");
const STATUSES = [utils_1.Quantity.Zero, utils_1.Quantity.One];
class InternalTransactionReceipt {
    constructor(data) {
        _InternalTransactionReceipt_init.set(this, (status, cumulativeGasUsed, logsBloom, logs, gasUsed, contractAddress = null, type = null) => {
            this.raw = [status, cumulativeGasUsed, logsBloom, logs];
            this.contractAddress = contractAddress;
            this.gasUsed = gasUsed;
            this.txType = type;
        });
        if (data) {
            const decoded = (0, rlp_1.decode)(data);
            __classPrivateFieldGet(this, _InternalTransactionReceipt_init, "f").call(this, decoded[0], decoded[1], decoded[2], decoded[3], decoded[4], decoded[5]);
        }
    }
    static fromValues(status, cumulativeGasUsed, logsBloom, logs, gasUsed, contractAddress, type = null) {
        const receipt = new InternalTransactionReceipt();
        __classPrivateFieldGet(receipt, _InternalTransactionReceipt_init, "f").call(receipt, status, cumulativeGasUsed, logsBloom, logs, gasUsed, contractAddress, type);
        return receipt;
    }
    serialize(all) {
        if (this.encoded == null) {
            this.encoded = (0, rlp_1.encodeRange)(this.raw, 0, 4);
        }
        if (all) {
            // the database format includes gasUsed and the contractAddress:
            const extras = [
                this.gasUsed,
                this.contractAddress
            ];
            const epilogue = (0, rlp_1.encodeRange)(extras, 0, 2);
            return (0, rlp_1.digest)([this.encoded.output, epilogue.output], this.encoded.length + epilogue.length);
        }
        else {
            // receipt trie format:
            const serialized = (0, rlp_1.digest)([this.encoded.output], this.encoded.length);
            return this.txType
                ? Buffer.concat([this.txType.toBuffer(), serialized])
                : serialized;
        }
    }
    toJSON(block, transaction, common) {
        const raw = this.raw;
        const contractAddress = this.contractAddress.length === 0
            ? null
            : utils_1.Data.from(this.contractAddress);
        const blockHash = block.hash();
        const blockNumber = block.header.number;
        const blockLog = ethereum_utils_1.BlockLogs.create(blockHash);
        const transactionHash = transaction.hash;
        const transactionIndex = transaction.index;
        blockLog.blockNumber = blockNumber;
        raw[3].forEach(l => blockLog.append(transactionIndex, transactionHash, l));
        const logs = [...blockLog.toJSON()];
        if (block.header.baseFeePerGas) {
            transaction.updateEffectiveGasPrice(block.header.baseFeePerGas);
        }
        const json = {
            transactionHash,
            transactionIndex,
            blockNumber,
            blockHash,
            from: transaction.from,
            to: contractAddress ? null : transaction.to,
            cumulativeGasUsed: utils_1.Quantity.from(raw[1]),
            gasUsed: utils_1.Quantity.from(this.gasUsed),
            contractAddress,
            logs,
            logsBloom: utils_1.Data.from(raw[2], 256),
            status: STATUSES[raw[0][0]],
            effectiveGasPrice: transaction.effectiveGasPrice
        };
        if (transaction.type && common.isActivatedEIP(2718)) {
            json.type = transaction.type;
        }
        return json;
    }
}
exports.InternalTransactionReceipt = InternalTransactionReceipt;
_InternalTransactionReceipt_init = new WeakMap();
//# sourceMappingURL=transaction-receipt.js.map