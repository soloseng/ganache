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
var _BlockManager_blockchain, _BlockManager_common, _BlockManager_blockIndexes;
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = __importDefault(require("./manager"));
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const utils_1 = require("@ganache/utils");
const ethereum_block_1 = require("@ganache/ethereum-block");
const ethereum_address_1 = require("@ganache/ethereum-address");
const ethereum_transaction_1 = require("@ganache/ethereum-transaction");
const LATEST_INDEX_KEY = utils_1.BUFFER_ZERO;
const NOTFOUND = 404;
const EMPTY_BUFFER = Buffer.from([]);
class BlockManager extends manager_1.default {
    constructor(blockchain, common, blockIndexes, base) {
        super(base, ethereum_block_1.Block, common);
        _BlockManager_blockchain.set(this, void 0);
        _BlockManager_common.set(this, void 0);
        _BlockManager_blockIndexes.set(this, void 0);
        this.fromFallback = async (tagOrBlockNumber) => {
            const fallback = __classPrivateFieldGet(this, _BlockManager_blockchain, "f").fallback;
            let blockNumber;
            if (typeof tagOrBlockNumber === "string") {
                blockNumber = tagOrBlockNumber;
            }
            else if (!fallback.isValidForkBlockNumber(tagOrBlockNumber)) {
                // don't get the block if the requested block is _after_ our fallback's
                // blocknumber because it doesn't exist in our local chain.
                return null;
            }
            else {
                blockNumber = tagOrBlockNumber.toString();
            }
            const json = await fallback.request("eth_getBlockByNumber", [
                blockNumber,
                true
            ]);
            if (json == null) {
                return null;
            }
            else {
                const common = fallback.getCommonForBlockNumber(__classPrivateFieldGet(this, _BlockManager_common, "f"), BigInt(json.number));
                return BlockManager.rawFromJSON(json, common);
            }
        };
        __classPrivateFieldSet(this, _BlockManager_blockchain, blockchain, "f");
        __classPrivateFieldSet(this, _BlockManager_common, common, "f");
        __classPrivateFieldSet(this, _BlockManager_blockIndexes, blockIndexes, "f");
    }
    static async initialize(blockchain, common, blockIndexes, base) {
        const bm = new BlockManager(blockchain, common, blockIndexes, base);
        await bm.updateTaggedBlocks();
        return bm;
    }
    static rawFromJSON(json, common) {
        const header = [
            utils_1.Data.toBuffer(json.parentHash),
            utils_1.Data.toBuffer(json.sha3Uncles),
            ethereum_address_1.Address.from(json.miner).toBuffer(),
            utils_1.Data.toBuffer(json.stateRoot),
            utils_1.Data.toBuffer(json.transactionsRoot),
            utils_1.Data.toBuffer(json.receiptsRoot),
            utils_1.Data.toBuffer(json.logsBloom),
            utils_1.Quantity.toBuffer(json.difficulty),
            utils_1.Quantity.toBuffer(json.number),
            utils_1.Quantity.toBuffer(json.gasLimit),
            utils_1.Quantity.toBuffer(json.gasUsed),
            utils_1.Quantity.toBuffer(json.timestamp),
            utils_1.Data.toBuffer(json.extraData),
            utils_1.Data.toBuffer(json.mixHash),
            utils_1.Data.toBuffer(json.nonce)
        ];
        // only add baseFeePerGas if the block's JSON already has it
        if (json.baseFeePerGas !== undefined) {
            header[15] = utils_1.Data.toBuffer(json.baseFeePerGas);
        }
        const totalDifficulty = utils_1.Quantity.toBuffer(json.totalDifficulty);
        const txs = [];
        const extraTxs = [];
        json.transactions.forEach((tx, index) => {
            const blockExtra = [
                ethereum_address_1.Address.toBuffer(tx.from),
                utils_1.Quantity.toBuffer(tx.hash)
            ];
            const txExtra = [
                ...blockExtra,
                utils_1.Data.toBuffer(json.hash),
                utils_1.Quantity.toBuffer(json.number),
                index
            ];
            const typedTx = ethereum_transaction_1.TransactionFactory.fromRpc(tx, common, txExtra);
            const raw = typedTx.toEthRawTransaction(typedTx.v.toBuffer(), typedTx.r.toBuffer(), typedTx.s.toBuffer());
            txs.push(raw);
            extraTxs.push(blockExtra);
        });
        return (0, ethereum_block_1.serialize)([header, txs, [], totalDifficulty, extraTxs]).serialized;
    }
    getBlockByTag(tag) {
        switch (tag) {
            case "latest":
            case "finalized":
            case "safe":
                return this.latest;
            case "pending":
                // TODO: build a real pending block!
                return this.latest; // this.createBlock(this.latest.header);
            case "earliest":
                return this.earliest;
            default:
                // the key is probably a hex string, let nature takes its course.
                break;
        }
    }
    getEffectiveNumber(tagOrBlockNumber = typeof ethereum_utils_1.Tag.latest) {
        if (typeof tagOrBlockNumber === "string") {
            const block = this.getBlockByTag(tagOrBlockNumber);
            if (block) {
                return block.header.number;
            }
        }
        return utils_1.Quantity.from(tagOrBlockNumber);
    }
    async getNumberFromHash(hash) {
        return __classPrivateFieldGet(this, _BlockManager_blockIndexes, "f").get(utils_1.Data.toBuffer(hash)).catch(e => {
            if (e.status === NOTFOUND)
                return null;
            throw e;
        });
    }
    async getByHash(hash) {
        const number = await this.getNumberFromHash(hash);
        if (number === null) {
            const fallback = __classPrivateFieldGet(this, _BlockManager_blockchain, "f").fallback;
            if (fallback) {
                const json = await fallback.request("eth_getBlockByHash", [
                    utils_1.Data.from(hash),
                    true
                ]);
                if (json) {
                    const blockNumber = BigInt(json.number);
                    if (blockNumber <= fallback.blockNumber.toBigInt()) {
                        const common = fallback.getCommonForBlockNumber(__classPrivateFieldGet(this, _BlockManager_common, "f"), blockNumber);
                        return new ethereum_block_1.Block(BlockManager.rawFromJSON(json, common), common);
                    }
                }
            }
            return null;
        }
        else {
            return this.get(number);
        }
    }
    async getRawByBlockNumber(blockNumber) {
        // TODO(perf): make the block's raw fields accessible on latest/earliest/pending so
        // we don't have to fetch them from the db each time a block tag is used.
        // Issue: https://github.com/trufflesuite/ganache/issues/3481
        const fallback = __classPrivateFieldGet(this, _BlockManager_blockchain, "f").fallback;
        const numBuf = blockNumber.toBuffer();
        return this.getRaw(numBuf).then(block => {
            if (block == null && fallback) {
                return this.fromFallback(blockNumber);
            }
            return block;
        });
    }
    async get(tagOrBlockNumber) {
        if (typeof tagOrBlockNumber === "string") {
            const block = this.getBlockByTag(tagOrBlockNumber);
            if (block)
                return block;
        }
        const blockNumber = utils_1.Quantity.from(tagOrBlockNumber);
        const block = await this.getRaw(blockNumber.toBuffer());
        const common = __classPrivateFieldGet(this, _BlockManager_common, "f");
        if (block)
            return new ethereum_block_1.Block(block, common);
        else {
            const fallback = __classPrivateFieldGet(this, _BlockManager_blockchain, "f").fallback;
            if (fallback) {
                const block = await this.fromFallback(blockNumber);
                if (block) {
                    return new ethereum_block_1.Block(block, fallback.getCommonForBlockNumber(common, blockNumber.toBigInt()));
                }
            }
        }
        throw new Error("header not found");
    }
    /**
     * Writes the block object to the underlying database.
     * @param block -
     */
    async putBlock(number, hash, serialized) {
        let key = number;
        // ensure we can store Block #0 as key "00", not ""
        if (EMPTY_BUFFER.equals(key)) {
            key = Buffer.from([0]);
        }
        const secondaryKey = hash.toBuffer();
        await Promise.all([
            __classPrivateFieldGet(this, _BlockManager_blockIndexes, "f").put(secondaryKey, key),
            super.set(key, serialized)
        ]);
    }
    /**
     * Updates the "latest" index to point to the given number.
     * @param number the block number of the latest block
     */
    async updateLatestIndex(number) {
        await __classPrivateFieldGet(this, _BlockManager_blockIndexes, "f").put(LATEST_INDEX_KEY, number);
    }
    /**
     * Updates the this.latest and this.earliest properties with data
     * from the database.
     */
    async updateTaggedBlocks() {
        const [earliest, latestBlockNumber] = await Promise.all([
            (async () => {
                for await (const data of this.base.createValueStream({ limit: 1 })) {
                    return new ethereum_block_1.Block(data, __classPrivateFieldGet(this, _BlockManager_common, "f"));
                }
            })(),
            __classPrivateFieldGet(this, _BlockManager_blockIndexes, "f").get(LATEST_INDEX_KEY).catch(e => null)
        ]);
        if (earliest)
            this.earliest = earliest;
        if (latestBlockNumber) {
            this.latest = await this.get(latestBlockNumber);
        }
        else {
            // TODO: remove this section for the Ganache 8.0 release
            // Ganache v7.0.0 didn't save a pointer to the latest block correctly, so
            // when a database was restarted it would pull the wrong block. This code
            // iterates over all data in the data base and finds the block with the
            // highest block number and updates the database with the pointer so we
            // don't have to hit this code again next time.
            this.latest = await (async () => {
                let latest;
                for await (const data of this.base.createValueStream()) {
                    const block = new ethereum_block_1.Block(data, __classPrivateFieldGet(this, _BlockManager_common, "f"));
                    if (!latest ||
                        block.header.number.toBigInt() > latest.header.number.toBigInt()) {
                        latest = block;
                    }
                }
                return latest;
            })();
            if (this.latest) {
                // update the LATEST_INDEX_KEY index so we don't have to do this next time
                await __classPrivateFieldGet(this, _BlockManager_blockIndexes, "f")
                    .put(LATEST_INDEX_KEY, this.latest.header.number.toBuffer())
                    .catch(e => null);
            }
        }
    }
}
exports.default = BlockManager;
_BlockManager_blockchain = new WeakMap(), _BlockManager_common = new WeakMap(), _BlockManager_blockIndexes = new WeakMap();
//# sourceMappingURL=block-manager.js.map