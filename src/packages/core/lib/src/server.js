"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Server_options, _Server_providerOptions, _Server_status, _Server_app, _Server_httpServer, _Server_listenSocket, _Server_connector, _Server_websocketServer, _Server_initializer;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = exports._DefaultServerOptions = exports.ServerStatus = void 0;
const options_1 = require("./options");
const aggregate_error_1 = __importDefault(require("aggregate-error"));
const uws_js_unofficial_1 = require("@trufflesuite/uws-js-unofficial");
// Set the "silent" config option so we don't output the "uwebsockets" header
// we check for truthiness because `uws` is omitted from the browser build
uws_js_unofficial_1._cfg &&
    (0, uws_js_unofficial_1._cfg)(new Uint8Array([115, 105, 108, 101, 110, 116]));
const flavors_1 = require("@ganache/flavors");
const connector_loader_1 = __importDefault(require("./connector-loader"));
const ws_server_1 = __importDefault(require("./servers/ws-server"));
const http_server_1 = __importDefault(require("./servers/http-server"));
const emittery_1 = __importDefault(require("emittery"));
const DEFAULT_HOST = "127.0.0.1";
/**
 * Server ready state constants.
 *
 * These are bit flags. This means that you can check if the status is:
 *  * ready: `status === Status.ready` or `status & Status.ready !== 0`
 *  * opening: `status === Status.opening` or `status & Status.opening !== 0`
 *  * open: `status === Status.open` or `status & Status.open !== 0`
 *  * opening || open: `status & Status.openingOrOpen !== 0` or `status & (Status.opening | Status.open) !== 0`
 *  * closing: `status === Status.closing` or `status & Status.closing !== 0`
 *  * closed: `status === Status.closed` or `status & Status.closed !== 0`
 *  * closing || closed: `status & Status.closingOrClosed !== 0` or `status & (Status.closing | Status.closed) !== 0`
 */
var ServerStatus;
(function (ServerStatus) {
    /**
     * The Server is in an unknown state; perhaps construction didn't succeed
     */
    ServerStatus[ServerStatus["unknown"] = 0] = "unknown";
    /**
     * The Server has been constructed and is ready to be opened.
     */
    ServerStatus[ServerStatus["ready"] = 1] = "ready";
    /**
     * The Server has started to open, but has not yet finished initialization.
     */
    ServerStatus[ServerStatus["opening"] = 2] = "opening";
    /**
     * The Server is open and ready for connection.
     */
    ServerStatus[ServerStatus["open"] = 4] = "open";
    /**
     * The Server is either opening or is already open
     */
    ServerStatus[ServerStatus["openingOrOpen"] = 6] = "openingOrOpen";
    /**
     * The Server is in the process of closing.
     */
    ServerStatus[ServerStatus["closing"] = 8] = "closing";
    /**
     * The Server is closed and not accepting new connections.
     */
    ServerStatus[ServerStatus["closed"] = 16] = "closed";
    /**
     * The Server is either opening or is already open
     */
    ServerStatus[ServerStatus["closingOrClosed"] = 24] = "closingOrClosed";
})(ServerStatus = exports.ServerStatus || (exports.ServerStatus = {}));
/**
 * For private use. May change in the future.
 * I don't don't think these options should be held in this `core` package.
 * @ignore
 * @internal
 */
exports._DefaultServerOptions = options_1.serverDefaults;
/**
 * @public
 */
class Server extends emittery_1.default {
    constructor(providerAndServerOptions = {
        flavor: flavors_1.DefaultFlavor
    }) {
        super();
        _Server_options.set(this, void 0);
        _Server_providerOptions.set(this, void 0);
        _Server_status.set(this, ServerStatus.unknown);
        _Server_app.set(this, null);
        _Server_httpServer.set(this, null);
        _Server_listenSocket.set(this, null);
        _Server_connector.set(this, void 0);
        _Server_websocketServer.set(this, null);
        _Server_initializer.set(this, void 0);
        __classPrivateFieldSet(this, _Server_options, options_1.serverOptionsConfig.normalize(providerAndServerOptions), "f");
        __classPrivateFieldSet(this, _Server_providerOptions, providerAndServerOptions, "f");
        __classPrivateFieldSet(this, _Server_status, ServerStatus.ready, "f");
        // we need to start initializing now because `initialize` sets the
        // `provider` property... and someone might want to do:
        //   const server = Ganache.server();
        //   const provider = server.provider;
        //   await server.listen(8545)
        const loader = connector_loader_1.default.initialize(__classPrivateFieldGet(this, _Server_providerOptions, "f"));
        const connector = (__classPrivateFieldSet(this, _Server_connector, loader.connector, "f"));
        // Since the ConnectorLoader starts an async promise that we intentionally
        // don't await yet we keep the promise around for something else to handle
        // later.
        __classPrivateFieldSet(this, _Server_initializer, Promise.all([
            loader.promise,
            this.initialize(connector)
        ]), "f");
    }
    get provider() {
        return __classPrivateFieldGet(this, _Server_connector, "f").provider;
    }
    get status() {
        return __classPrivateFieldGet(this, _Server_status, "f");
    }
    async initialize(connector) {
        const _app = (__classPrivateFieldSet(this, _Server_app, (0, uws_js_unofficial_1.App)(), "f"));
        if (__classPrivateFieldGet(this, _Server_options, "f").server.ws) {
            __classPrivateFieldSet(this, _Server_websocketServer, new ws_server_1.default(_app, connector, __classPrivateFieldGet(this, _Server_options, "f").server), "f");
        }
        __classPrivateFieldSet(this, _Server_httpServer, new http_server_1.default(_app, connector, __classPrivateFieldGet(this, _Server_options, "f").server), "f");
        await connector.once("ready");
    }
    listen(port, host, callback) {
        if (typeof host === "function") {
            callback = host;
            host = null;
        }
        const callbackIsFunction = typeof callback === "function";
        // Method signature specifies port: number, but we parse a string if provided
        // inspiration taken from nodejs internal port validator
        // https://github.com/nodejs/node/blob/8c4b8b201ada6b76d5306c9c7f352e45087fb4a9/lib/internal/validators.js#L208-L219
        if ((typeof port !== "number" && typeof port !== "string") ||
            (typeof port === "string" && port.trim().length === 0) ||
            +port !== +port >>> 0 ||
            port > 0xffff ||
            port === 0) {
            const err = new Error(`Port should be >= 0 and < 65536. Received ${port}.`);
            return callbackIsFunction
                ? process.nextTick(callback, err)
                : Promise.reject(err);
        }
        const portNumber = +port;
        const status = __classPrivateFieldGet(this, _Server_status, "f");
        if (status === ServerStatus.closing) {
            // if closing
            const err = new Error(`Cannot start server while it is closing.`);
            return callbackIsFunction
                ? process.nextTick(callback, err)
                : Promise.reject(err);
        }
        else if ((status & ServerStatus.openingOrOpen) !== 0) {
            // if opening or open
            const err = new Error(`Server is already open, or is opening, on port: ${portNumber}.`);
            return callbackIsFunction
                ? process.nextTick(callback, err)
                : Promise.reject(err);
        }
        __classPrivateFieldSet(this, _Server_status, ServerStatus.opening, "f");
        const promise = Promise.allSettled([
            __classPrivateFieldGet(this, _Server_initializer, "f"),
            new Promise((resolve) => {
                // Make sure we have *exclusive* use of this port.
                // https://github.com/uNetworking/uSockets/commit/04295b9730a4d413895fa3b151a7337797dcb91f#diff-79a34a07b0945668e00f805838601c11R51
                const LIBUS_LISTEN_EXCLUSIVE_PORT = 1;
                host
                    ? __classPrivateFieldGet(this, _Server_app, "f").listen(host, portNumber, LIBUS_LISTEN_EXCLUSIVE_PORT, resolve)
                    : __classPrivateFieldGet(this, _Server_app, "f").listen(portNumber, LIBUS_LISTEN_EXCLUSIVE_PORT, resolve);
            }).then(listenSocket => {
                if (listenSocket) {
                    __classPrivateFieldSet(this, _Server_status, ServerStatus.open, "f");
                    __classPrivateFieldSet(this, _Server_listenSocket, listenSocket, "f");
                }
                else {
                    __classPrivateFieldSet(this, _Server_status, ServerStatus.closed, "f");
                    const err = new Error(`listen EADDRINUSE: address already in use ${host || DEFAULT_HOST}:${portNumber}.`);
                    throw err;
                }
            })
        ]).then(async (promiseResults) => {
            const errors = [];
            if (promiseResults[0].status === "rejected") {
                errors.push(promiseResults[0].reason);
            }
            if (promiseResults[1].status === "rejected") {
                errors.push(promiseResults[1].reason);
            }
            if (errors.length === 0) {
                this.emit("open");
            }
            else {
                __classPrivateFieldSet(this, _Server_status, ServerStatus.unknown, "f");
                try {
                    await this.close();
                }
                catch (e) {
                    errors.push(e);
                }
                if (errors.length > 1) {
                    throw new aggregate_error_1.default(errors);
                }
                else {
                    throw errors[0];
                }
            }
        });
        if (callbackIsFunction) {
            promise.then(() => callback(null)).catch(callback);
        }
        else {
            return promise;
        }
    }
    async close() {
        if (__classPrivateFieldGet(this, _Server_status, "f") === ServerStatus.opening) {
            // if opening
            throw new Error(`Cannot close server while it is opening.`);
        }
        else if ((__classPrivateFieldGet(this, _Server_status, "f") & ServerStatus.closingOrClosed) !== 0) {
            // if closing or closed
            throw new Error(`Server is already closing or closed.`);
        }
        __classPrivateFieldSet(this, _Server_status, ServerStatus.closing, "f");
        // clean up the websocket objects
        const _listenSocket = __classPrivateFieldGet(this, _Server_listenSocket, "f");
        __classPrivateFieldSet(this, _Server_listenSocket, null, "f");
        // close the socket to prevent any more connections
        if (_listenSocket !== null) {
            (0, uws_js_unofficial_1.us_listen_socket_close)(_listenSocket);
        }
        // close all the connected websockets:
        if (__classPrivateFieldGet(this, _Server_websocketServer, "f") !== null) {
            __classPrivateFieldGet(this, _Server_websocketServer, "f").close();
        }
        // and do all http cleanup, if any
        if (__classPrivateFieldGet(this, _Server_httpServer, "f") !== null) {
            __classPrivateFieldGet(this, _Server_httpServer, "f").close();
        }
        // cleanup the connector, provider, etc.
        if (__classPrivateFieldGet(this, _Server_connector, "f") !== null) {
            await __classPrivateFieldGet(this, _Server_connector, "f").close();
        }
        __classPrivateFieldSet(this, _Server_status, ServerStatus.closed, "f");
        __classPrivateFieldSet(this, _Server_app, null, "f");
        await this.emit("close");
    }
}
exports.Server = Server;
_Server_options = new WeakMap(), _Server_providerOptions = new WeakMap(), _Server_status = new WeakMap(), _Server_app = new WeakMap(), _Server_httpServer = new WeakMap(), _Server_listenSocket = new WeakMap(), _Server_connector = new WeakMap(), _Server_websocketServer = new WeakMap(), _Server_initializer = new WeakMap();
exports.default = Server;
//# sourceMappingURL=server.js.map