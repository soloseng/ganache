import { OverloadedParameters } from "../types";
declare type RejectableTask = {
    execute: (...args: any) => Promise<any>;
    reject: (reason?: any) => void;
};
/**
 * Responsible for managing global concurrent requests.
 */
export declare class RequestCoordinator {
    #private;
    /**
     * The number of concurrent requests. Set to null for no limit.
     */
    limit: number;
    /**
     * The pending requests. You can't do anything with this array.
     */
    readonly pending: RejectableTask[];
    /**
     * The number of tasks currently being processed.
     */
    runningTasks: number;
    get paused(): boolean;
    /**
     * Promise-based FIFO queue.
     * @param limit - The number of requests that can be processed at a time.
     * Default value is is no limit (`0`).
     */
    constructor(limit: number);
    /**
     * Pause processing. This will *not* cancel any promises that are currently
     * running.
     */
    pause: () => void;
    /**
     * Resume processing.
     */
    resume: () => void;
    /**
     * Stop processing tasks - calls to queue(), and resume() will reject with an
     * error indicating that Ganache is disconnected. This is an irreversible
     * action. If you wish to be able to resume processing, use pause() instead.
     *
     * Note: this changes the references of this.resume and this.queue. Any code
     * that maintains references to the values referenced by this.resume or
     * this.queue, could have unintended consequences after calling this.stop().
     */
    stop(): void;
    /**
     * Finalise shutdown of the RequestCoordinator. Rejects all pending tasks in order. Should be
     * called after all in-flight tasks have resolved in order to maintain overall FIFO order.
     */
    end(): void;
    /**
     * Insert a new function into the queue.
     */
    queue: <T extends (...args: unknown[]) => unknown>(fn: T, thisArgument: any, argumentsList: Parameters<T extends {
        (...args: infer A1): infer R1;
        (...args: infer A2): infer R2;
        (...args: infer A3): infer R3;
        (...args: infer A4): infer R4;
        (...args: infer A5): infer R5;
        (...args: infer A6): infer R6;
    } ? ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3) | ((...args: A4) => R4) | ((...args: A5) => R5) | ((...args: A6) => R6) : T extends {
        (...args: infer A1_1): infer R1_1;
        (...args: infer A2_1): infer R2_1;
        (...args: infer A3_1): infer R3_1;
        (...args: infer A4_1): infer R4_1;
        (...args: infer A5_1): infer R5_1;
    } ? ((...args: A1_1) => R1_1) | ((...args: A2_1) => R2_1) | ((...args: A3_1) => R3_1) | ((...args: A4_1) => R4_1) | ((...args: A5_1) => R5_1) : T extends {
        (...args: infer A1_2): infer R1_2;
        (...args: infer A2_2): infer R2_2;
        (...args: infer A3_2): infer R3_2;
        (...args: infer A4_2): infer R4_2;
    } ? ((...args: A1_2) => R1_2) | ((...args: A2_2) => R2_2) | ((...args: A3_2) => R3_2) | ((...args: A4_2) => R4_2) : T extends {
        (...args: infer A1_3): infer R1_3;
        (...args: infer A2_3): infer R2_3;
        (...args: infer A3_3): infer R3_3;
    } ? ((...args: A1_3) => R1_3) | ((...args: A2_3) => R2_3) | ((...args: A3_3) => R3_3) : T extends {
        (...args: infer A1_4): infer R1_4;
        (...args: infer A2_4): infer R2_4;
    } ? ((...args: A1_4) => R1_4) | ((...args: A2_4) => R2_4) : T extends (...args: infer A1_5) => infer R1_5 ? (...args: A1_5) => R1_5 : never> extends infer T_1 ? T_1 extends Parameters<T extends {
        (...args: infer A1): infer R1;
        (...args: infer A2): infer R2;
        (...args: infer A3): infer R3;
        (...args: infer A4): infer R4;
        (...args: infer A5): infer R5;
        (...args: infer A6): infer R6;
    } ? ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3) | ((...args: A4) => R4) | ((...args: A5) => R5) | ((...args: A6) => R6) : T extends {
        (...args: infer A1_1): infer R1_1;
        (...args: infer A2_1): infer R2_1;
        (...args: infer A3_1): infer R3_1;
        (...args: infer A4_1): infer R4_1;
        (...args: infer A5_1): infer R5_1;
    } ? ((...args: A1_1) => R1_1) | ((...args: A2_1) => R2_1) | ((...args: A3_1) => R3_1) | ((...args: A4_1) => R4_1) | ((...args: A5_1) => R5_1) : T extends {
        (...args: infer A1_2): infer R1_2;
        (...args: infer A2_2): infer R2_2;
        (...args: infer A3_2): infer R3_2;
        (...args: infer A4_2): infer R4_2;
    } ? ((...args: A1_2) => R1_2) | ((...args: A2_2) => R2_2) | ((...args: A3_2) => R3_2) | ((...args: A4_2) => R4_2) : T extends {
        (...args: infer A1_3): infer R1_3;
        (...args: infer A2_3): infer R2_3;
        (...args: infer A3_3): infer R3_3;
    } ? ((...args: A1_3) => R1_3) | ((...args: A2_3) => R2_3) | ((...args: A3_3) => R3_3) : T extends {
        (...args: infer A1_4): infer R1_4;
        (...args: infer A2_4): infer R2_4;
    } ? ((...args: A1_4) => R1_4) | ((...args: A2_4) => R2_4) : T extends (...args: infer A1_5) => infer R1_5 ? (...args: A1_5) => R1_5 : never> ? T_1 extends unknown ? never : T_1 : never : never) => Promise<{
        value: ReturnType<T>;
    }>;
}
export {};
//# sourceMappingURL=request-coordinator.d.ts.map