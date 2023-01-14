"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatUptime = exports.getDetachedInstances = exports.startDetachedInstance = exports.stopDetachedInstance = exports.removeDetachedInstanceFile = exports.notifyDetachedInstanceReady = void 0;
const child_process_1 = require("child_process");
const process_name_1 = __importDefault(require("./process-name"));
const env_paths_1 = __importDefault(require("env-paths"));
const ps_list_1 = __importDefault(require("@trufflesuite/ps-list"));
const fs_1 = require("fs");
// this awkward import is required to support node 12
const { readFile, mkdir, readdir, rmdir, writeFile, unlink } = fs_1.promises;
const path_1 = __importDefault(require("path"));
const FILE_ENCODING = "utf8";
const READY_MESSAGE = "ready";
const START_ERROR = "An error occurred spawning a detached instance of Ganache:";
const dataPath = (0, env_paths_1.default)(`Ganache/instances`, { suffix: "" }).data;
function getInstanceFilePath(instanceName) {
    return path_1.default.join(dataPath, `${instanceName}.json`);
}
/**
 * Notify that the detached instance has started and is ready to receive requests.
 */
function notifyDetachedInstanceReady() {
    // in "detach" mode, the parent will wait until the "ready" message is
    // received before disconnecting from the child process.
    process.send(READY_MESSAGE);
}
exports.notifyDetachedInstanceReady = notifyDetachedInstanceReady;
/**
 * Attempt to find and remove the instance file for a detached instance.
 * @param  {string} instanceName the name of the instance to be removed
 * @returns boolean indicating whether the instance file was cleaned up successfully
 */
async function removeDetachedInstanceFile(instanceName) {
    const instanceFilename = getInstanceFilePath(instanceName);
    try {
        await unlink(instanceFilename);
        return true;
    }
    catch { }
    return false;
}
exports.removeDetachedInstanceFile = removeDetachedInstanceFile;
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
async function stopDetachedInstance(instanceName) {
    try {
        // getDetachedInstanceByName() throws if the instance file is not found or
        // cannot be parsed
        const instance = await getDetachedInstanceByName(instanceName);
        // process.kill() throws if the process was not found (or was a group
        // process in Windows)
        process.kill(instance.pid, "SIGTERM");
    }
    catch (err) {
        return false;
    }
    finally {
        await removeDetachedInstanceFile(instanceName);
    }
    return true;
}
exports.stopDetachedInstance = stopDetachedInstance;
/**
 * Start an instance of Ganache in detached mode.
 * @param  {string[]} argv arguments to be passed to the new instance.
 * @returns {Promise<DetachedInstance>} resolves to the DetachedInstance once it
 * is started and ready to receive requests.
 */
async function startDetachedInstance(argv, instanceInfo, version) {
    const [bin, module, ...args] = argv;
    // append `--no-detach` argument to cancel out --detach and aliases (must be
    // the last argument). See test "is false, when proceeded with --no-detach" in
    // args.test.ts
    const childArgs = [...args, "--no-detach"];
    const child = (0, child_process_1.fork)(module, childArgs, {
        stdio: ["ignore", "ignore", "pipe", "ipc"],
        detached: true
    });
    // Any messages output to stderr by the child process (before the `ready`
    // event is emitted) will be streamed to stderr on the parent.
    child.stderr.pipe(process.stderr);
    await new Promise((resolve, reject) => {
        child.on("message", message => {
            if (message === READY_MESSAGE) {
                resolve();
            }
        });
        child.on("error", err => {
            // This only happens if there's an error starting the child process, not
            // if Ganache throws within the child process.
            console.error(`${START_ERROR}\n${err.message}`);
            process.exitCode = 1;
            reject(err);
        });
        child.on("exit", (code) => {
            // This shouldn't happen, so ensure that we surface a non-zero exit code.
            process.exitCode = code === 0 ? 1 : code;
            reject(new Error(`${START_ERROR}\nThe detached instance exited with error code: ${code}`));
        });
    });
    // destroy the ReadableStream exposed by the child process, to allow the
    // parent to exit gracefully.
    child.stderr.destroy();
    child.unref();
    child.disconnect();
    const flavor = instanceInfo.flavor;
    const { host, port } = instanceInfo.server;
    const cmd = process.platform === "win32"
        ? path_1.default.basename(process.execPath)
        : [process.execPath, ...process.execArgv, module, ...childArgs].join(" ");
    const pid = child.pid;
    const startTime = Date.now();
    const instance = {
        startTime,
        pid,
        name: (0, process_name_1.default)(),
        host,
        port,
        flavor,
        cmd,
        version
    };
    while (true) {
        const instanceFilename = getInstanceFilePath(instance.name);
        try {
            await writeFile(instanceFilename, JSON.stringify(instance), {
                // wx means "Open file for writing, but fail if the path exists". see
                // https://nodejs.org/api/fs.html#file-system-flags
                flag: "wx",
                encoding: FILE_ENCODING
            });
            break;
        }
        catch (err) {
            switch (err.code) {
                case "EEXIST":
                    // an instance already exists with this name
                    instance.name = (0, process_name_1.default)();
                    break;
                case "ENOENT":
                    // we don't check whether the folder exists before writing, as that's
                    // a very uncommon case. Catching the exception and subsequently
                    // creating the directory is faster in the majority of cases.
                    await mkdir(dataPath, { recursive: true });
                    break;
                default:
                    throw err;
            }
        }
    }
    return instance;
}
exports.startDetachedInstance = startDetachedInstance;
/**
 * Fetch all instance of Ganache running in detached mode. Cleans up any
 * instance files for processes that are no longer running.
 * @returns {Promise<DetachedInstance[]>} resolves with an array of instances
 */
async function getDetachedInstances() {
    let dirEntries;
    let processes;
    let someInstancesFailed = false;
    try {
        [dirEntries, processes] = await Promise.all([
            readdir(dataPath, { withFileTypes: true }),
            (0, ps_list_1.default)()
        ]);
    }
    catch (err) {
        if (err.code !== "ENOENT") {
            throw err;
        }
        // instances directory does not (yet) exist, so there cannot be any instances
        return [];
    }
    const instances = [];
    const loadingInstancesInfos = dirEntries.map(async (dirEntry) => {
        const filename = dirEntry.name;
        const { name: instanceName, ext } = path_1.default.parse(filename);
        let failureReason;
        if (ext !== ".json") {
            failureReason = `"${filename}" does not have a .json extension`;
        }
        else {
            let instance;
            try {
                // getDetachedInstanceByName() throws if the instance file is not found or
                // cannot be parsed
                instance = await getDetachedInstanceByName(instanceName);
            }
            catch (err) {
                failureReason = err.message;
            }
            if (instance) {
                const matchingProcess = processes.find(p => p.pid === instance.pid);
                if (!matchingProcess) {
                    failureReason = `Process with PID ${instance.pid} could not be found`;
                }
                else if (matchingProcess.cmd !== instance.cmd) {
                    failureReason = `Process with PID ${instance.pid} does not match ${instanceName}`;
                }
                else {
                    instances.push(instance);
                }
            }
        }
        if (failureReason !== undefined) {
            someInstancesFailed = true;
            const fullPath = path_1.default.join(dataPath, filename);
            let resolution;
            if (dirEntry.isDirectory()) {
                const reason = `"${filename}" is a directory`;
                try {
                    await rmdir(fullPath, { recursive: true });
                    failureReason = reason;
                }
                catch {
                    resolution = `"${filename}" could not be removed`;
                }
            }
            else {
                try {
                    await unlink(fullPath);
                }
                catch {
                    resolution = `"${filename}" could not be removed`;
                }
            }
            console.warn(`Failed to load instance data. ${failureReason}. ${resolution || `"${filename}" has been removed`}.`);
        }
    });
    await Promise.all(loadingInstancesInfos);
    if (someInstancesFailed) {
        console.warn("If this keeps happening, please open an issue at https://github.com/trufflesuite/ganache/issues/new\n");
    }
    return instances;
}
exports.getDetachedInstances = getDetachedInstances;
/**
 * Attempts to load data for the instance specified by instanceName. Throws if
 * the instance file is not found or cannot be parsed
 * @param  {string} instanceName
 */
async function getDetachedInstanceByName(instanceName) {
    const filepath = getInstanceFilePath(instanceName);
    const content = await readFile(filepath, FILE_ENCODING);
    return JSON.parse(content);
}
// adapted from https://github.com/30-seconds/30-seconds-of-code/blob/master/snippets/formatDuration.md
// under CC-BY-4.0 License https://creativecommons.org/licenses/by/4.0/
function formatUptime(ms) {
    if (ms > -1000 && ms < 1000)
        return "Just started";
    const isFuture = ms < 0;
    ms = Math.abs(ms);
    const time = {
        d: Math.floor(ms / 86400000),
        h: Math.floor(ms / 3600000) % 24,
        m: Math.floor(ms / 60000) % 60,
        s: Math.floor(ms / 1000) % 60
    };
    const duration = Object.entries(time)
        .filter(val => val[1] !== 0)
        .map(([key, val]) => `${val}${key}`)
        .join(" ");
    return isFuture ? `In ${duration}` : duration;
}
exports.formatUptime = formatUptime;
//# sourceMappingURL=detach.js.map