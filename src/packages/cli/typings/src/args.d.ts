import { GanacheArgs } from "./types";
export default function (version: string, isDocker: boolean, rawArgs?: string[]): GanacheArgs;
/**
 * Expands the arguments into an object including only namespaced keys from the
 * `args` argument.
 * @param  {object} args to be expanded
 * @returns {object} with the expanded arguments
 */
export declare function expandArgs(args: object): object;
//# sourceMappingURL=args.d.ts.map