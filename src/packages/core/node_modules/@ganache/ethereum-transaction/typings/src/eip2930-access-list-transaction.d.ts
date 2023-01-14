/// <reference types="node" />
import { Data, Quantity } from "@ganache/utils";
import { Address } from "@ganache/ethereum-address";
import type { Common } from "@ethereumjs/common";
import { Transaction } from "./rpc-transaction";
import { RuntimeTransaction } from "./runtime-transaction";
import { EIP2930AccessListDatabasePayload, EIP2930AccessListDatabaseTx, GanacheRawExtraTx, TypedDatabaseTransaction } from "./raw";
import { AccessList, AccessListBuffer } from "./access-lists";
import { Capability, EIP2930AccessListTransactionJSON } from "./transaction-types";
export declare class EIP2930AccessListTransaction extends RuntimeTransaction {
    chainId: Quantity;
    accessList: AccessListBuffer;
    accessListJSON: AccessList;
    accessListDataFee: bigint;
    gasPrice: Quantity;
    type: Quantity;
    constructor(data: EIP2930AccessListDatabasePayload | Transaction, common: Common, extra?: GanacheRawExtraTx);
    maxGasPrice(): Quantity;
    toJSON(_common?: Common): EIP2930AccessListTransactionJSON;
    static fromTxData(data: EIP2930AccessListDatabasePayload | Transaction, common: Common, extra?: GanacheRawExtraTx): EIP2930AccessListTransaction;
    toVmTransaction(): {
        hash: () => Buffer;
        nonce: bigint;
        gasPrice: bigint;
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
        getUpfrontCost: () => bigint;
        supports: (capability: Capability) => boolean;
    };
    /**
     * sign a transaction with a given private key, then compute and set the `hash`.
     *
     * @param privateKey - Must be 32 bytes in length
     */
    signAndHash(privateKey: Buffer): void;
    toEthRawTransaction(v: Buffer, r: Buffer, s: Buffer): EIP2930AccessListDatabaseTx;
    computeIntrinsics(v: Quantity, raw: TypedDatabaseTransaction): {
        from: Address;
        hash: Data;
        serialized: Buffer;
        encodedData: import("@ganache/rlp").EncodedPart;
        encodedSignature: import("@ganache/rlp").EncodedPart;
    };
    updateEffectiveGasPrice(): void;
}
//# sourceMappingURL=eip2930-access-list-transaction.d.ts.map