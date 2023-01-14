import { EEIInterface } from "@ethereumjs/evm";
/**
 * Puts the precompile accounts into the state tree
 * @param eei -
 */
export declare const activatePrecompiles: (eei: EEIInterface) => Promise<void>;
/**
 * Puts the precompile accounts into the warmed addresses
 * @param eei -
 */
export declare const warmPrecompiles: (eei: EEIInterface) => Promise<void>;
//# sourceMappingURL=precompiles.d.ts.map