/// <reference types="node" />
import type { InterpreterStep } from "@ethereumjs/evm";
import { ConsoleLogs } from "@ganache/console.log";
export declare type EvmStepContext = {};
export declare type VmStepData = ReturnType<typeof normalizeEvent>;
export declare type VmStepEvent = {
    readonly context: EvmStepContext;
    readonly data: VmStepData;
};
declare function normalizeEvent(event: InterpreterStep): {
    account: {
        nonce: bigint;
        balance: bigint;
        stateRoot: Buffer;
        codeHash: Buffer;
    };
    address: Buffer;
    codeAddress: Buffer;
    depth: bigint;
    gasLeft: bigint;
    gasRefund: bigint;
    memory: Buffer;
    memoryWordCount: bigint;
    opcode: {
        name: string;
        fee: number;
    };
    pc: bigint;
    returnStack: bigint[];
    stack: bigint[];
};
export declare function makeStepEvent(context: EvmStepContext, event: InterpreterStep): {
    context: EvmStepContext;
    data: {
        account: {
            nonce: bigint;
            balance: bigint;
            stateRoot: Buffer;
            codeHash: Buffer;
        };
        address: Buffer;
        codeAddress: Buffer;
        depth: bigint;
        gasLeft: bigint;
        gasRefund: bigint;
        memory: Buffer;
        memoryWordCount: bigint;
        opcode: {
            name: string;
            fee: number;
        };
        pc: bigint;
        returnStack: bigint[];
        stack: bigint[];
    };
};
export declare type VmBeforeTransactionEvent = {
    readonly context: EvmStepContext;
};
export declare type VmAfterTransactionEvent = {
    readonly context: EvmStepContext;
};
export declare type VmConsoleLogEvent = {
    readonly context: EvmStepContext;
    readonly logs: ConsoleLogs;
};
export declare type DataEvent = {
    jsonrpc: "2.0";
    method: "eth_subscription";
    params: any;
};
export declare type MessageEvent = {
    readonly type: "eth_subscription";
    readonly data: {
        readonly subscription: string;
        readonly result: unknown;
    };
};
export {};
//# sourceMappingURL=provider-events.d.ts.map