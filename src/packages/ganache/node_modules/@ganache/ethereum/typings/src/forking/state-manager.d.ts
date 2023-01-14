/// <reference types="node" />
import { Address as EJS_Address } from "@ethereumjs/util";
import { DefaultStateManager as StateManager } from "@ethereumjs/statemanager";
import { ForkCache } from "./cache";
import { ForkTrie } from "./trie";
/**
 * Options for constructing a [[StateManager]].
 */
export interface DefaultStateManagerOpts {
    /**
     * An [`@ethereumjs/trie`](https://github.com/ethereumjs/ethereumjs-monorepo/tree/master/packages/trie) instance
     */
    trie: ForkTrie;
    /**
     * Enables code hash prefixing, which is used by `ethereumjs/statemanager` to
     * [distinguish between a contract deployed with code `0x80` and
     * `RLP([])`](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/statemanager/src/stateManager.ts#L40)
     */
    prefixCodeHashes?: boolean;
}
/**
 * Interface for getting and setting data from an underlying
 * state trie.
 */
export declare class ForkStateManager extends StateManager {
    _cache: ForkCache;
    readonly prefixCodeHashes: boolean;
    /**
     * Instantiate the StateManager interface.
     */
    constructor(opts: DefaultStateManagerOpts);
    /**
     * Copies the current instance of the `StateManager`
     * at the last fully committed point, i.e. as if all current
     * checkpoints were reverted.
     */
    copy(): StateManager;
    /**
     * Creates a storage trie from the primary storage trie
     * for an account and saves this in the storage cache.
     * @private
     */
    _lookupStorageTrie(address: EJS_Address): Promise<ForkTrie>;
    /**
     * Gets the storage value associated with the provided `address` and `key`.
     * This method returns the shortest representation of the stored value.
     * @param address - Address of the account to get the storage for
     * @param key - Key in the account's storage to get the value for. Must be 32
     * bytes long.
     * @returns {Promise<Buffer>} - The storage value for the account
     * corresponding to the provided address at the provided key. If this does not
     * exist an empty `Buffer` is returned.
     */
    getContractStorage(address: EJS_Address, key: Buffer): Promise<Buffer>;
}
//# sourceMappingURL=state-manager.d.ts.map