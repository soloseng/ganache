import { DefaultFlavor, FlavorName } from "@ganache/flavors";
import { ServerOptions } from "@ganache/core";
declare type CliServerOptions = {
    host: string;
    port: number;
};
declare type Action = "start" | "start-detached" | "list" | "stop";
declare type AbstractArgs<TAction = Action> = {
    action: TAction;
};
export declare type StartArgs<TFlavorName extends FlavorName> = ServerOptions<TFlavorName> & {
    _: [TFlavorName];
    server: CliServerOptions;
} & AbstractArgs<"start" | "start-detached">;
export declare type GanacheArgs = (AbstractArgs<"stop"> & {
    name: string;
}) | AbstractArgs<"list"> | StartArgs<FlavorName>;
export declare type CliSettings = CliServerOptions;
export declare type FlavorCommand = FlavorName | ["$0", typeof DefaultFlavor];
export {};
//# sourceMappingURL=types.d.ts.map