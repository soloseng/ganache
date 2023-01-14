import { FlavorOptions } from "@ganache/flavors";
/**
 * Loads the connector specified by the given `flavor`
 */
declare const _default: {
    initialize: <T extends keyof import("@ganache/flavors").ConnectorsByName = "ethereum">(options?: FlavorOptions<T>) => {
        connector: import("@ganache/flavors").ConnectorsByName[T];
        promise: Promise<void>;
    };
};
export default _default;
//# sourceMappingURL=connector-loader.d.ts.map