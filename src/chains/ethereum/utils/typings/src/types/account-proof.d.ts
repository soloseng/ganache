import { Address } from "@ganache/ethereum-address";
import { Data, Quantity } from "@ganache/utils";
export declare type StorageProof = {
    key: Data;
    proof: Data[];
    value: Quantity;
};
export declare type AccountProof = {
    address: Address;
    balance: Quantity;
    codeHash: Data;
    nonce: Quantity;
    storageHash: Data;
    accountProof: Data[];
    storageProof: StorageProof[];
};
//# sourceMappingURL=account-proof.d.ts.map