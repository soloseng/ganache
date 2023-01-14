import { EthereumInternalOptions } from "@ganache/ethereum-options";
import { Data, Quantity } from "@ganache/utils";
import { Common } from "@ethereumjs/common";
import { Block } from "@ganache/ethereum-block";
import { Account } from "@ganache/ethereum-utils";
export declare class Fork {
    #private;
    common: Common;
    blockNumber: Quantity;
    stateRoot: Data;
    block: Block;
    chainId: number;
    constructor(options: EthereumInternalOptions, accounts: Account[]);
    initialize(): Promise<void>;
    private initCache;
    request<T = unknown>(method: string, params: unknown[], options?: {
        disableCache: boolean;
    }): Promise<T>;
    abort(): void;
    close(): Promise<void>;
    isValidForkBlockNumber(blockNumber: Quantity): boolean;
    selectValidForkBlockNumber(blockNumber: Quantity): Quantity;
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
    getCommonForBlockNumber(common: Common, blockNumber: BigInt): Common;
}
//# sourceMappingURL=fork.d.ts.map