/// <reference types="node" />
import { Data, Quantity } from "@ganache/utils";
import { Address } from "@ganache/ethereum-address";
import type { Common } from "@ethereumjs/common";
import { Transaction } from "./rpc-transaction";
import { RuntimeTransaction } from "./runtime-transaction";
import { EIP1559FeeMarketDatabasePayload, EIP1559FeeMarketDatabaseTx, GanacheRawExtraTx, TypedDatabaseTransaction } from "./raw";
import { AccessList, AccessListBuffer } from "./access-lists";
import { Capability, EIP1559FeeMarketTransactionJSON } from "./transaction-types";
export declare class EIP1559FeeMarketTransaction extends RuntimeTransaction {
    chainId: Quantity;
    maxPriorityFeePerGas: Quantity;
    maxFeePerGas: Quantity;
    accessList: AccessListBuffer;
    accessListJSON: AccessList;
    accessListDataFee: bigint;
    type: Quantity;
    constructor(data: EIP1559FeeMarketDatabasePayload | Transaction, common: Common, extra?: GanacheRawExtraTx);
    maxGasPrice(): Quantity;
    toJSON(_common?: Common): EIP1559FeeMarketTransactionJSON;
    static fromTxData(data: EIP1559FeeMarketDatabasePayload | Transaction, common: Common, extra?: GanacheRawExtraTx): EIP1559FeeMarketTransaction;
    toVmTransaction(): {
        hash: () => Buffer;
        nonce: bigint;
        maxPriorityFeePerGas: bigint;
        maxFeePerGas: bigint;
        gasLimit: bigint;
        to: Address;
        value: bigint;
        data: Buffer;
        AccessListJSON: AccessList;
        getSenderAddress: () => Address;
        /**
         * the minimum amount of gas the tx must have (DataFee + TxFee + Creation Fee)
         */
        getBaseFee: () => bigint;
        getUpfrontCost: (baseFee?: bigint) => bigint;
        supports: (capability: Capability) => boolean;
    };
    /**
     * sign a transaction with a given private key, then compute and set the `hash`.
     *
     * @param privateKey - Must be 32 bytes in length
     */
    signAndHash(privateKey: Buffer): void;
    toEthRawTransaction(v: Buffer, r: Buffer, s: Buffer): EIP1559FeeMarketDatabaseTx;
    computeIntrinsics(v: Quantity, raw: TypedDatabaseTransaction): {
        from: Address;
        hash: Data;
        serialized: Buffer;
        encodedData: import("@ganache/rlp").EncodedPart;
        encodedSignature: import("@ganache/rlp").EncodedPart;
    };
    updateEffectiveGasPrice(baseFeePerGas: Quantity): void;
}
//# sourceMappingURL=eip1559-fee-market-transaction.d.ts.map