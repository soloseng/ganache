import type * as EthSigUtil from "eth-sig-util";
import type * as TransactionTypes from "@ganache/ethereum-transaction";
import type * as UtilTypes from "@ganache/ethereum-utils";
import type { EthereumProvider, Externalize } from "./provider";
import { BlockHeader } from "@ganache/ethereum-block";
import { Data, Quantity } from "@ganache/utils";
import { CallOverrides } from "./helpers/run-call";
import { Log, InternalTag } from "@ganache/ethereum-utils";
declare type EthSignedDataParams = Parameters<typeof EthSigUtil.signTypedData_v4>[1]["data"];
declare type AsCall<T> = Flatten<Omit<T, "from"> & {
    readonly from?: string;
}>;
declare type AsPooled<T> = Flatten<Omit<T, "blockNumber" | "blockHash" | "transactionIndex"> & {
    blockNumber: null;
    blockHash: null;
    transactionIndex: null;
}>;
declare type PublicPrivate = "public" | "private";
/**
 * Since our types come from all over the place and get smushed together and
 * pulled apart, we "Flatten" (there is probably a
 * better word) these type complexities by using a TypeScript trick:
 * `Pick<T, keyof T>`. This picks all the keys (and their values) from T,
 * resulting in the same type shape, but the intermediate types are all skipped
 * and intersections are simplified.
 *
 * ```
 * type SomeTypes = {prop: string, prop2: number};
 * type Thing = Omit<SomeTypes, "prop2"> & {addProp: true};
 * ```
 * gets turned into
 * ```
 * type Thing = {prop: string, addProp: true}
 * ```
 */
declare type Flatten<T> = Pick<T, keyof T>;
/** Public types */
export declare namespace Ethereum {
    type Provider = EthereumProvider;
    type Tag = keyof typeof InternalTag;
    type TraceTransactionOptions = UtilTypes.TraceTransactionOptions;
    type TraceTransactionResult<P extends PublicPrivate = "public"> = P extends "public" ? Externalize<TraceTransactionResult<"private">> : UtilTypes.TraceTransactionResult;
    type StorageRangeAtResult<P extends PublicPrivate = "public"> = P extends "public" ? Externalize<StorageRangeAtResult<"private">> : UtilTypes.StorageRangeAtResult;
    type SubscriptionOptions = UtilTypes.BaseFilterArgs;
    type LogsFilter = UtilTypes.FilterArgs;
    type Filter = UtilTypes.RangeFilterArgs;
    type SubscriptionName = UtilTypes.SubscriptionName;
    type SubscriptionId = UtilTypes.SubscriptionId;
    type Logs = Log[];
    namespace Transaction {
        type Legacy = Flatten<TransactionTypes.LegacyRpcTransaction>;
        type EIP1559 = Flatten<TransactionTypes.EIP1559FeeMarketRpcTransaction>;
        type EIP2930 = Flatten<TransactionTypes.EIP2930AccessListRpcTransaction>;
        /**
         * Transaction receipt returned from `eth_getTransactionReceipt`
         */
        type Receipt<P extends PublicPrivate = "public"> = P extends "public" ? Externalize<Transaction.Receipt<"private">> : TransactionTypes.TransactionReceipt;
    }
    /**
     * Transaction types sent to `eth_sendTransaction` and
     * `personal_sendTransaction`
     */
    type Transaction = Ethereum.Transaction.Legacy | Ethereum.Transaction.EIP1559 | Ethereum.Transaction.EIP2930;
    namespace Call {
        namespace Transaction {
            type Legacy = AsCall<Ethereum.Transaction.Legacy>;
            type EIP1559 = AsCall<Ethereum.Transaction.EIP1559>;
            type EIP2930 = AsCall<Ethereum.Transaction.EIP2930>;
        }
        type Transaction = Ethereum.Call.Transaction.Legacy | Ethereum.Call.Transaction.EIP1559 | Ethereum.Call.Transaction.EIP2930;
        type Overrides = CallOverrides;
    }
    namespace Pool {
        namespace Transaction {
            type Legacy = AsPooled<Ethereum.Block.Transaction.Legacy>;
            type EIP1559 = AsPooled<Ethereum.Block.Transaction.EIP1559>;
            type EIP2930 = AsPooled<Ethereum.Block.Transaction.EIP2930>;
        }
        /**
         * Pending and Executable transactions that are still in the transaction pool
         * and do not yet have a blockNumber, blockHash, and transactionIndex.
         */
        type Transaction<P extends PublicPrivate = "public"> = AsPooled<Ethereum.Block.Transaction<P>>;
        type Content<P extends PublicPrivate = "public"> = {
            pending: Record<string, Record<string, Ethereum.Pool.Transaction<P>>>;
            queued: Record<string, Record<string, Ethereum.Pool.Transaction<P>>>;
        };
    }
    namespace Block {
        type Header<P extends PublicPrivate = "public"> = P extends "public" ? Externalize<Ethereum.Block.Header<"private">> : BlockHeader;
        namespace Transaction {
            type Legacy = Externalize<TransactionTypes.LegacyTransactionJSON>;
            type EIP2930 = Externalize<TransactionTypes.EIP2930AccessListTransactionJSON>;
            type EIP1559 = Externalize<TransactionTypes.EIP1559FeeMarketTransactionJSON>;
        }
        type Transaction<P extends PublicPrivate = "public"> = P extends "public" ? Externalize<Ethereum.Block.Transaction<"private">> : TransactionTypes.LegacyTransactionJSON | TransactionTypes.EIP2930AccessListTransactionJSON | TransactionTypes.EIP1559FeeMarketTransactionJSON;
    }
    /**
     * A Block as it is returned from eth_getBlockByNumber and eth_getBlockByHash.
     */
    type Block<IncludeTransactions extends boolean = true | false, P extends PublicPrivate = "public"> = P extends "public" ? Externalize<Ethereum.Block<IncludeTransactions, "private">> : {
        hash: Data;
        size: Quantity;
        transactions: IncludeTransactions extends true ? (Ethereum.Block.Transaction<P> | Ethereum.Pool.Transaction<P>)[] : Data[];
        uncles: Data[];
    } & Ethereum.Block.Header<P>;
    type MineOptions = {
        timestamp?: number;
        blocks?: number;
    };
    type TypedData = Exclude<EthSignedDataParams, EthSigUtil.TypedData>;
    type WhisperPostObject = UtilTypes.WhisperPostObject;
    type FeeHistory<P extends PublicPrivate = "public"> = P extends "public" ? Externalize<FeeHistory<"private">> : UtilTypes.FeeHistory;
    type AccountProof<P extends PublicPrivate = "public"> = P extends "public" ? Externalize<AccountProof<"private">> : UtilTypes.AccountProof;
}
export {};
//# sourceMappingURL=api-types.d.ts.map