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
var _BlockLogManager_blockchain;
Object.defineProperty(exports, "__esModule", { value: true });
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const manager_1 = __importDefault(require("./manager"));
const utils_1 = require("@ganache/utils");
const filter_parsing_1 = require("../helpers/filter-parsing");
class BlockLogManager extends manager_1.default {
    constructor(base, blockchain) {
        super(base, ethereum_utils_1.BlockLogs);
        _BlockLogManager_blockchain.set(this, void 0);
        __classPrivateFieldSet(this, _BlockLogManager_blockchain, blockchain, "f");
    }
    async get(key) {
        const log = await super.get(key);
        if (log) {
            log.blockNumber = utils_1.Quantity.from(key);
        }
        else if (__classPrivateFieldGet(this, _BlockLogManager_blockchain, "f").fallback) {
            const block = utils_1.Quantity.from(key);
            const res = await __classPrivateFieldGet(this, _BlockLogManager_blockchain, "f").fallback.request("eth_getLogs", [{ fromBlock: block, toBlock: block }]);
            return ethereum_utils_1.BlockLogs.fromJSON(res);
        }
        return log;
    }
    async getLogs(filter) {
        const blockchain = __classPrivateFieldGet(this, _BlockLogManager_blockchain, "f");
        if ("blockHash" in filter) {
            const { addresses, topics } = (0, filter_parsing_1.parseFilterDetails)(filter);
            const blockNumber = await blockchain.blocks.getNumberFromHash(filter.blockHash);
            if (!blockNumber)
                return [];
            const logs = await this.get(blockNumber);
            return logs ? [...logs.filter(addresses, topics)] : [];
        }
        else {
            const { addresses, topics, fromBlock, toBlockNumber } = (0, filter_parsing_1.parseFilter)(filter, blockchain);
            const pendingLogsPromises = [
                this.get(fromBlock.toBuffer())
            ];
            const fromBlockNumber = fromBlock.toNumber();
            // if we have a range of blocks to search, do that here:
            if (fromBlockNumber !== toBlockNumber) {
                // fetch all the blockLogs in-between `fromBlock` and `toBlock` (excluding
                // from, because we already started fetching that one)
                for (let i = fromBlockNumber + 1, l = toBlockNumber + 1; i < l; i++) {
                    pendingLogsPromises.push(this.get(utils_1.Quantity.toBuffer(i)));
                }
            }
            // now filter and compute all the blocks' blockLogs (in block order)
            return Promise.all(pendingLogsPromises).then(blockLogsRange => {
                const filteredBlockLogs = [];
                blockLogsRange.forEach(blockLogs => {
                    // TODO(perf): this loops over all addresses for every block.
                    // Maybe make it loop only once?
                    // Issue: https://github.com/trufflesuite/ganache/issues/3482
                    if (blockLogs)
                        filteredBlockLogs.push(...blockLogs.filter(addresses, topics));
                });
                return filteredBlockLogs;
            });
        }
    }
}
exports.default = BlockLogManager;
_BlockLogManager_blockchain = new WeakMap();
//# sourceMappingURL=blocklog-manager.js.map