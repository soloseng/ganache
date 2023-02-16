/*
 * This file is the entry point for the resultant bundle dist/node/ganache.min.js
 * dist/cli/ganache.min.js will then point to dist/node/ganache.min.js
 * whenever it references @soloseng/ganache-core.
 * This is so we avoid an extra set of native node modules in dist/cli, just use
 * what's in dist/node.
 */
export type {
  Server,
  Provider,
  ServerOptions,
  ProviderOptions,
  Ethereum,
  _ExperimentalInfo
} from "@soloseng/ganache-core";

// for backwards compatibility with previous versions of v7
// we introduce a top-level `EthereumProvider`
export { EthereumProvider } from "@soloseng/ganache-core";
import type { ConnectorsByName } from "@soloseng/ganache-flavors";
export type FilecoinProvider = ConnectorsByName["filecoin"];

// polyfill "setImmediate" for the browser
// this is removed by webpack for our Node.js build
require("setimmediate");

export {
  server,
  provider,
  /**
   * @experimental
   */
  __experimental_info
} from "@soloseng/ganache-core";
import Ganache from "@soloseng/ganache-core";
export default Ganache;
