import { FlavorName } from "@ganache/flavors";
export declare type DetachedInstance = {
    name: string;
    pid: number;
    startTime: number;
    host: string;
    port: number;
    flavor: FlavorName;
    cmd: string;
    version: string;
};
/**
 * Notify that the detached instance has started and is ready to receive requests.
 */
export declare function notifyDetachedInstanceReady(): void;
/**
 * Attempt to find and remove the instance file for a detached instance.
 * @param  {string} instanceName the name of the instance to be removed
 * @returns boolean indicating whether the instance file was cleaned up successfully
 */
export declare function removeDetachedInstanceFile(instanceName: string): Promise<boolean>;
/**
 * Attempts to stop a detached instance with the specified instance name by
 * sending a SIGTERM signal. Returns a boolean indicating whether the process
 * was found. If the PID is identified, but the process is not found, any
 * corresponding instance file will be removed.
 *
 * Note: This does not guarantee that the instance actually stops.
 * @param  {string} instanceName
 * @returns boolean indicating whether the instance was found.
 */
export declare function stopDetachedInstance(instanceName: string): Promise<boolean>;
/**
 * Start an instance of Ganache in detached mode.
 * @param  {string[]} argv arguments to be passed to the new instance.
 * @returns {Promise<DetachedInstance>} resolves to the DetachedInstance once it
 * is started and ready to receive requests.
 */
export declare function startDetachedInstance(argv: string[], instanceInfo: {
    flavor?: FlavorName;
    server: {
        host: string;
        port: number;
    };
}, version: string): Promise<DetachedInstance>;
/**
 * Fetch all instance of Ganache running in detached mode. Cleans up any
 * instance files for processes that are no longer running.
 * @returns {Promise<DetachedInstance[]>} resolves with an array of instances
 */
export declare function getDetachedInstances(): Promise<DetachedInstance[]>;
export declare function formatUptime(ms: number): string;
//# sourceMappingURL=detach.d.ts.map