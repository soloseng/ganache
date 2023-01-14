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
var _Fork_abortController, _Fork_handler, _Fork_options, _Fork_accounts, _Fork_hardfork, _Fork_setCommonFromChain, _Fork_setBlockDataFromChainAndOptions, _Fork_syncAccounts;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fork = void 0;
const utils_1 = require("@ganache/utils");
const abort_controller_1 = __importDefault(require("abort-controller"));
const common_1 = require("@ethereumjs/common");
const http_handler_1 = require("./handlers/http-handler");
const ws_handler_1 = require("./handlers/ws-handler");
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const ethereum_block_1 = require("@ganache/ethereum-block");
const block_manager_1 = __importDefault(require("../data-managers/block-manager"));
const provider_handler_1 = require("./handlers/provider-handler");
const persistent_cache_1 = require("./persistent-cache/persistent-cache");
const url_1 = require("url");
async function fetchChainId(fork) {
    const chainIdHex = await fork.request("eth_chainId", []);
    return parseInt(chainIdHex, 16);
}
async function fetchNetworkId(fork) {
    const networkIdStr = await fork.request("net_version", []);
    return parseInt(networkIdStr, 10);
}
function fetchBlockNumber(fork) {
    // {disableCache: true} required so we never cache the blockNumber, as forking
    // shouldn't ever cache a method that can change!
    return fork.request("eth_blockNumber", [], { disableCache: true });
}
function fetchBlock(fork, blockNumber) {
    return fork.request("eth_getBlockByNumber", [blockNumber, true]);
}
async function fetchNonce(fork, address, blockNumber) {
    const nonce = await fork.request("eth_getTransactionCount", [
        address,
        blockNumber
    ]);
    return utils_1.Quantity.from(nonce);
}
class Fork {
    constructor(options, accounts) {
        _Fork_abortController.set(this, new abort_controller_1.default());
        _Fork_handler.set(this, void 0);
        _Fork_options.set(this, void 0);
        _Fork_accounts.set(this, void 0);
        _Fork_hardfork.set(this, void 0);
        _Fork_setCommonFromChain.set(this, async (chainIdPromise) => {
            const [chainId, networkId] = await Promise.all([
                chainIdPromise,
                fetchNetworkId(this)
            ]);
            this.chainId = chainId;
            this.common = common_1.Common.custom({
                name: "ganache-fork",
                defaultHardfork: __classPrivateFieldGet(this, _Fork_hardfork, "f"),
                // use the remote chain's network id mostly because truffle's debugger
                // needs it to match in order to fetch sources
                networkId,
                // we use ganache's own chain id for blocks _after_ the fork to prevent
                // replay attacks
                chainId: __classPrivateFieldGet(this, _Fork_options, "f").chain.chainId,
                comment: "Local test network fork"
            }, { baseChain: utils_1.KNOWN_CHAINIDS.has(chainId) ? chainId : 1 });
            // disable listeners to common since we don't actually cause any `emit`s,
            // but other EVM parts to listen and will make node complain about too
            // many listeners.
            this.common.on = () => { };
        });
        _Fork_setBlockDataFromChainAndOptions.set(this, async (chainIdPromise) => {
            const { fork: options } = __classPrivateFieldGet(this, _Fork_options, "f");
            if (options.blockNumber === ethereum_utils_1.Tag.latest) {
                const [latestBlock, chainId] = await Promise.all([
                    fetchBlock(this, ethereum_utils_1.Tag.latest),
                    chainIdPromise
                ]);
                let blockNumber = parseInt(latestBlock.number, 16);
                const effectiveBlockNumber = utils_1.KNOWN_CHAINIDS.has(chainId)
                    ? Math.max(blockNumber - options.preLatestConfirmations, 0)
                    : blockNumber;
                let block;
                if (effectiveBlockNumber !== blockNumber) {
                    block = await fetchBlock(this, utils_1.Quantity.from(effectiveBlockNumber));
                }
                else {
                    block = latestBlock;
                }
                options.blockNumber = effectiveBlockNumber;
                this.blockNumber = utils_1.Quantity.from(effectiveBlockNumber);
                this.stateRoot = utils_1.Data.from(block.stateRoot);
                await __classPrivateFieldGet(this, _Fork_syncAccounts, "f").call(this, this.blockNumber);
                return block;
            }
            else if (Number.isInteger(options.blockNumber) &&
                options.blockNumber >= 0) {
                const blockNumber = utils_1.Quantity.from(options.blockNumber);
                const [block] = await Promise.all([
                    fetchBlock(this, blockNumber).then(async (block) => {
                        this.stateRoot = block.stateRoot;
                        await __classPrivateFieldGet(this, _Fork_syncAccounts, "f").call(this, blockNumber);
                        return block;
                    }),
                    fetchBlockNumber(this).then((latestBlockNumberHex) => {
                        const latestBlockNumberInt = parseInt(latestBlockNumberHex, 16);
                        // if our block number option is _after_ the current block number
                        // throw, as it likely wasn't intentional and doesn't make sense.
                        if (options.blockNumber > latestBlockNumberInt) {
                            throw new Error(`\`fork.blockNumber\` (${options.blockNumber}) must not be greater than the current block number (${latestBlockNumberInt})`);
                        }
                        else {
                            this.blockNumber = blockNumber;
                        }
                    })
                ]);
                return block;
            }
            else {
                throw new Error(`Invalid value for \`fork.blockNumber\` option: "${options.blockNumber}". Must be a positive integer or the string "latest".`);
            }
        });
        _Fork_syncAccounts.set(this, (blockNumber) => {
            return Promise.all(__classPrivateFieldGet(this, _Fork_accounts, "f").map(async (account) => {
                const nonce = await fetchNonce(this, account.address, blockNumber);
                account.nonce = nonce;
            }));
        });
        __classPrivateFieldSet(this, _Fork_options, options, "f");
        const forkingOptions = options.fork;
        __classPrivateFieldSet(this, _Fork_hardfork, options.chain.hardfork, "f");
        __classPrivateFieldSet(this, _Fork_accounts, accounts, "f");
        const { url, network } = forkingOptions;
        if (url) {
            const { protocol } = url;
            switch (protocol) {
                case "ws:":
                case "wss:":
                    __classPrivateFieldSet(this, _Fork_handler, new ws_handler_1.WsHandler(options, __classPrivateFieldGet(this, _Fork_abortController, "f").signal), "f");
                    break;
                case "http:":
                case "https:":
                    __classPrivateFieldSet(this, _Fork_handler, new http_handler_1.HttpHandler(options, __classPrivateFieldGet(this, _Fork_abortController, "f").signal), "f");
                    break;
                default: {
                    throw new Error(`Unsupported protocol: ${protocol}`);
                }
            }
        }
        else if (forkingOptions.provider) {
            __classPrivateFieldSet(this, _Fork_handler, new provider_handler_1.ProviderHandler(options, __classPrivateFieldGet(this, _Fork_abortController, "f").signal), "f");
        }
        else if (network) {
            let normalizedNetwork;
            if (network === "görli") {
                forkingOptions.network = normalizedNetwork = "goerli";
            }
            else {
                normalizedNetwork = network;
            }
            // Note: `process.env.INFURA_KEY` is replaced by webpack with an infura
            // key.
            const infuraKey = process.env.INFURA_KEY;
            if (!infuraKey) {
                throw new Error("The INFURA_KEY environment variable was not given and is required when using Ganache's integrated archive network feature.");
            }
            // any because the `network` check above narrowed the type to one
            // that doesn't include `url`, but we still want to add it.
            forkingOptions.url = new url_1.URL(`wss://${normalizedNetwork}.infura.io/ws/v3/${infuraKey}`);
            __classPrivateFieldSet(this, _Fork_handler, new ws_handler_1.WsHandler(options, __classPrivateFieldGet(this, _Fork_abortController, "f").signal), "f");
        }
    }
    async initialize() {
        let cacheProm;
        const { fork: forkOptions, chain: chainOptions, miner: minerOptions } = __classPrivateFieldGet(this, _Fork_options, "f");
        if (forkOptions.deleteCache)
            await persistent_cache_1.PersistentCache.deleteDb();
        if (forkOptions.disableCache === false) {
            // ignore cache start up errors as it is possible there is an `open`
            // conflict if another ganache fork is running at the time this one is
            // started. The cache isn't required (though performance will be
            // degraded without it)
            cacheProm = persistent_cache_1.PersistentCache.create().catch(_e => null);
        }
        else {
            cacheProm = null;
        }
        const chainIdPromise = fetchChainId(this);
        const [block, cache] = await Promise.all([
            __classPrivateFieldGet(this, _Fork_setBlockDataFromChainAndOptions, "f").call(this, chainIdPromise),
            cacheProm,
            __classPrivateFieldGet(this, _Fork_setCommonFromChain, "f").call(this, chainIdPromise)
        ]);
        const common = this.getCommonForBlockNumber(this.common, this.blockNumber.toBigInt());
        this.block = new ethereum_block_1.Block(block_manager_1.default.rawFromJSON(block, common), common);
        if (!chainOptions.time && minerOptions.timestampIncrement !== "clock") {
            chainOptions.time = new Date((this.block.header.timestamp.toNumber() +
                minerOptions.timestampIncrement.toNumber()) *
                1000);
        }
        if (cache)
            await this.initCache(cache);
    }
    async initCache(cache) {
        await cache.initialize(this.block.header.number, this.block.hash(), this.request.bind(this));
        __classPrivateFieldGet(this, _Fork_handler, "f").setCache(cache);
    }
    request(method, params, options = { disableCache: false }) {
        return __classPrivateFieldGet(this, _Fork_handler, "f").request(method, params, options);
    }
    abort() {
        return __classPrivateFieldGet(this, _Fork_abortController, "f").abort();
    }
    close() {
        return __classPrivateFieldGet(this, _Fork_handler, "f").close();
    }
    isValidForkBlockNumber(blockNumber) {
        return blockNumber.toBigInt() <= this.blockNumber.toBigInt();
    }
    selectValidForkBlockNumber(blockNumber) {
        return this.isValidForkBlockNumber(blockNumber)
            ? blockNumber
            : this.blockNumber;
    }
    /**
     * If the `blockNumber` is before our `fork.blockNumber`, return a `Common`
     * instance, applying the rules from the remote chain's `common` via its
     * original `chainId`. If the remote chain's `chainId` is now "known", return
     * a `Common` with our local `common`'s rules applied, but with the remote
     * chain's `chainId`. If the block is greater than or equal to our
     * `fork.blockNumber` return `common`.
     * @param common -
     * @param blockNumber -
     */
    getCommonForBlockNumber(common, blockNumber) {
        if (blockNumber <= this.blockNumber.toBigInt()) {
            // we are at or before our fork block
            if (utils_1.KNOWN_CHAINIDS.has(this.chainId)) {
                // we support this chain id, so let's use its rules
                let hardfork;
                // hardforks are iterated from earliest to latest
                for (const hf of common.hardforks()) {
                    if (hf.block === null)
                        continue;
                    if (blockNumber >= BigInt(hf.block)) {
                        hardfork = hf.name;
                    }
                    else {
                        break;
                    }
                }
                return new common_1.Common({ chain: this.chainId, hardfork });
            }
            // we don't know about this chain or hardfork, so just carry on per usual,
            // but with the fork's chainId (instead of our local chainId)
            return common_1.Common.custom({
                chainId: this.chainId,
                defaultHardfork: common.hardfork()
            }, { baseChain: 1 });
        }
        else {
            return common;
        }
    }
}
exports.Fork = Fork;
_Fork_abortController = new WeakMap(), _Fork_handler = new WeakMap(), _Fork_options = new WeakMap(), _Fork_accounts = new WeakMap(), _Fork_hardfork = new WeakMap(), _Fork_setCommonFromChain = new WeakMap(), _Fork_setBlockDataFromChainAndOptions = new WeakMap(), _Fork_syncAccounts = new WeakMap();
//# sourceMappingURL=fork.js.map