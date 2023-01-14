"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _WebsocketServer_connections;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_PAYLOAD_SIZE = exports.sendFragmented = void 0;
const websocket_close_codes_1 = __importDefault(require("./utils/websocket-close-codes"));
const util_1 = require("util");
const fragment_generator_1 = require("./utils/fragment-generator");
function sendFragmented(ws, data, useBinary, chunkSize) {
    ws.cork(() => {
        // fragment send: https://github.com/uNetworking/uWebSockets.js/issues/635
        const shouldCompress = false;
        const fragments = (0, fragment_generator_1.getFragmentGenerator)(data, chunkSize);
        // get our first fragment
        const { value: firstFragment } = fragments.next();
        // check if there is any more fragments after this one
        let { value: maybeLastFragment, done } = fragments.next();
        // if there are no more fragments send the "firstFragment" via `send`, as
        // we don't need to chunk it.
        if (done) {
            ws.send(firstFragment, useBinary);
        }
        else {
            // since we have at least two fragments send the first one now that it
            // is "full"
            ws.sendFirstFragment(firstFragment, useBinary);
            // at this point `maybeLastFragment` is the next fragment that should be
            // sent. We iterate over all fragments, sending the _previous_ fragment
            // (`maybeLastFragment`) then cache the current fragment (`fragment`)
            // in the `maybeLastFragment` variable, which will be sent in the next
            // iteration, or via `sendLastFragment`, below, if `fragment` was also the
            // very last one.
            for (const fragment of fragments) {
                // definitely not the last fragment, send it!
                ws.sendFragment(maybeLastFragment, shouldCompress);
                maybeLastFragment = fragment;
            }
            ws.sendLastFragment(
            // definitely the last fragment at this point
            maybeLastFragment, shouldCompress);
        }
    });
}
exports.sendFragmented = sendFragmented;
// matches geth's limit of 15 MebiBytes: https://github.com/ethereum/go-ethereum/blob/3526f690478482a02a152988f4d31074c176b136/rpc/websocket.go#L40
exports.MAX_PAYLOAD_SIZE = 15 * 1024 * 1024;
class WebsocketServer {
    constructor(app, connector, options) {
        _WebsocketServer_connections.set(this, new Map());
        const connections = __classPrivateFieldGet(this, _WebsocketServer_connections, "f");
        const wsBinary = options.wsBinary;
        const autoBinary = wsBinary === "auto";
        app.ws(options.rpcEndpoint, {
            /* WS Options */
            maxPayloadLength: exports.MAX_PAYLOAD_SIZE,
            idleTimeout: 120,
            // Note that compression is disabled (the default option)
            // due to not being able to link against electron@12
            // with compression included
            /* Handlers */
            open: (ws) => {
                ws.closed = false;
                connections.set(ws, new Set());
            },
            message: async (ws, message, isBinary) => {
                // We have to use type any instead of ReturnType<typeof connector.parse>
                // on `payload` because Typescript isn't smart enough to understand the
                // ambiguity doesn't actually exist
                let payload;
                const useBinary = autoBinary ? isBinary : wsBinary;
                try {
                    payload = connector.parse(Buffer.from(message));
                }
                catch (err) {
                    const response = connector.formatError(err, payload);
                    ws.send(response, useBinary);
                    return;
                }
                let data;
                try {
                    const { value } = await connector.handle(payload, ws);
                    // The socket may have closed while we were waiting for the response
                    // Don't bother trying to send to it if it was.
                    if (ws.closed)
                        return;
                    const resultEmitter = value;
                    const result = await resultEmitter;
                    if (ws.closed)
                        return;
                    data = connector.format(result, payload);
                    // if the result is an emitter listen to its `"message"` event
                    // We check if `on` is a function rather than check if
                    // `resultEmitter instanceof PromiEvent` because `@ganache/filecoin`
                    // and `ganache` webpack `@ganache/utils` separately. This causes
                    // instanceof to fail here. Since we know `resultEmitter` is MergePromiseT
                    // we can safely assume that if `on` is a function, then we have a PromiEvent
                    if (typeof resultEmitter["on"] === "function") {
                        const resultEmitterPromiEvent = resultEmitter;
                        resultEmitterPromiEvent.on("message", (result) => {
                            // note: we _don't_ need to check if `ws.closed` here because when
                            // `ws.closed` is set we remove this event handler anyway.
                            const message = JSON.stringify({
                                jsonrpc: "2.0",
                                method: result.type,
                                params: result.data
                            });
                            ws.send(message, isBinary);
                        });
                        // keep track of listeners to dispose off when the ws disconnects
                        connections.get(ws).add(resultEmitterPromiEvent.dispose);
                    }
                }
                catch (err) {
                    // ensure the connector's `handle` fn doesn't throw outside of a Promise
                    if (ws.closed)
                        return;
                    data = connector.formatError(err, payload);
                }
                if (util_1.types.isGeneratorObject(data)) {
                    sendFragmented(ws, data, useBinary, options.chunkSize);
                }
                else {
                    ws.send(data, useBinary);
                }
            },
            drain: (ws) => {
                // This is there so tests can detect if a small amount of backpressure
                // is happening and that things will still work if it does. We actually
                // don't do anything to manage excessive backpressure.
                // TODO: handle back pressure for real!
                // options.logger.log("WebSocket backpressure: " + ws.getBufferedAmount());
            },
            close: (ws) => {
                ws.closed = true;
                connections.get(ws).forEach(dispose => dispose());
                connections.delete(ws);
            }
        });
    }
    close() {
        __classPrivateFieldGet(this, _WebsocketServer_connections, "f").forEach((_, ws) => ws.end(websocket_close_codes_1.default.CLOSE_NORMAL, "Server closed by client"));
    }
}
exports.default = WebsocketServer;
_WebsocketServer_connections = new WeakMap();
//# sourceMappingURL=ws-server.js.map