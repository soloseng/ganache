/// <reference types="node" />
import { RuntimeError, TransactionLog } from "@ganache/ethereum-utils";
import { Data, Quantity } from "@ganache/utils";
import { Transaction } from "./rpc-transaction";
import type { Common } from "@ethereumjs/common";
import { GanacheRawExtraTx, TypedDatabasePayload, TypedDatabaseTransaction } from "./raw";
import type { RunTxResult } from "@ethereumjs/vm";
import { EncodedPart } from "@ganache/rlp";
import { BaseTransaction } from "./base-transaction";
import { InternalTransactionReceipt } from "./transaction-receipt";
import { Address } from "@ganache/ethereum-address";
export declare const toValidLengthAddress: (address: string, fieldName: string) => Address;
export declare const hasPartialSignature: (data: Transaction) => data is Transaction & {
    from?: string;
    v?: string;
    r?: string;
    s?: string;
};
declare type TransactionFinalization = {
    status: "confirmed";
    error?: Error;
} | {
    status: "rejected";
    error: Error;
};
/**
 * A RuntimeTransaction can be changed; its hash is not finalized and it is not
 * yet part of a block.
 */
export declare abstract class RuntimeTransaction extends BaseTransaction {
    hash: Data | null;
    /**
     * used by the miner to mark if this transaction is eligible for reordering or
     * removal
     */
    locked: boolean;
    logs: TransactionLog[];
    receipt: InternalTransactionReceipt;
    execException: RuntimeError;
    raw: TypedDatabaseTransaction | null;
    serialized: Buffer;
    encodedData: EncodedPart;
    encodedSignature: EncodedPart;
    private finalizer;
    private finalized;
    constructor(data: TypedDatabasePayload | Transaction, common: Common, extra?: GanacheRawExtraTx);
    /**
     * sign a transaction with a given private key, then compute and set the `hash`.
     *
     * @param privateKey - Must be 32 bytes in length
     */
    protected abstract signAndHash(privateKey: Buffer): any;
    serializeForDb(blockHash: Data, blockNumber: Quantity, transactionIndex: Quantity): Buffer;
    abstract toJSON(common: Common): any;
    /**
     * Initializes the receipt and logs
     * @param result -
     * @returns RLP encoded data for use in a transaction trie
     */
    fillFromResult(result: RunTxResult, cumulativeGasUsed: bigint): Buffer;
    getReceipt(): InternalTransactionReceipt;
    getLogs(): TransactionLog[];
    validateAndSetSignature: (data: Transaction) => void;
    /**
     * Returns a Promise that is resolved with the confirmation status and, if
     * appropriate, an error property.
     *
     * Note: it is possible to be confirmed AND have an error
     *
     * @param event - "finalized"
     */
    once(_event: "finalized"): Promise<TransactionFinalization>;
    /**
     * Mark this transaction as finalized, notifying all past and future
     * "finalized" event subscribers.
     *
     * Note:
     *
     * @param status -
     * @param error -
     */
    finalize(status: "confirmed" | "rejected", error?: Error): void;
    protected abstract toEthRawTransaction(v: Buffer, r: Buffer, s: Buffer): TypedDatabaseTransaction;
    protected abstract computeIntrinsics(v: Quantity, raw: TypedDatabaseTransaction, chainId: bigint): any;
    protected abstract toVmTransaction(): any;
    protected abstract updateEffectiveGasPrice(baseFeePerGas?: Quantity): any;
}
export {};
//# sourceMappingURL=runtime-transaction.d.ts.map