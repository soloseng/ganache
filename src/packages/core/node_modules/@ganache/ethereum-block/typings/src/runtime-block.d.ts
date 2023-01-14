/// <reference types="node" />
import { Data, Quantity } from "@ganache/utils";
import { EthereumRawBlockHeader } from "./serialize";
import { Address } from "@ganache/ethereum-address";
import { Block } from "./block";
import { TypedTransaction } from "@ganache/ethereum-transaction";
import { StorageKeys } from "@ganache/ethereum-utils";
export declare type BlockHeader = {
    parentHash: Data;
    sha3Uncles: Data;
    miner: Data;
    stateRoot: Data;
    transactionsRoot: Data;
    receiptsRoot: Data;
    logsBloom: Data;
    difficulty: Quantity;
    totalDifficulty: Quantity;
    number: Quantity;
    gasLimit: Quantity;
    gasUsed: Quantity;
    timestamp: Quantity;
    extraData: Data;
    mixHash: Data;
    nonce: Data;
    baseFeePerGas?: Quantity;
};
/**
 * Returns the size of the serialized data as it would have been calculated had
 * we stored things geth does, i.e., `totalDifficulty` is not usually stored in
 * the block header.
 *
 * @param serialized -
 * @param totalDifficulty -
 */
export declare function getBlockSize(serialized: Buffer, totalDifficulty: Buffer): number;
export declare function makeHeader(raw: EthereumRawBlockHeader, totalDifficulty: Buffer): BlockHeader;
/**
 * A minimal block that can be used by the EVM to run transactions.
 */
export declare class RuntimeBlock {
    private serializeBaseFeePerGas;
    readonly header: {
        parentHash: Buffer;
        difficulty: bigint;
        totalDifficulty: Buffer;
        coinbase: Address;
        number: bigint;
        gasLimit: bigint;
        gasUsed: bigint;
        timestamp: bigint;
        mixHash: Buffer;
        prevRandao: Buffer;
        baseFeePerGas: bigint | undefined;
    };
    constructor(number: Quantity, parentHash: Data, coinbase: Address, gasLimit: Quantity, gasUsed: Quantity, timestamp: Quantity, difficulty: Quantity, previousBlockTotalDifficulty: Quantity, mixHash: Buffer, baseFeePerGas: bigint | undefined);
    /**
     * Returns the serialization of all block data, the hash of the block header,
     * and a map of the hashed and raw storage keys
     */
    finalize(transactionsTrie: Buffer, receiptTrie: Buffer, bloom: Buffer, stateRoot: Buffer, gasUsed: bigint, extraData: Data, transactions: TypedTransaction[], storageKeys: StorageKeys): {
        block: Block;
        serialized: Buffer;
        storageKeys: StorageKeys;
        transactions: TypedTransaction[];
    };
}
//# sourceMappingURL=runtime-block.d.ts.map