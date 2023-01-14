/// <reference types="node" />
import { Data, Quantity } from "@ganache/utils";
import { Address } from "@ganache/ethereum-address";
import type { Common } from "@ethereumjs/common";
import { EncodedPart } from "@ganache/rlp";
import { RuntimeTransaction } from "./runtime-transaction";
import { Transaction } from "./rpc-transaction";
import { EIP2930AccessListDatabasePayload, GanacheRawExtraTx, LegacyDatabasePayload, TypedDatabaseTransaction } from "./raw";
import { Capability, LegacyTransactionJSON } from "./transaction-types";
export declare class LegacyTransaction extends RuntimeTransaction {
    gasPrice: Quantity;
    type: Quantity;
    constructor(data: LegacyDatabasePayload | Transaction, common: Common, extra?: GanacheRawExtraTx);
    maxGasPrice(): Quantity;
    toJSON(common?: Common): LegacyTransactionJSON;
    static fromTxData(data: LegacyDatabasePayload | Transaction, common: Common, extra?: GanacheRawExtraTx): LegacyTransaction;
    static fromEIP2930AccessListTransaction(data: EIP2930AccessListDatabasePayload | Transaction, common: Common): LegacyTransaction;
    toVmTransaction(): {
        hash: () => Buffer;
        nonce: bigint;
        gasPrice: bigint;
        gasLimit: bigint;
        to: Address;
        value: bigint;
        data: Buffer;
        getSenderAddress: () => Address;
        /**
         * the minimum amount of gas the tx must have (DataFee + TxFee + Creation Fee)
         */
        getBaseFee: () => bigint;
        getUpfrontCost: () => bigint;
        supports: (capability: Capability) => boolean;
    };
    /**
     * sign a transaction with a given private key, then compute and set the `hash`.
     *
     * @param privateKey - Must be 32 bytes in length
     */
    signAndHash(privateKey: Buffer): void;
    toEthRawTransaction(v: Buffer, r: Buffer, s: Buffer): LegacyDatabasePayload;
    computeIntrinsics(v: Quantity, raw: TypedDatabaseTransaction, chainId: bigint): {
        from: Address;
        hash: Data;
        serialized: Buffer;
        encodedData: EncodedPart;
        encodedSignature: EncodedPart;
    };
    updateEffectiveGasPrice(): void;
}
//# sourceMappingURL=legacy-transaction.d.ts.map