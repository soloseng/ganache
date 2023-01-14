#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __importStar(require("@ganache/core"));
const args_1 = __importDefault(require("./args"));
const flavors_1 = require("@ganache/flavors");
const ethereum_1 = __importDefault(require("./initialize/ethereum"));
const filecoin_1 = __importDefault(require("./initialize/filecoin"));
const detach_1 = require("./detach");
const colors_1 = require("@ganache/colors");
const cli_table_1 = __importDefault(require("cli-table"));
const chalk_1 = __importDefault(require("chalk"));
const porscheColor = chalk_1.default.hex(colors_1.TruffleColors.porsche);
const logAndForceExit = (messages, exitCode = 0) => {
    // https://nodejs.org/api/process.html#process_process_exit_code
    // writes to process.stdout in Node.js are sometimes asynchronous and may occur over
    // multiple ticks of the Node.js event loop. Calling process.exit(), however, forces
    // the process to exit before those additional writes to stdout can be performed.
    // se we set stdout to block in order to successfully log before exiting
    if (process.stdout._handle) {
        process.stdout._handle.setBlocking(true);
    }
    try {
        messages.forEach(message => console.log(message));
    }
    catch (e) {
        console.log(e);
    }
    // force the process to exit
    process.exit(exitCode);
};
const version = process.env.VERSION || "DEV";
const cliVersion = process.env.CLI_VERSION || "DEV";
const coreVersion = process.env.CORE_VERSION || "DEV";
const detailedVersion = `ganache v${version} (@ganache/cli: ${cliVersion}, @ganache/core: ${coreVersion})`;
const isDocker = "DOCKER" in process.env && process.env.DOCKER.toLowerCase() === "true";
const argv = (0, args_1.default)(detailedVersion, isDocker);
if (argv.action === "start") {
    const flavor = argv.flavor;
    const cliSettings = argv.server;
    console.log(detailedVersion);
    let server;
    try {
        server = core_1.default.server(argv);
    }
    catch (error) {
        console.error(error.message);
        process.exit(1);
    }
    let started = false;
    process.on("uncaughtException", function (e) {
        if (started) {
            logAndForceExit([e], 1);
        }
        else {
            logAndForceExit([e.stack], 1);
        }
    });
    let receivedShutdownSignal = false;
    const handleSignal = async (signal) => {
        console.log(`\nReceived shutdown signal: ${signal}`);
        closeHandler();
    };
    const closeHandler = async () => {
        try {
            // graceful shutdown
            switch (server.status) {
                case core_1.ServerStatus.opening:
                    receivedShutdownSignal = true;
                    console.log("Server is currently starting; waiting…");
                    return;
                case core_1.ServerStatus.open:
                    console.log("Shutting down…");
                    await server.close();
                    console.log("Server has been shut down");
                    break;
            }
            // don't just call `process.exit()` here, as we don't want to hide shutdown
            // errors behind a forced shutdown. Note: `process.exitCode` doesn't do
            // anything other than act as a place to anchor this comment :-)
            process.exitCode = 0;
        }
        catch (err) {
            logAndForceExit([
                "\nReceived an error while attempting to shut down the server: ",
                err.stack || err
            ], 1);
        }
    };
    // See http://stackoverflow.com/questions/10021373/what-is-the-windows-equivalent-of-process-onsigint-in-node-js
    if (process.platform === "win32") {
        const rl = require("readline")
            .createInterface({
            input: process.stdin,
            output: process.stdout
        })
            .on("SIGINT", () => {
            // we must "close" the RL interface otherwise the process will think we
            // are still listening
            // https://nodejs.org/api/readline.html#readline_event_sigint
            rl.close();
            handleSignal("SIGINT");
        });
    }
    process.on("SIGINT", handleSignal);
    process.on("SIGTERM", handleSignal);
    process.on("SIGHUP", handleSignal);
    console.log("Starting RPC server");
    server.listen(cliSettings.port, cliSettings.host, async (err) => {
        if (err) {
            console.error(err);
            process.exitCode = 1;
            return;
        }
        else if (receivedShutdownSignal) {
            closeHandler();
            return;
        }
        started = true;
        switch (flavor) {
            case flavors_1.FilecoinFlavorName: {
                await (0, filecoin_1.default)(server.provider, cliSettings);
                break;
            }
            case flavors_1.EthereumFlavorName:
            default: {
                (0, ethereum_1.default)(server.provider, cliSettings);
                break;
            }
        }
        // if process.send is defined, this is a child_process (we assume a detached
        // instance), so we need to notify that we are ready.
        const isDetachedInstance = process.send !== undefined;
        if (isDetachedInstance) {
            (0, detach_1.notifyDetachedInstanceReady)();
        }
    });
}
else if (argv.action === "stop") {
    const instanceName = argv.name;
    (0, detach_1.stopDetachedInstance)(instanceName).then(instanceFound => {
        if (instanceFound) {
            console.log("Instance stopped");
        }
        else {
            console.error("Instance not found");
        }
    });
}
else if (argv.action === "start-detached") {
    (0, detach_1.startDetachedInstance)(process.argv, argv, version)
        .then(instance => {
        const highlightedName = porscheColor(instance.name);
        // output only the instance name to allow users to capture stdout and use to
        // programmatically stop the instance
        console.log(highlightedName);
    })
        .catch(err => {
        // the child process would have output its error to stdout, so no need to
        // output anything more
    });
}
else if (argv.action === "list") {
    (0, detach_1.getDetachedInstances)().then(instances => {
        if (instances.length === 0) {
            console.log(`No detached instances found - try ${porscheColor("ganache --detach")} to start a detached instance`);
        }
        else {
            const now = Date.now();
            const table = new cli_table_1.default({
                head: [
                    chalk_1.default.bold("PID"),
                    chalk_1.default.bold("Name"),
                    chalk_1.default.bold("Flavor"),
                    chalk_1.default.bold("Version"),
                    chalk_1.default.bold("Host"),
                    chalk_1.default.bold("Uptime")
                ],
                colAligns: ["right", "left", "left", "left", "left", "right"],
                style: {
                    head: ["white", "white", "white", "white", "white", "white"]
                }
            });
            instances.sort((a, b) => b.startTime - a.startTime);
            for (let i = 0; i < instances.length; i++) {
                const instance = instances[i];
                const uptime = now - instance.startTime;
                table.push([
                    instance.pid.toString(),
                    porscheColor(instance.name),
                    instance.flavor,
                    instance.version,
                    `${instance.host}:${instance.port.toString()}`,
                    (0, detach_1.formatUptime)(uptime)
                ]);
            }
            console.log(table.toString());
        }
    });
}
//# sourceMappingURL=cli.js.map