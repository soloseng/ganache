import { Connector as EthereumConnector, EthereumProvider } from "@ganache/ethereum";
export type { EthereumProvider, Ethereum } from "@ganache/ethereum";
export type { FilecoinProvider } from "@ganache/filecoin";
import type { FilecoinConnector, FilecoinProvider } from "@ganache/filecoin";
import { EthereumProviderOptions, EthereumLegacyProviderOptions } from "@ganache/ethereum-options";
import { FilecoinProviderOptions, FilecoinLegacyProviderOptions } from "@ganache/filecoin-options";
import "@ganache/options";
import { Executor } from "@ganache/utils";
export declare const EthereumFlavorName = "ethereum";
export declare const FilecoinFlavorName = "filecoin";
export declare const DefaultFlavor = "ethereum";
export declare const DefaultOptionsByName: {
    ethereum: import("@ganache/options").Defaults<{
        chain: import("@ganache/ethereum-options").ChainConfig;
        database: import("@ganache/ethereum-options").DatabaseConfig;
        logging: import("@ganache/ethereum-options").LoggingConfig;
        miner: import("@ganache/ethereum-options").MinerConfig;
        wallet: import("@ganache/ethereum-options").WalletConfig;
        fork: import("@ganache/ethereum-options").ForkConfig;
    }>;
    filecoin: import("@ganache/options").Defaults<{
        chain: import("@ganache/filecoin-options/typings/src/chain-options").ChainConfig;
        database: import("@ganache/filecoin-options/typings/src/database-options").DatabaseConfig;
        logging: import("@ganache/filecoin-options/typings/src/logging-options").LoggingConfig;
        miner: import("@ganache/filecoin-options/typings/src/miner-options").MinerConfig;
        wallet: import("@ganache/filecoin-options/typings/src/wallet-options").WalletConfig;
    }>;
};
export declare type ConnectorsByName = {
    [EthereumFlavorName]: EthereumConnector;
    [FilecoinFlavorName]: FilecoinConnector;
};
export declare type OptionsByName = {
    [EthereumFlavorName]: EthereumProviderOptions;
    [FilecoinFlavorName]: FilecoinProviderOptions;
};
export declare type FlavorName = keyof ConnectorsByName;
export declare type Connector = {
    [K in FlavorName]: ConnectorsByName[K];
}[FlavorName];
export declare function GetConnector<Flavor extends FlavorName>(flavor: Flavor, providerOptions: FlavorOptions<typeof flavor>, executor: Executor): ConnectorsByName[Flavor];
/**
 * @public
 */
export declare type Provider = EthereumProvider | FilecoinProvider;
declare type EthereumOptions<T = "ethereum"> = {
    flavor?: T;
} & (EthereumProviderOptions | EthereumLegacyProviderOptions);
declare type FilecoinOptions<T = "filecoin"> = {
    flavor: T;
} & (FilecoinProviderOptions | FilecoinLegacyProviderOptions);
export declare type FlavorOptions<T extends "filecoin" | "ethereum"> = T extends "filecoin" ? FilecoinOptions<T> : T extends "ethereum" ? EthereumOptions<T> : never;
//# sourceMappingURL=index.d.ts.map