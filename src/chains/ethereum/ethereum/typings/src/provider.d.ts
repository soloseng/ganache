import Emittery from "emittery";
import EthereumApi from "./api";
import { Executor, KnownKeys, Provider, JsonRpcRequest, JsonRpcResponse, JsonRpcError, Quantity, Data, OverloadedParameters } from "@ganache/utils";
import { EthereumProviderOptions, EthereumInternalOptions, EthereumLegacyProviderOptions } from "@ganache/ethereum-options";
import { ITraceData } from "@ganache/ethereum-utils";
import { Address } from "@ganache/ethereum-address";
import { DataEvent, VmAfterTransactionEvent, VmBeforeTransactionEvent, VmStepEvent, MessageEvent, VmConsoleLogEvent } from "./provider-events";
declare type RequestMethods = KnownKeys<EthereumApi>;
declare type Primitives = string | number | null | undefined | symbol | bigint;
export declare type Externalize<X> = X extends Primitives ? X : X extends Quantity | Data | ITraceData | Address ? string : {
    [N in keyof X]: Externalize<X[N]>;
};
declare type Simplify<Type> = Promise<Type extends Promise<infer X> ? Externalize<X> : never>;
interface Callback {
    (err?: Error, response?: JsonRpcResponse | JsonRpcError): void;
}
interface BatchedCallback {
    (err?: Error, response?: (JsonRpcResponse | JsonRpcError)[]): void;
}
declare type RequestParams<Method extends RequestMethods> = {
    readonly method: Method;
    readonly params: OverloadedParameters<EthereumApi[Method]> | undefined;
};
export declare class EthereumProvider extends Emittery<{
    message: MessageEvent;
    data: DataEvent;
    error: Error;
    "ganache:vm:tx:step": VmStepEvent;
    "ganache:vm:tx:before": VmBeforeTransactionEvent;
    "ganache:vm:tx:after": VmAfterTransactionEvent;
    "ganache:vm:tx:console.log": VmConsoleLogEvent;
    connect: undefined;
    disconnect: undefined;
}> implements Provider<EthereumApi> {
    #private;
    constructor(options: EthereumProviderOptions | EthereumLegacyProviderOptions, executor: Executor);
    initialize(): Promise<void>;
    /**
     * Returns the options, including defaults and generated, used to start Ganache.
     */
    getOptions(): EthereumInternalOptions;
    /**
     * Returns the unlocked accounts
     */
    getInitialAccounts(): Record<string, {
        unlocked: boolean;
        secretKey: string;
        balance: bigint;
    }>;
    /**
     * Remove an event subscription
     */
    removeListener: Emittery["off"];
    /**
     * @param method - the params
     * @param params - the params
     * @internal Non standard! Do not use.
     */
    send<Method extends RequestMethods>(method: Method, params?: OverloadedParameters<EthereumApi[typeof method]>): Simplify<ReturnType<EthereumApi[typeof method]>>;
    /**
     * @param payload - payload
     * @param callback - callback
     * @deprecated Use the `request` method
     */
    send<Method extends RequestMethods>(payload: JsonRpcRequest<EthereumApi, Method>, callback?: Callback): undefined;
    /**
     * Legacy callback style API
     * @param payloads - JSON-RPC payload
     * @param callback - callback
     * @deprecated Batch transactions have been deprecated. Send payloads
     * individually via the `request` method.
     */
    send<Method extends RequestMethods>(payloads: JsonRpcRequest<EthereumApi, Method>[], callback?: BatchedCallback): undefined;
    /**
     * Legacy callback style API
     * @param payload - JSON-RPC payload
     * @param callback - callback
     * @deprecated Use the `request` method.
     */
    /**
     * @param payload - payload
     * @param callback - callback
     * @deprecated Use the `request` method
     */
    sendAsync<Method extends KnownKeys<EthereumApi>>(payload: JsonRpcRequest<EthereumApi, Method>, callback?: Callback): undefined;
    /**
     * Legacy callback style API
     * @param payloads - JSON-RPC payload
     * @param callback - callback
     * @deprecated Batch transactions have been deprecated. Send payloads
     * individually via the `request` method.
     */
    sendAsync<Method extends KnownKeys<EthereumApi>>(payloads: JsonRpcRequest<EthereumApi, Method>[], callback?: BatchedCallback): undefined;
    /**
     * EIP-1193 style request method
     * @param args -
     * @returns A Promise that resolves with the method's result or rejects with a CodedError
     * @EIP [1193](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md)
     */
    request<Method extends RequestMethods>(args: RequestParams<Method>): Simplify<ReturnType<EthereumApi[Method]>>;
    /**
     * INTERNAL. Used when the caller wants to access the original `PromiEvent`,
     * which would otherwise be flattened into a regular Promise through the
     * Promise chain.
     * @param request - the request
     */
    _requestRaw<Method extends RequestMethods>({ method, params }: RequestParams<Method>): Promise<{
        value: Promise<ReturnType<EthereumApi[Method]> extends infer T ? T extends ReturnType<EthereumApi[Method]> ? T extends Promise<unknown> ? {} : never : never : never>;
    }>;
    /**
     * Disconnect the provider instance. This will cause the underlying blockchain to be stopped, and any pending
     * tasks to be rejected. Emits a `disconnect` event once successfully disconnected.
     * @returns Fullfills with `undefined` once the provider has been disconnected.
     */
    disconnect: () => Promise<void>;
}
export {};
//# sourceMappingURL=provider.d.ts.map