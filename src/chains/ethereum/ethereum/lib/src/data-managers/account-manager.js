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
var _AccountManager_blockchain;
Object.defineProperty(exports, "__esModule", { value: true });
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const util_1 = require("@ethereumjs/util");
const utils_1 = require("@ganache/utils");
const rlp_1 = require("@ganache/rlp");
class AccountManager {
    constructor(blockchain) {
        _AccountManager_blockchain.set(this, void 0);
        __classPrivateFieldSet(this, _AccountManager_blockchain, blockchain, "f");
    }
    async get(address, blockNumber = ethereum_utils_1.Tag.latest) {
        const raw = await this.getRaw(address, blockNumber);
        if (raw == null)
            return null;
        return ethereum_utils_1.Account.fromBuffer(raw);
    }
    async getRaw(address, blockNumber = ethereum_utils_1.Tag.latest) {
        const { trie, blocks } = __classPrivateFieldGet(this, _AccountManager_blockchain, "f");
        // get the block, its state root, and the trie at that state root
        const { stateRoot, number } = (await blocks.get(blockNumber)).header;
        const trieCopy = trie.copy(false);
        trieCopy.setContext(stateRoot.toBuffer(), null, number);
        // get the account from the trie
        return await trieCopy.get(address.toBuffer());
    }
    async getStorageAt(address, key, blockNumber = ethereum_utils_1.Tag.latest) {
        const { trie, blocks } = __classPrivateFieldGet(this, _AccountManager_blockchain, "f");
        // get the block, its state root, and the trie at that state root
        const { stateRoot, number } = (await blocks.get(blockNumber)).header;
        const trieCopy = trie.copy(false);
        trieCopy.setContext(stateRoot.toBuffer(), address.toBuffer(), number);
        // get the account from the trie
        return await trieCopy.get(key);
    }
    async getNonce(address, blockNumber = ethereum_utils_1.Tag.latest) {
        const data = await this.getRaw(address, blockNumber);
        if (data == null)
            return utils_1.Quantity.Zero;
        const [nonce] = (0, rlp_1.decode)(data);
        return nonce.length === 0 ? utils_1.Quantity.Zero : utils_1.Quantity.from(nonce);
    }
    async getBalance(address, blockNumber = ethereum_utils_1.Tag.latest) {
        const data = await this.getRaw(address, blockNumber);
        if (data == null)
            return utils_1.Quantity.Zero;
        const [, balance] = (0, rlp_1.decode)(data);
        return balance.length === 0 ? utils_1.Quantity.Zero : utils_1.Quantity.from(balance);
    }
    async getNonceAndBalance(address, blockNumber = ethereum_utils_1.Tag.latest) {
        const data = await this.getRaw(address, blockNumber);
        if (data == null)
            return { nonce: utils_1.Quantity.Zero, balance: utils_1.Quantity.Zero };
        const [nonce, balance] = (0, rlp_1.decode)(data);
        return {
            nonce: nonce.length === 0 ? utils_1.Quantity.Zero : utils_1.Quantity.from(nonce),
            balance: balance.length === 0 ? utils_1.Quantity.Zero : utils_1.Quantity.from(balance)
        };
    }
    async getCode(address, blockNumber = ethereum_utils_1.Tag.latest) {
        const data = await this.getRaw(address, blockNumber);
        if (data == null)
            return utils_1.Data.Empty;
        const [, , , codeHash] = (0, rlp_1.decode)(data);
        if (codeHash.equals(util_1.KECCAK256_NULL))
            return utils_1.Data.Empty;
        else
            return __classPrivateFieldGet(this, _AccountManager_blockchain, "f").trie.database().get(codeHash).then(utils_1.Data.from);
    }
}
exports.default = AccountManager;
_AccountManager_blockchain = new WeakMap();
//# sourceMappingURL=account-manager.js.map