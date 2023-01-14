"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var _Blockchain_state, _Blockchain_miner, _Blockchain_blockBeingSavedPromise, _Blockchain_timer, _Blockchain_emitStepEvent, _Blockchain_database, _Blockchain_options, _Blockchain_instamine, _Blockchain_saveNewBlock, _Blockchain_emitNewBlock, _Blockchain_getTransactionLogOutput, _Blockchain_handleNewBlockData, _Blockchain_readyNextBlock, _Blockchain_isPaused, _Blockchain_commitAccounts, _Blockchain_initializeGenesisBlock, _Blockchain_timeAdjustment, _Blockchain_adjustedTime, _Blockchain_deleteBlockData, _Blockchain_snapshots, _Blockchain_traceTransaction, _Blockchain_prepareNextBlock;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Status = void 0;
const os_1 = require("os");
const miner_1 = __importStar(require("./miner/miner"));
const database_1 = __importDefault(require("./database"));
const emittery_1 = __importDefault(require("emittery"));
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const rlp_1 = require("@ganache/rlp");
const util_1 = require("@ethereumjs/util");
const common_1 = require("@ethereumjs/common");
const vm_1 = require("@ethereumjs/vm");
const evm_1 = require("@ethereumjs/evm");
const utils_1 = require("@ganache/utils");
const account_manager_1 = __importDefault(require("./data-managers/account-manager"));
const block_manager_1 = __importDefault(require("./data-managers/block-manager"));
const blocklog_manager_1 = __importDefault(require("./data-managers/blocklog-manager"));
const transaction_manager_1 = __importDefault(require("./data-managers/transaction-manager"));
const ethereum_address_1 = require("@ganache/ethereum-address");
const ethereum_transaction_1 = require("@ganache/ethereum-transaction");
const ethereum_block_1 = require("@ganache/ethereum-block");
const run_call_1 = require("./helpers/run-call");
const state_manager_1 = require("./forking/state-manager");
const statemanager_1 = require("@ethereumjs/statemanager");
const trie_1 = require("./helpers/trie");
const trie_2 = require("./forking/trie");
const precompiles_1 = require("./helpers/precompiles");
const transaction_receipt_manager_1 = __importDefault(require("./data-managers/transaction-receipt-manager"));
const provider_events_1 = require("./provider-events");
const mcl_wasm_1 = __importDefault(require("mcl-wasm"));
const console_log_1 = require("@ganache/console.log");
const precompiled_contracts_1 = require("./helpers/precompiled-contracts");
const mclInitPromise = mcl_wasm_1.default.init(mcl_wasm_1.default.BLS12_381).then(() => {
    mcl_wasm_1.default.setMapToMode(mcl_wasm_1.default.IRTF); // set the right map mode; otherwise mapToG2 will return wrong values.
    mcl_wasm_1.default.verifyOrderG1(true); // subgroup checks for G1
    mcl_wasm_1.default.verifyOrderG2(true); // subgroup checks for G2
});
var Status;
(function (Status) {
    // Flags
    Status[Status["started"] = 1] = "started";
    Status[Status["starting"] = 2] = "starting";
    Status[Status["stopped"] = 4] = "stopped";
    Status[Status["stopping"] = 8] = "stopping";
    Status[Status["paused"] = 16] = "paused"; // 0001 0000
})(Status = exports.Status || (exports.Status = {}));
/**
 * Sets the provided VM state manager's state root *without* first
 * checking for checkpoints or flushing the existing cache.
 *
 * Useful if you know the state manager is not in a checkpoint and its internal
 * cache is safe to discard.
 *
 * @param stateManager -
 * @param stateRoot -
 */
function setStateRootSync(stateManager, stateRoot) {
    stateManager._trie.root(stateRoot);
    stateManager._cache.clear();
    stateManager._storageTries = {};
}
function makeTrie(blockchain, trieDB, root) {
    if (blockchain.fallback) {
        return new trie_2.ForkTrie(trieDB, root ? root.toBuffer() : null, blockchain);
    }
    else {
        return new trie_1.GanacheTrie(trieDB, root ? root.toBuffer() : null, blockchain);
    }
}
function createCommon(chainId, networkId, hardfork) {
    const common = common_1.Common.custom({
        name: "ganache",
        networkId: networkId,
        chainId: chainId,
        comment: "Local test network",
        defaultHardfork: hardfork
    }, 
    // if we were given a chain id that matches a real chain, use it
    // NOTE: I don't think Common serves a purpose other than instructing the
    // VM what hardfork is in use. But just incase things change in the future
    // its configured "more correctly" here.
    { baseChain: utils_1.KNOWN_CHAINIDS.has(chainId) ? chainId : 1 });
    // the VM likes to listen to "hardforkChanged" events from common, but:
    //  a) we don't currently support changing hardforks
    //  b) it can cause `MaxListenersExceededWarning`.
    // Since we don't need it we overwrite .on to make it be quiet.
    common.on = () => { };
    return common;
}
class Blockchain extends emittery_1.default {
    /**
     * Initializes the underlying Database and handles synchronization between
     * the API and the database.
     *
     * Emits a `ready` event once the database and all dependencies are fully
     * initialized.
     * @param options -
     */
    constructor(options, coinbase, fallback) {
        super();
        _Blockchain_state.set(this, Status.starting);
        _Blockchain_miner.set(this, void 0);
        _Blockchain_blockBeingSavedPromise.set(this, void 0);
        /**
         * When not instamining (blockTime > 0) this value holds the timeout timer.
         */
        _Blockchain_timer.set(this, null);
        /**
         * Because step events are expensive to create and emit, CPU-wise, we do it
         * conditionally.
         */
        _Blockchain_emitStepEvent.set(this, false);
        _Blockchain_database.set(this, void 0);
        _Blockchain_options.set(this, void 0);
        _Blockchain_instamine.set(this, void 0);
        _Blockchain_saveNewBlock.set(this, ({ block, serialized, storageKeys, transactions }) => {
            const { blocks } = this;
            blocks.latest = block;
            return __classPrivateFieldGet(this, _Blockchain_database, "f").batch(() => {
                const blockHash = block.hash();
                const blockHeader = block.header;
                const blockNumberQ = blockHeader.number;
                const blockNumber = blockNumberQ.toBuffer();
                const blockLogs = ethereum_utils_1.BlockLogs.create(blockHash);
                const timestamp = blockHeader.timestamp;
                const timestampStr = new Date(timestamp.toNumber() * 1000).toString();
                const logOutput = [];
                transactions.forEach((tx, i) => {
                    const hash = tx.hash.toBuffer();
                    const index = utils_1.Quantity.from(i);
                    // save transaction to the database
                    const serialized = tx.serializeForDb(blockHash, blockNumberQ, index);
                    this.transactions.set(hash, serialized);
                    // save receipt to the database
                    const receipt = tx.getReceipt();
                    const encodedReceipt = receipt.serialize(true);
                    this.transactionReceipts.set(hash, encodedReceipt);
                    // collect block logs
                    tx.getLogs().forEach(blockLogs.append.bind(blockLogs, index, tx.hash));
                    // prepare log output
                    logOutput.push(__classPrivateFieldGet(this, _Blockchain_getTransactionLogOutput, "f").call(this, hash, receipt, blockHeader.number, timestampStr, tx.execException));
                });
                // save storage keys to the database
                storageKeys.forEach(value => {
                    this.storageKeys.put(value.hashedKey, value.key);
                });
                blockLogs.blockNumber = blockHeader.number;
                // save block logs to the database
                this.blockLogs.set(blockNumber, blockLogs.serialize());
                // save block to the database
                blocks.putBlock(blockNumber, blockHash, serialized);
                // update the "latest" index
                blocks.updateLatestIndex(blockNumber);
                // output to the log, if we have data to output
                if (logOutput.length > 0)
                    __classPrivateFieldGet(this, _Blockchain_options, "f").logging.logger.log(logOutput.join(os_1.EOL));
                return { block, blockLogs, transactions };
            });
        });
        /**
         * Emit the block now that everything has been fully saved to the database
         */
        _Blockchain_emitNewBlock.set(this, async (blockInfo) => {
            const options = __classPrivateFieldGet(this, _Blockchain_options, "f");
            const { block, blockLogs, transactions } = blockInfo;
            transactions.forEach(transaction => {
                transaction.finalize("confirmed", transaction.execException);
            });
            if (options.miner.instamine === "eager") {
                // in eager instamine mode we must delay the broadcast of new blocks
                await new Promise(resolve => {
                    // we delay emitting blocks and blockLogs because we need to allow for:
                    // ```
                    //  await provider.request({"method": "eth_sendTransaction"...)
                    //  await provider.once("message") // <- should work
                    // ```
                    // If we don't have this delay here the messages will be sent before
                    // the call has a chance to listen to the event.
                    setImmediate(async () => {
                        // emit block logs first so filters can pick them up before
                        // block listeners are notified
                        await Promise.all([
                            this.emit("blockLogs", blockLogs),
                            this.emit("block", block)
                        ]);
                        resolve(void 0);
                    });
                });
            }
            else {
                // emit block logs first so filters can pick them up before
                // block listeners are notified
                await Promise.all([
                    this.emit("blockLogs", blockLogs),
                    this.emit("block", block)
                ]);
            }
            return blockInfo;
        });
        _Blockchain_getTransactionLogOutput.set(this, (hash, receipt, blockNumber, timestamp, error) => {
            let str = `${os_1.EOL}  Transaction: ${utils_1.Data.from(hash)}${os_1.EOL}`;
            const contractAddress = receipt.contractAddress;
            if (contractAddress != null) {
                str += `  Contract created: ${ethereum_address_1.Address.from(contractAddress)}${os_1.EOL}`;
            }
            str += `  Gas usage: ${utils_1.Quantity.toNumber(receipt.raw[1])}
  Block number: ${blockNumber.toNumber()}
  Block time: ${timestamp}${os_1.EOL}`;
            if (error) {
                str += `  Runtime error: ${error.data.message}${os_1.EOL}`;
                if (error.data.reason) {
                    str += `  Revert reason: ${error.data.reason}${os_1.EOL}`;
                }
            }
            return str;
        });
        _Blockchain_handleNewBlockData.set(this, async (blockData) => {
            __classPrivateFieldSet(this, _Blockchain_blockBeingSavedPromise, __classPrivateFieldGet(this, _Blockchain_blockBeingSavedPromise, "f").then(() => {
                const saveBlockProm = __classPrivateFieldGet(this, _Blockchain_saveNewBlock, "f").call(this, blockData);
                saveBlockProm.then(__classPrivateFieldGet(this, _Blockchain_emitNewBlock, "f"));
                // blockBeingSavedPromise should await the block being _saved_, but doesn't
                // need to await the block being emitted.
                return saveBlockProm;
            }), "f");
            await __classPrivateFieldGet(this, _Blockchain_blockBeingSavedPromise, "f");
        });
        _Blockchain_readyNextBlock.set(this, (previousBlock, timestamp) => {
            const previousHeader = previousBlock.header;
            const previousNumber = previousHeader.number.toBigInt() || 0n;
            const minerOptions = __classPrivateFieldGet(this, _Blockchain_options, "f").miner;
            if (timestamp == null) {
                timestamp = __classPrivateFieldGet(this, _Blockchain_adjustedTime, "f").call(this, previousHeader.timestamp);
            }
            return new ethereum_block_1.RuntimeBlock(utils_1.Quantity.from(previousNumber + 1n), previousBlock.hash(), this.coinbase, minerOptions.blockGasLimit, utils_1.Quantity.Zero, utils_1.Quantity.from(timestamp), this.isPostMerge ? utils_1.Quantity.Zero : minerOptions.difficulty, previousHeader.totalDifficulty, this.getMixHash(previousBlock.hash().toBuffer()), ethereum_block_1.Block.calcNextBaseFee(previousBlock));
        });
        this.isStarted = () => {
            return __classPrivateFieldGet(this, _Blockchain_state, "f") === Status.started;
        };
        this.mine = async (maxTransactions, onlyOneBlock = false, timestamp) => {
            const nextBlock = __classPrivateFieldGet(this, _Blockchain_readyNextBlock, "f").call(this, this.blocks.latest, timestamp);
            const transactions = await __classPrivateFieldGet(this, _Blockchain_miner, "f").mine(nextBlock, maxTransactions, onlyOneBlock);
            await __classPrivateFieldGet(this, _Blockchain_blockBeingSavedPromise, "f");
            if (__classPrivateFieldGet(this, _Blockchain_options, "f").miner.timestampIncrement !== "clock") {
                // if block time is incremental, adjustments should only apply once,
                // otherwise they accumulate with each block.
                __classPrivateFieldSet(this, _Blockchain_timeAdjustment, 0, "f");
            }
            else if (timestamp !== undefined) {
                // when miner.timestampIncrement is a number, the previous block timestamp
                // is used as a reference for the next block, so this call is not
                // required.
                this.setTimeDiff(timestamp * 1000);
            }
            return {
                transactions,
                blockNumber: nextBlock.header.number
            };
        };
        _Blockchain_isPaused.set(this, () => {
            return (__classPrivateFieldGet(this, _Blockchain_state, "f") & Status.paused) !== 0;
        });
        this.createVmFromStateTrie = async (stateTrie, allowUnlimitedContractSize, activatePrecompile, common) => {
            const blocks = this.blocks;
            // ethereumjs vm doesn't use the callback style anymore
            const blockchain = {
                getBlock: async (number) => {
                    const block = await blocks
                        .get(utils_1.Quantity.toBuffer(number))
                        .catch(_ => null);
                    return block ? { hash: () => block.hash().toBuffer() } : null;
                }
            };
            // ethereumjs-vm wants to "copy" the blockchain when `vm.copy` is called.
            blockchain.copy = () => {
                return blockchain;
            };
            common = common || this.common;
            // TODO: prefixCodeHashes should eventually be conditional
            // https://github.com/trufflesuite/ganache/issues/3701
            const stateManager = this.fallback
                ? new state_manager_1.ForkStateManager({
                    trie: stateTrie,
                    prefixCodeHashes: false
                })
                : new statemanager_1.DefaultStateManager({ trie: stateTrie, prefixCodeHashes: false });
            const eei = new vm_1.EEI(stateManager, common, blockchain);
            const evm = new evm_1.EVM({ common, allowUnlimitedContractSize, eei });
            const vm = await vm_1.VM.create({
                activatePrecompiles: false,
                common,
                blockchain,
                stateManager,
                evm
            });
            if (activatePrecompile) {
                await (0, precompiles_1.activatePrecompiles)(vm.eei);
                if (common.isActivatedEIP(2537)) {
                    // BLS12-381 curve, not yet included in any supported hardforks
                    // but probably will be in the Shanghai hardfork
                    // TODO: remove above comment once Shanghai is supported!
                    await mclInitPromise; // ensure that mcl is initialized!
                }
            }
            // skip `vm.init`, since we don't use any of it
            vm._isInitialized = true;
            return vm;
        };
        _Blockchain_commitAccounts.set(this, (accounts) => {
            return Promise.all(accounts.map(account => this.trie.put(account.address.toBuffer(), account.serialize())));
        });
        _Blockchain_initializeGenesisBlock.set(this, async (timestamp, blockGasLimit, initialAccounts) => {
            if (this.fallback != null) {
                const { block: fallbackBlock } = this.fallback;
                const { miner: minerOptions } = __classPrivateFieldGet(this, _Blockchain_options, "f");
                // commit accounts, but for forking.
                const stateManager = this.vm.stateManager;
                await stateManager.checkpoint();
                // XXX: <CELO> Pre-deploy registry contract at static address
                const registryProxy = (0, precompiled_contracts_1.celoRegistryProxy)(initialAccounts[0].address);
                await stateManager.putContractCode(registryProxy.address, registryProxy.code);
                await stateManager.putContractStorage(registryProxy.address, registryProxy.storageKey, registryProxy.storageValue);
                // </CELO>
                initialAccounts.forEach(account => {
                    this.vm.eei.putAccount(account.address, account);
                });
                await stateManager.commit();
                // create the genesis block
                let baseFeePerGas;
                if (this.common.isActivatedEIP(1559)) {
                    if (fallbackBlock.header.baseFeePerGas === undefined) {
                        baseFeePerGas = ethereum_block_1.Block.INITIAL_BASE_FEE_PER_GAS;
                    }
                    else {
                        baseFeePerGas = fallbackBlock.header.baseFeePerGas.toBigInt();
                    }
                }
                const genesis = new ethereum_block_1.RuntimeBlock(utils_1.Quantity.from(fallbackBlock.header.number.toBigInt() + 1n), fallbackBlock.hash(), this.coinbase, blockGasLimit, utils_1.Quantity.Zero, utils_1.Quantity.from(timestamp), this.isPostMerge ? utils_1.Quantity.Zero : minerOptions.difficulty, fallbackBlock.header.totalDifficulty, this.getMixHash(fallbackBlock.hash().toBuffer()), baseFeePerGas);
                // store the genesis block in the database
                const { block, serialized } = genesis.finalize(util_1.KECCAK256_RLP, util_1.KECCAK256_RLP, utils_1.BUFFER_256_ZERO, this.trie.root(), 0n, minerOptions.extraData, [], new Map());
                const hash = block.hash();
                return this.blocks
                    .putBlock(block.header.number.toBuffer(), hash, serialized)
                    .then(_ => ({
                    block,
                    blockLogs: ethereum_utils_1.BlockLogs.create(hash)
                }));
            }
            await __classPrivateFieldGet(this, _Blockchain_commitAccounts, "f").call(this, initialAccounts);
            // README: block `0` is weird in that a `0` _should_ be hashed as `[]`,
            // instead of `[0]`, so we set it to `Quantity.Empty` instead of
            // `Quantity.Zero` here. A few lines down in this function we swap
            // this `Quantity.Empty` for `Quantity.Zero`. This is all so we don't
            // have to have a "treat empty as 0` check in every function that uses the
            // "latest" block (which this genesis block will be for brief moment).
            const rawBlockNumber = utils_1.Quantity.Empty;
            // create the genesis block
            const baseFeePerGas = this.common.isActivatedEIP(1559)
                ? ethereum_block_1.Block.INITIAL_BASE_FEE_PER_GAS
                : undefined;
            const genesis = new ethereum_block_1.RuntimeBlock(rawBlockNumber, utils_1.Data.from(utils_1.BUFFER_32_ZERO), this.coinbase, blockGasLimit, utils_1.Quantity.Zero, utils_1.Quantity.from(timestamp), this.isPostMerge ? utils_1.Quantity.Zero : __classPrivateFieldGet(this, _Blockchain_options, "f").miner.difficulty, utils_1.Quantity.Zero, // we start the totalDifficulty at 0
            // we use the initial trie root as the genesis block's mixHash as it
            // is deterministic based on initial wallet conditions
            this.isPostMerge ? (0, utils_1.keccak)(this.trie.root()) : utils_1.BUFFER_32_ZERO, baseFeePerGas);
            // store the genesis block in the database
            const { block, serialized } = genesis.finalize(util_1.KECCAK256_RLP, util_1.KECCAK256_RLP, utils_1.BUFFER_256_ZERO, this.trie.root(), 0n, __classPrivateFieldGet(this, _Blockchain_options, "f").miner.extraData, [], new Map());
            // README: set the block number to an actual 0 now.
            block.header.number = utils_1.Quantity.Zero;
            const hash = block.hash();
            return this.blocks
                .putBlock(block.header.number.toBuffer(), hash, serialized)
                .then(_ => ({
                block,
                blockLogs: ethereum_utils_1.BlockLogs.create(hash)
            }));
        });
        /**
         * The number of milliseconds time should be adjusted by when computing the
         * "time" for a block.
         */
        _Blockchain_timeAdjustment.set(this, 0);
        /**
         * Returns the timestamp, adjusted by the timeAdjustment offset, in seconds.
         * @param precedingTimestamp - the timestamp of the block to be used as the
         * time source if `timestampIncrement` is not "clock".
         */
        _Blockchain_adjustedTime.set(this, (precedingTimestamp) => {
            const timeAdjustment = __classPrivateFieldGet(this, _Blockchain_timeAdjustment, "f");
            const timestampIncrement = __classPrivateFieldGet(this, _Blockchain_options, "f").miner.timestampIncrement;
            if (timestampIncrement === "clock") {
                return Math.floor((Date.now() + timeAdjustment) / 1000);
            }
            else {
                return (precedingTimestamp.toNumber() +
                    Math.floor(timeAdjustment / 1000) +
                    timestampIncrement.toNumber());
            }
        });
        _Blockchain_deleteBlockData.set(this, async (blocksToDelete, newLatestBlockNumber) => {
            // if we are forking we need to make sure we clean up the forking related
            // metadata that isn't stored in the trie
            if ("revertMetaData" in this.trie) {
                await this.trie.revertMetaData(blocksToDelete[blocksToDelete.length - 1].header.number, blocksToDelete[0].header.number);
            }
            await __classPrivateFieldGet(this, _Blockchain_database, "f").batch(() => {
                const { blocks, transactions, transactionReceipts, blockLogs } = this;
                // point to the new "latest" again
                blocks.updateLatestIndex(newLatestBlockNumber);
                // clean up old blocks
                blocksToDelete.forEach(block => {
                    block.getTransactions().forEach(tx => {
                        const txHash = tx.hash.toBuffer();
                        transactions.del(txHash);
                        transactionReceipts.del(txHash);
                    });
                    const blockNum = block.header.number.toBuffer();
                    blocks.del(blockNum);
                    blocks.del(block.hash().toBuffer());
                    blockLogs.del(blockNum);
                });
            });
        });
        // TODO(stability): this.#snapshots is a potential unbound memory suck. Caller
        // could call `evm_snapshot` over and over to grow the snapshot stack
        // indefinitely. `this.#snapshots.blocks` is even worse. To solve this we
        // might need to store in the db. An unlikely real problem, but possible.
        _Blockchain_snapshots.set(this, {
            snaps: [],
            blocks: null,
            unsubscribeFromBlocks: null
        });
        _Blockchain_traceTransaction.set(this, async (transaction, trie, newBlock, options, keys, contractAddress) => {
            let currentDepth = -1;
            const storageStack = [];
            const blocks = this.blocks;
            // ethereumjs vm doesn't use the callback style anymore
            const blockchain = {
                getBlock: async (number) => {
                    const block = await blocks
                        .get(utils_1.Quantity.toBuffer(number))
                        .catch(_ => null);
                    return block ? { hash: () => block.hash().toBuffer() } : null;
                }
            };
            const common = this.fallback
                ? this.fallback.getCommonForBlockNumber(this.common, BigInt(newBlock.header.number.toString()))
                : this.common;
            // TODO: prefixCodeHashes should eventually be conditional
            // https://github.com/trufflesuite/ganache/issues/3701
            const stateManager = this.fallback
                ? new state_manager_1.ForkStateManager({
                    trie: trie,
                    prefixCodeHashes: false
                })
                : new statemanager_1.DefaultStateManager({ trie, prefixCodeHashes: false });
            const eei = new vm_1.EEI(stateManager, common, blockchain);
            const evm = new evm_1.EVM({
                common,
                allowUnlimitedContractSize: __classPrivateFieldGet(this, _Blockchain_options, "f").chain.allowUnlimitedContractSize,
                eei
            });
            const vm = await vm_1.VM.create({
                activatePrecompiles: false,
                common,
                blockchain,
                stateManager,
                evm
            });
            const storage = {};
            let gas = 0n;
            const structLogs = [];
            const TraceData = (0, ethereum_utils_1.TraceDataFactory)();
            const transactionEventContext = {};
            const stepListener = async (event, next) => {
                // See these docs:
                // https://github.com/ethereum/go-ethereum/wiki/Management-APIs
                if (__classPrivateFieldGet(this, _Blockchain_emitStepEvent, "f")) {
                    this.emit("ganache:vm:tx:step", (0, provider_events_1.makeStepEvent)(transactionEventContext, event));
                }
                const gasLeft = event.gasLeft;
                const totalGasUsedAfterThisStep = transaction.gasLimit - gasLeft;
                const gasUsedPreviousStep = totalGasUsedAfterThisStep - gas;
                gas += gasUsedPreviousStep;
                const memory = [];
                if (options.disableMemory !== true) {
                    // We get the memory as one large array.
                    // Let's cut it up into 32 byte chunks as required by the spec.
                    let index = 0;
                    while (index < event.memory.length) {
                        const slice = event.memory.slice(index, index + 32);
                        memory.push(TraceData.from(Buffer.from(slice)));
                        index += 32;
                    }
                }
                const stack = [];
                if (options.disableStack !== true) {
                    for (const stackItem of event.stack) {
                        stack.push(TraceData.from(utils_1.Quantity.toBuffer(stackItem)));
                    }
                }
                const structLog = {
                    depth: event.depth + 1,
                    error: "",
                    gas: utils_1.Quantity.from(gasLeft),
                    gasCost: 0,
                    memory,
                    op: event.opcode.name,
                    pc: event.pc,
                    stack,
                    storage: null
                };
                // The gas difference calculated for each step is indicative of gas consumed in
                // the previous step. Gas consumption in the final step will always be zero.
                if (structLogs.length) {
                    structLogs[structLogs.length - 1].gasCost = Number(gasUsedPreviousStep);
                }
                if (options.disableStorage === true) {
                    // Add the struct log as is - nothing more to do.
                    structLogs.push(structLog);
                    next();
                }
                else {
                    const { depth: eventDepth } = event;
                    if (currentDepth > eventDepth) {
                        storageStack.pop();
                    }
                    else if (currentDepth < eventDepth) {
                        storageStack.push(new ethereum_utils_1.TraceStorageMap());
                    }
                    currentDepth = eventDepth;
                    switch (event.opcode.name) {
                        case "SSTORE": {
                            const key = stack[stack.length - 1];
                            const value = stack[stack.length - 2];
                            // new TraceStorageMap() here creates a shallow clone, to prevent other steps from overwriting
                            structLog.storage = new ethereum_utils_1.TraceStorageMap(storageStack[eventDepth]);
                            // Tell vm to move on to the next instruction. See below.
                            structLogs.push(structLog);
                            next();
                            // assign after callback because this storage change actually takes
                            // effect _after_ this opcode executes
                            storageStack[eventDepth].set(key, value);
                            break;
                        }
                        case "SLOAD": {
                            const key = stack[stack.length - 1];
                            const result = await vm.stateManager.getContractStorage(event.address, key.toBuffer());
                            const value = TraceData.from(result);
                            storageStack[eventDepth].set(key, value);
                            // new TraceStorageMap() here creates a shallow clone, to prevent other steps from overwriting
                            structLog.storage = new ethereum_utils_1.TraceStorageMap(storageStack[eventDepth]);
                            structLogs.push(structLog);
                            next();
                            break;
                        }
                        default:
                            // new TraceStorageMap() here creates a shallow clone, to prevent other steps from overwriting
                            structLog.storage = new ethereum_utils_1.TraceStorageMap(storageStack[eventDepth]);
                            structLogs.push(structLog);
                            next();
                    }
                }
            };
            // Don't even let the vm try to flush the block's _cache to the stateTrie.
            // When forking some of the data that the traced function may request will
            // exist only on the main chain. Because we pretty much lie to the VM by
            // telling it we DO have data in our Trie, when we really don't, it gets
            // lost during the commit phase when it traverses the "borrowed" datum's
            // trie (as it may not have a valid root). Because this is a trace, and we
            // don't need to commit the data, duck punching the `flush` method (the
            // simplest method I could find) is fine.
            // Remove this and you may see the infamous
            // `Uncaught TypeError: Cannot read property 'pop' of undefined` error!
            vm.stateManager._cache.flush = async () => { };
            // Process the block without committing the data.
            // The vmerr key on the result appears to be removed.
            // The previous implementation had specific error handling.
            // It's possible we've removed handling specific cases in this implementation.
            // e.g., the previous incantation of RuntimeError
            await vm.stateManager.checkpoint();
            try {
                for (let i = 0, l = newBlock.transactions.length; i < l; i++) {
                    const tx = newBlock.transactions[i];
                    if (tx === transaction) {
                        if (keys && contractAddress) {
                            const database = __classPrivateFieldGet(this, _Blockchain_database, "f");
                            await Promise.all(keys.map(async (key) => {
                                // get the raw key using the hashed key
                                const rawKey = await database.storageKeys.get(key);
                                const result = await vm.stateManager.getContractStorage(new ethereum_address_1.Address(contractAddress), rawKey);
                                storage[utils_1.Data.toString(key, key.length)] = {
                                    key: utils_1.Data.from(rawKey, rawKey.length),
                                    value: utils_1.Data.from(result, 32)
                                };
                            }));
                            break;
                        }
                        else {
                            vm.evm.events.on("step", stepListener);
                            // force the loop to break after running this transaction by setting
                            // the current iteration past the end
                            i = l;
                        }
                    }
                    this.emit("ganache:vm:tx:before", {
                        context: transactionEventContext
                    });
                    await vm.runTx({ tx, block: newBlock });
                    this.emit("ganache:vm:tx:after", {
                        context: transactionEventContext
                    });
                }
                vm.evm.events.removeListener("step", stepListener);
            }
            finally {
                await vm.stateManager.revert();
            }
            // send state results back
            return {
                gas: utils_1.Quantity.from(gas),
                structLogs,
                returnValue: "",
                storage
            };
        });
        _Blockchain_prepareNextBlock.set(this, (targetBlock, parentBlock, transactionHash) => {
            // Prepare the "next" block with necessary transactions
            const newBlock = new ethereum_block_1.RuntimeBlock(utils_1.Quantity.from((parentBlock.header.number.toBigInt() || 0n) + 1n), parentBlock.hash(), ethereum_address_1.Address.from(parentBlock.header.miner.toString()), parentBlock.header.gasLimit, utils_1.Quantity.Zero, 
            // make sure we use the same timestamp as the target block
            targetBlock.header.timestamp, this.isPostMerge ? utils_1.Quantity.Zero : __classPrivateFieldGet(this, _Blockchain_options, "f").miner.difficulty, parentBlock.header.totalDifficulty, this.getMixHash(parentBlock.hash().toBuffer()), ethereum_block_1.Block.calcNextBaseFee(parentBlock));
            newBlock.transactions = [];
            newBlock.uncleHeaders = [];
            const transactions = targetBlock.getTransactions();
            for (const tx of transactions) {
                newBlock.transactions.push(tx.toVmTransaction());
                // After including the target transaction, that's all we need to do.
                if (tx.hash.toBuffer().equals(transactionHash)) {
                    break;
                }
            }
            return newBlock;
        });
        __classPrivateFieldSet(this, _Blockchain_options, options, "f");
        this.fallback = fallback;
        this.coinbase = coinbase;
        __classPrivateFieldSet(this, _Blockchain_instamine, !options.miner.blockTime || options.miner.blockTime <= 0, "f");
        __classPrivateFieldSet(this, _Blockchain_database, new database_1.default(options.database, this), "f");
    }
    async initialize(initialAccounts) {
        const database = __classPrivateFieldGet(this, _Blockchain_database, "f");
        const options = __classPrivateFieldGet(this, _Blockchain_options, "f");
        const instamine = __classPrivateFieldGet(this, _Blockchain_instamine, "f");
        try {
            let common;
            if (this.fallback) {
                await this.fallback.initialize();
                await database.initialize();
                common = this.common = this.fallback.common;
                options.fork.blockNumber = this.fallback.blockNumber.toNumber();
                options.chain.networkId = Number(common.networkId());
                options.chain.chainId = Number(common.chainId());
            }
            else {
                await database.initialize();
                common = this.common = createCommon(options.chain.chainId, options.chain.networkId, options.chain.hardfork);
            }
            this.isPostMerge = this.common.gteHardfork("merge");
            const blocks = (this.blocks = await block_manager_1.default.initialize(this, common, database.blockIndexes, database.blocks));
            this.blockLogs = new blocklog_manager_1.default(database.blockLogs, this);
            this.transactions = new transaction_manager_1.default(options.miner, common, this, database.transactions);
            this.transactionReceipts = new transaction_receipt_manager_1.default(database.transactionReceipts, this);
            this.accounts = new account_manager_1.default(this);
            this.storageKeys = database.storageKeys;
            // if we have a latest block, use it to set up the trie.
            const { latest } = blocks;
            {
                let stateRoot;
                if (latest) {
                    __classPrivateFieldSet(this, _Blockchain_blockBeingSavedPromise, Promise.resolve({
                        block: latest,
                        blockLogs: null
                    }), "f");
                    ({ stateRoot } = latest.header);
                }
                else {
                    stateRoot = null;
                }
                this.trie = makeTrie(this, database.trie, stateRoot);
            }
            // create VM and listen to step events
            this.vm = await this.createVmFromStateTrie(this.trie, options.chain.allowUnlimitedContractSize, true);
            {
                // Grab current time once to be used in all references to "now", to avoid
                // any discrepancies. See https://github.com/trufflesuite/ganache/issues/3271
                const startTime = new Date();
                // if we don't have a time from the user get one now
                if (options.chain.time == null)
                    options.chain.time = startTime;
                // create first block
                const timestamp = options.chain.time.getTime();
                const firstBlockTime = Math.floor(timestamp / 1000);
                // if we are using clock time we need to record the time offset so
                // other blocks can have timestamps relative to our initial time.
                if (options.miner.timestampIncrement === "clock") {
                    __classPrivateFieldSet(this, _Blockchain_timeAdjustment, timestamp - +startTime, "f");
                }
                // if we don't already have a latest block, create a genesis block!
                if (!latest) {
                    if (initialAccounts.length > 0) {
                        await __classPrivateFieldGet(this, _Blockchain_commitAccounts, "f").call(this, initialAccounts);
                    }
                    __classPrivateFieldSet(this, _Blockchain_blockBeingSavedPromise, __classPrivateFieldGet(this, _Blockchain_initializeGenesisBlock, "f").call(this, firstBlockTime, options.miner.blockGasLimit, initialAccounts), "f");
                    blocks.earliest = blocks.latest =
                        await __classPrivateFieldGet(this, _Blockchain_blockBeingSavedPromise, "f").then(({ block }) => block);
                }
            }
            {
                // configure and start miner
                const txPool = this.transactions.transactionPool;
                const minerOpts = options.miner;
                const miner = (__classPrivateFieldSet(this, _Blockchain_miner, new miner_1.default(minerOpts, txPool.executables, this.vm, __classPrivateFieldGet(this, _Blockchain_readyNextBlock, "f")), "f"));
                //#region re-emit miner events:
                miner.on("ganache:vm:tx:before", event => {
                    this.emit("ganache:vm:tx:before", event);
                });
                miner.on("ganache:vm:tx:step", event => {
                    if (!__classPrivateFieldGet(this, _Blockchain_emitStepEvent, "f"))
                        return;
                    this.emit("ganache:vm:tx:step", event);
                });
                miner.on("ganache:vm:tx:after", event => {
                    this.emit("ganache:vm:tx:after", event);
                });
                miner.on("ganache:vm:tx:console.log", event => {
                    options.logging.logger.log(...event.logs);
                    this.emit("ganache:vm:tx:console.log", event);
                });
                //#endregion
                //#region automatic mining
                const nullResolved = Promise.resolve(null);
                const mineAll = (maxTransactions, onlyOneBlock) => __classPrivateFieldGet(this, _Blockchain_isPaused, "f").call(this)
                    ? nullResolved
                    : this.mine(maxTransactions, onlyOneBlock);
                if (instamine) {
                    // insta mining
                    // whenever the transaction pool is drained mine the txs into blocks
                    // only one transaction should be added per block
                    txPool.on("drain", mineAll.bind(null, miner_1.Capacity.Single));
                }
                else {
                    // interval mining
                    const wait = () => (__classPrivateFieldSet(this, _Blockchain_timer, setTimeout(next, minerOpts.blockTime * 1e3), "f"));
                    // when interval mining, only one block should be mined. the block
                    // can, however, be filled
                    const next = () => {
                        mineAll(miner_1.Capacity.FillBlock, true).then(wait);
                    };
                    wait();
                }
                //#endregion
                miner.on("block", __classPrivateFieldGet(this, _Blockchain_handleNewBlockData, "f"));
                this.once("stop").then(() => miner.clearListeners());
            }
        }
        catch (e) {
            // we failed to start up :-( bail!
            __classPrivateFieldSet(this, _Blockchain_state, Status.stopping, "f");
            // ignore errors while stopping here, since we are already in an
            // exceptional case
            await this.stop().catch(_ => { });
            throw e;
        }
        __classPrivateFieldSet(this, _Blockchain_state, Status.started, "f");
        this.emit("ready");
    }
    getMixHash(data) {
        // mixHash is used as an RNG post merge hardfork
        return this.isPostMerge ? (0, utils_1.keccak)(data) : utils_1.BUFFER_32_ZERO;
    }
    pause() {
        __classPrivateFieldSet(this, _Blockchain_state, __classPrivateFieldGet(this, _Blockchain_state, "f") | Status.paused, "f");
    }
    resume(_threads = 1) {
        if (!__classPrivateFieldGet(this, _Blockchain_isPaused, "f").call(this)) {
            __classPrivateFieldGet(this, _Blockchain_options, "f").logging.logger.log("Warning: startMining called when miner was already started");
            return;
        }
        // toggles the `paused` bit
        __classPrivateFieldSet(this, _Blockchain_state, __classPrivateFieldGet(this, _Blockchain_state, "f") ^ Status.paused, "f");
        // if we are instamining mine a block right away
        if (__classPrivateFieldGet(this, _Blockchain_instamine, "f")) {
            return this.mine(miner_1.Capacity.FillBlock);
        }
    }
    /**
     * @param milliseconds - the number of milliseconds to adjust the time by.
     * Negative numbers are treated as 0.
     * @returns the total time offset *in milliseconds*
     */
    increaseTime(milliseconds) {
        if (milliseconds < 0) {
            milliseconds = 0;
        }
        return (__classPrivateFieldSet(this, _Blockchain_timeAdjustment, __classPrivateFieldGet(this, _Blockchain_timeAdjustment, "f") + milliseconds, "f"));
    }
    /**
     * Adjusts the internal time adjustment such that the provided time is considered the "current" time.
     * @param newTime - the time (in milliseconds) that will be considered the "current" time
     * @returns the total time offset *in milliseconds*
     */
    setTimeDiff(newTime) {
        // when using clock time use Date.now(), otherwise use the timestamp of the
        // current latest block
        const currentTime = __classPrivateFieldGet(this, _Blockchain_options, "f").miner.timestampIncrement === "clock"
            ? Date.now()
            : this.blocks.latest.header.timestamp.toNumber() * 1000;
        return (__classPrivateFieldSet(this, _Blockchain_timeAdjustment, newTime - currentTime, "f"));
    }
    snapshot() {
        const snapshots = __classPrivateFieldGet(this, _Blockchain_snapshots, "f");
        const snaps = snapshots.snaps;
        // Subscription ids are based on the number of active snapshots. Weird? Yes.
        // But it's the way it's been since the beginning so it just hasn't been
        // changed. Feel free to change it so ids are unique if it bothers you
        // enough.
        const id = snaps.push({
            block: this.blocks.latest,
            timeAdjustment: __classPrivateFieldGet(this, _Blockchain_timeAdjustment, "f")
        });
        // start listening to new blocks if this is the first snapshot
        if (id === 1) {
            snapshots.unsubscribeFromBlocks = this.on("block", block => {
                snapshots.blocks = {
                    current: block.hash().toBuffer(),
                    next: snapshots.blocks
                };
            });
        }
        __classPrivateFieldGet(this, _Blockchain_options, "f").logging.logger.log("Saved snapshot #" + id);
        return id;
    }
    async revert(snapshotId) {
        if (snapshotId.isNull()) {
            throw new Error("invalid snapshotId");
        }
        const rawValue = snapshotId.toBigInt();
        __classPrivateFieldGet(this, _Blockchain_options, "f").logging.logger.log("Reverting to snapshot #" + snapshotId);
        const snapshots = __classPrivateFieldGet(this, _Blockchain_snapshots, "f");
        const snaps = snapshots.snaps;
        const snapshotIndex = Number(rawValue - 1n);
        const snapshot = snaps[snapshotIndex];
        if (!snapshot) {
            return false;
        }
        // pause processing new transactions...
        await this.transactions.pause();
        // then pause the miner, too.
        await __classPrivateFieldGet(this, _Blockchain_miner, "f").pause();
        // wait for anything in the process of being saved to finish up
        await __classPrivateFieldGet(this, _Blockchain_blockBeingSavedPromise, "f");
        // Pending transactions are always removed when you revert, even if they
        // were present before the snapshot was created. Ideally, we'd remove only
        // the new transactions.. but we'll leave that for another day.
        this.transactions.clear();
        const blocks = this.blocks;
        const currentHash = blocks.latest.hash().toBuffer();
        const snapshotBlock = snapshot.block;
        const snapshotHeader = snapshotBlock.header;
        const snapshotHash = snapshotBlock.hash().toBuffer();
        // remove this and all stored snapshots after this snapshot
        snaps.splice(snapshotIndex);
        // if there are no more listeners, stop listening to new blocks
        if (snaps.length === 0) {
            snapshots.unsubscribeFromBlocks();
        }
        // if the snapshot's hash is different than the latest block's hash we've
        // got new blocks to clean up.
        if (!currentHash.equals(snapshotHash)) {
            // if we've added blocks since we snapshotted we need to delete them and put
            // some things back the way they were.
            const blockPromises = [];
            let blockList = snapshots.blocks;
            while (blockList !== null) {
                if (blockList.current.equals(snapshotHash))
                    break;
                blockPromises.push(blocks.getByHash(blockList.current));
                blockList = blockList.next;
            }
            snapshots.blocks = blockList;
            const blockData = await Promise.all(blockPromises);
            await __classPrivateFieldGet(this, _Blockchain_deleteBlockData, "f").call(this, blockData, snapshotHeader.number.toBuffer());
            setStateRootSync(this.vm.stateManager, snapshotHeader.stateRoot.toBuffer());
            blocks.latest = snapshotBlock;
        }
        // put our time adjustment back
        __classPrivateFieldSet(this, _Blockchain_timeAdjustment, snapshot.timeAdjustment, "f");
        // resume mining
        __classPrivateFieldGet(this, _Blockchain_miner, "f").resume();
        // resume processing transactions
        this.transactions.resume();
        return true;
    }
    async queueTransaction(transaction, secretKey) {
        // NOTE: this.transactions.add *must* be awaited before returning the
        // `transaction.hash()`, as the transactionPool may change the transaction
        // (and thus its hash!)
        // It may also throw Errors that must be returned to the caller.
        const isExecutable = (await this.transactions.add(transaction, secretKey)) === true;
        if (isExecutable) {
            process.nextTick(this.emit.bind(this), "pendingTransaction", transaction);
        }
        const hash = transaction.hash;
        if (__classPrivateFieldGet(this, _Blockchain_isPaused, "f").call(this) || !__classPrivateFieldGet(this, _Blockchain_instamine, "f")) {
            return hash;
        }
        else {
            if (__classPrivateFieldGet(this, _Blockchain_instamine, "f") && __classPrivateFieldGet(this, _Blockchain_options, "f").miner.instamine === "eager") {
                // in eager instamine mode we must wait for the transaction to be saved
                // before we can return the hash
                const { status, error } = await transaction.once("finalized");
                // in eager instamine mode we must throw on all rejected transaction
                // errors. We must also throw on `confirmed` transactions when
                // vmErrorsOnRPCResponse is enabled.
                if (error &&
                    (status === "rejected" || __classPrivateFieldGet(this, _Blockchain_options, "f").chain.vmErrorsOnRPCResponse))
                    throw error;
            }
            return hash;
        }
    }
    async simulateTransaction(transaction, parentBlock, overrides) {
        let result;
        const data = transaction.data;
        let gasLimit = transaction.gas.toBigInt();
        // subtract out the transaction's base fee from the gas limit before
        // simulating the tx, because `runCall` doesn't account for raw gas costs.
        const hasToAddress = transaction.to != null;
        const to = hasToAddress ? new ethereum_address_1.Address(transaction.to.toBuffer()) : null;
        const common = this.fallback
            ? this.fallback.getCommonForBlockNumber(this.common, BigInt(transaction.block.header.number.toString()))
            : this.common;
        const gasLeft = gasLimit - (0, ethereum_transaction_1.calculateIntrinsicGas)(data, hasToAddress, common);
        const transactionContext = {};
        this.emit("ganache:vm:tx:before", {
            context: transactionContext
        });
        if (gasLeft >= 0n) {
            const stateTrie = this.trie.copy(false);
            stateTrie.setContext(parentBlock.header.stateRoot.toBuffer(), null, parentBlock.header.number);
            const options = __classPrivateFieldGet(this, _Blockchain_options, "f");
            const vm = await this.createVmFromStateTrie(stateTrie, options.chain.allowUnlimitedContractSize, false, // precompiles have already been initialized in the stateTrie
            common);
            // take a checkpoint so the `runCall` never writes to the trie. We don't
            // commit/revert later because this stateTrie is ephemeral anyway.
            await vm.eei.checkpoint();
            vm.evm.events.on("step", (event) => {
                const logs = (0, console_log_1.maybeGetLogs)(event);
                if (logs) {
                    options.logging.logger.log(...logs);
                    this.emit("ganache:vm:tx:console.log", {
                        context: transactionContext,
                        logs
                    });
                }
                if (!__classPrivateFieldGet(this, _Blockchain_emitStepEvent, "f"))
                    return;
                const ganacheStepEvent = (0, provider_events_1.makeStepEvent)(transactionContext, event);
                this.emit("ganache:vm:tx:step", ganacheStepEvent);
            });
            const caller = transaction.from.toBuffer();
            const callerAddress = new ethereum_address_1.Address(caller);
            if (common.isActivatedEIP(2929)) {
                const eei = vm.eei;
                // handle Berlin hardfork warm storage reads
                (0, precompiles_1.warmPrecompiles)(eei);
                eei.addWarmedAddress(caller);
                if (to)
                    eei.addWarmedAddress(to.buf);
            }
            // If there are any overrides requested for eth_call, apply
            // them now before running the simulation.
            await (0, run_call_1.applySimulationOverrides)(stateTrie, vm, overrides);
            // we need to update the balance and nonce of the sender _before_
            // we run this transaction so that things that rely on these values
            // are correct (like contract creation!).
            const fromAccount = await vm.eei.getAccount(callerAddress);
            fromAccount.nonce += 1n;
            const txCost = gasLimit * transaction.gasPrice.toBigInt();
            const startBalance = fromAccount.balance;
            // TODO: should we throw if insufficient funds?
            fromAccount.balance = txCost > startBalance ? 0n : startBalance - txCost;
            await vm.eei.putAccount(callerAddress, fromAccount);
            // finally, run the call
            result = await vm.evm.runCall({
                caller: callerAddress,
                data: transaction.data && transaction.data.toBuffer(),
                gasPrice: transaction.gasPrice.toBigInt(),
                gasLimit: gasLeft,
                to,
                value: transaction.value == null ? 0n : transaction.value.toBigInt(),
                block: transaction.block
            });
        }
        else {
            result = {
                execResult: {
                    runState: { programCounter: 0 },
                    exceptionError: new evm_1.EvmError(evm_1.EvmErrorMessage.OUT_OF_GAS),
                    returnValue: utils_1.BUFFER_EMPTY
                }
            };
        }
        this.emit("ganache:vm:tx:after", {
            context: transactionContext
        });
        if (result.execResult.exceptionError) {
            throw new ethereum_utils_1.CallError(result);
        }
        else {
            return utils_1.Data.from(result.execResult.returnValue || "0x");
        }
    }
    /**
     * traceTransaction
     *
     * Run a previously-run transaction in the same state in which it occurred at the time it was run.
     * This will return the vm-level trace output for debugging purposes.
     *
     * Strategy:
     *
     *  1. Find block where transaction occurred
     *  2. Set state root of that block
     *  3. Rerun every transaction in that block prior to and including the requested transaction
     *  4. Send trace results back.
     *
     * @param transactionHash -
     * @param options -
     */
    async traceTransaction(transactionHash, options) {
        const transactionHashBuffer = utils_1.Data.toBuffer(transactionHash);
        // #1 - get block via transaction object
        const transaction = await this.transactions.get(transactionHashBuffer);
        if (!transaction) {
            throw new Error("Unknown transaction " + transactionHash);
        }
        const targetBlock = await this.blocks.getByHash(transaction.blockHash.toBuffer());
        const parentBlock = await this.blocks.getByHash(targetBlock.header.parentHash.toBuffer());
        const newBlock = __classPrivateFieldGet(this, _Blockchain_prepareNextBlock, "f").call(this, targetBlock, parentBlock, transactionHashBuffer);
        // #2 - Set state root of original block
        //
        // TODO: Forking needs the forked block number passed during this step:
        // https://github.com/trufflesuite/ganache/blob/develop/lib/blockchain_double.js#L917
        const trie = this.trie.copy();
        trie.setContext(parentBlock.header.stateRoot.toBuffer(), null, parentBlock.header.number);
        // #3 - Rerun every transaction in block prior to and including the requested transaction
        const { gas, structLogs, returnValue, storage } = await __classPrivateFieldGet(this, _Blockchain_traceTransaction, "f").call(this, newBlock.transactions[transaction.index.toNumber()], trie, newBlock, options);
        // #4 - Send results back
        return { gas, structLogs, returnValue, storage };
    }
    /**
     * storageRangeAt
     *
     * Returns a contract's storage given a starting key and max number of
     * entries to return.
     *
     * Strategy:
     *
     *  1. Find block where transaction occurred
     *  2. Set state root of that block
     *  3. Use contract address storage trie to get the storage keys from the transaction
     *  4. Sort and filter storage keys using the startKey and maxResult
     *  5. Rerun every transaction in that block prior to and including the requested transaction
     *  6. Send storage results back
     *
     * @param blockHash -
     * @param txIndex -
     * @param contractAddress -
     * @param startKey -
     * @param maxResult -
     */
    async storageRangeAt(blockHash, txIndex, contractAddress, startKey, maxResult) {
        // #1 - get block information
        const targetBlock = await this.blocks.getByHash(blockHash);
        // get transaction using txIndex
        const transactions = targetBlock.getTransactions();
        const transaction = transactions[txIndex];
        if (!transaction) {
            throw new Error(`transaction index ${txIndex} is out of range for block ${blockHash}`);
        }
        // #2 - set state root of block
        const parentBlock = await this.blocks.getByHash(targetBlock.header.parentHash.toBuffer());
        const trie = makeTrie(this, __classPrivateFieldGet(this, _Blockchain_database, "f").trie, parentBlock.header.stateRoot);
        // get the contractAddress account storage trie
        const contractAddressBuffer = ethereum_address_1.Address.from(contractAddress).toBuffer();
        const addressData = await trie.get(contractAddressBuffer);
        if (!addressData) {
            throw new Error(`account ${contractAddress} doesn't exist`);
        }
        // #3 - use the contractAddress storage trie to get relevant hashed keys
        const getStorageKeys = () => {
            const storageTrie = trie.copy(false);
            // An address's stateRoot is stored in the 3rd rlp entry
            storageTrie.setContext((0, rlp_1.decode)(addressData)[2], contractAddressBuffer, parentBlock.header.number);
            return new Promise((resolve, reject) => {
                const startKeyBuffer = utils_1.Data.toBuffer(startKey);
                const compare = (a, b) => a.compare(b) < 0;
                const keys = [];
                const handleData = ({ key }) => {
                    // ignore anything that comes before our starting point
                    if (startKeyBuffer.compare(key) > 0)
                        return;
                    // #4 - sort and filter keys
                    // insert the key exactly where it needs to go in the array
                    const position = (0, utils_1.findInsertPosition)(keys, key, compare);
                    // ignore if the value couldn't possibly be relevant
                    if (position > maxResult)
                        return;
                    keys.splice(position, 0, key);
                };
                const handleEnd = () => {
                    if (keys.length > maxResult) {
                        // we collected too much data, so we've got to trim it a bit
                        resolve({
                            // only take the maximum number of entries requested
                            keys: keys.slice(0, maxResult),
                            // assign nextKey
                            nextKey: utils_1.Data.from(keys[maxResult])
                        });
                    }
                    else {
                        resolve({
                            keys,
                            nextKey: null
                        });
                    }
                };
                const rs = storageTrie.createReadStream();
                rs.on("data", handleData).on("error", reject).on("end", handleEnd);
            });
        };
        const { keys, nextKey } = await getStorageKeys();
        // #5 -  rerun every transaction in that block prior to and including the requested transaction
        // prepare block to be run in traceTransaction
        const transactionHashBuffer = transaction.hash.toBuffer();
        const newBlock = __classPrivateFieldGet(this, _Blockchain_prepareNextBlock, "f").call(this, targetBlock, parentBlock, transactionHashBuffer);
        // get storage data given a set of keys
        const options = {
            disableMemory: true,
            disableStack: true,
            disableStorage: false
        };
        const { storage } = await __classPrivateFieldGet(this, _Blockchain_traceTransaction, "f").call(this, newBlock.transactions[transaction.index.toNumber()], trie, newBlock, options, keys, contractAddressBuffer);
        // #6 - send back results
        return {
            storage,
            nextKey
        };
    }
    toggleStepEvent(enable) {
        __classPrivateFieldSet(this, _Blockchain_emitStepEvent, enable, "f");
        __classPrivateFieldGet(this, _Blockchain_miner, "f").toggleStepEvent(enable);
    }
    /**
     * Gracefully shuts down the blockchain service and all of its dependencies.
     */
    async stop() {
        // If the blockchain is still initializing we don't want to shut down
        // yet because there may still be database calls in flight. Leveldb may
        // cause a segfault due to a race condition between a db write and the close
        // call.
        if (__classPrivateFieldGet(this, _Blockchain_state, "f") === Status.starting) {
            await this.once("ready");
        }
        __classPrivateFieldSet(this, _Blockchain_state, Status.stopping, "f");
        // stop the polling miner, if necessary
        clearTimeout(__classPrivateFieldGet(this, _Blockchain_timer, "f"));
        // clean up listeners
        if (this.vm) {
            this.vm.events.removeAllListeners();
            this.vm.evm && this.vm.evm.events.removeAllListeners();
        }
        // pause processing new transactions...
        this.transactions && (await this.transactions.pause());
        // then pause the miner, too.
        __classPrivateFieldGet(this, _Blockchain_miner, "f") && (await __classPrivateFieldGet(this, _Blockchain_miner, "f").pause());
        // wait for anything in the process of being saved to finish up
        await __classPrivateFieldGet(this, _Blockchain_blockBeingSavedPromise, "f");
        this.fallback && (await this.fallback.close());
        await this.emit("stop");
        __classPrivateFieldGet(this, _Blockchain_database, "f") && (await __classPrivateFieldGet(this, _Blockchain_database, "f").close());
        __classPrivateFieldSet(this, _Blockchain_state, Status.stopped, "f");
    }
}
exports.default = Blockchain;
_Blockchain_state = new WeakMap(), _Blockchain_miner = new WeakMap(), _Blockchain_blockBeingSavedPromise = new WeakMap(), _Blockchain_timer = new WeakMap(), _Blockchain_emitStepEvent = new WeakMap(), _Blockchain_database = new WeakMap(), _Blockchain_options = new WeakMap(), _Blockchain_instamine = new WeakMap(), _Blockchain_saveNewBlock = new WeakMap(), _Blockchain_emitNewBlock = new WeakMap(), _Blockchain_getTransactionLogOutput = new WeakMap(), _Blockchain_handleNewBlockData = new WeakMap(), _Blockchain_readyNextBlock = new WeakMap(), _Blockchain_isPaused = new WeakMap(), _Blockchain_commitAccounts = new WeakMap(), _Blockchain_initializeGenesisBlock = new WeakMap(), _Blockchain_timeAdjustment = new WeakMap(), _Blockchain_adjustedTime = new WeakMap(), _Blockchain_deleteBlockData = new WeakMap(), _Blockchain_snapshots = new WeakMap(), _Blockchain_traceTransaction = new WeakMap(), _Blockchain_prepareNextBlock = new WeakMap();
//# sourceMappingURL=blockchain.js.map