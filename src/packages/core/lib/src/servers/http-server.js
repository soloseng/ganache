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
var _HttpServer_connector, _HttpServer_options, _HttpServer_isClosing, _HttpServer_handlePost, _HttpServer_handleOptions;
Object.defineProperty(exports, "__esModule", { value: true });
const content_types_1 = __importDefault(require("./utils/content-types"));
const http_response_codes_1 = __importDefault(require("./utils/http-response-codes"));
const util_1 = require("util");
const fragment_generator_1 = require("./utils/fragment-generator");
const noop = () => { };
/**
 * uWS doesn't let us use the request after the request method has completed.
 * But we can't set headers until after the statusCode is set. But we don't
 * know the status code until the provider returns asynchronously.
 * So this does request-related work immediately and returns a function to do the
 * rest of the work later.
 * @param method -
 * @param request -
 */
function prepareCORSResponseHeaders(method, request) {
    // https://fetch.spec.whatwg.org/#http-requests
    const origin = request.getHeader("origin");
    const acrh = request.getHeader("access-control-request-headers");
    return (response) => {
        const isCORSRequest = origin !== "";
        if (isCORSRequest) {
            // OPTIONS preflight requests need a little extra treatment
            if (method === "OPTIONS") {
                // we only allow POST requests, so it doesn't matter which method the request is asking for
                response.writeHeader("Access-Control-Allow-Methods", "POST");
                // echo all requested access-control-request-headers back to the response
                if (acrh !== "") {
                    response.writeHeader("Access-Control-Allow-Headers", acrh);
                }
                // Make browsers and compliant clients cache the OPTIONS preflight response for 10
                // minutes (this is the maximum time Chromium allows)
                response.writeHeader("Access-Control-Max-Age", "600"); // seconds
            }
            // From the spec: https://fetch.spec.whatwg.org/#http-responses
            // "For a CORS-preflight request, request’s credentials mode is always "omit",
            // but for any subsequent CORS requests it might not be. Support therefore
            // needs to be indicated as part of the HTTP response to the CORS-preflight request as well.", so this
            // header is added to all requests.
            // Additionally, https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials,
            // states that there aren't any HTTP Request headers that indicate you whether or not Request.withCredentials
            // is set. Because web3@1.0.0-beta.35-? always sets `request.withCredentials = true` while Safari requires it be
            // returned even when no credentials are set in the browser this header must always be return on all requests.
            // (I've found that Chrome and Firefox don't actually require the header when credentials aren't set)
            //  Regression Commit: https://github.com/ethereum/web3.js/pull/1722
            //  Open Web3 Issue: https://github.com/ethereum/web3.js/issues/1802
            response.writeHeader("Access-Control-Allow-Credentials", "true");
            // From the spec: "It cannot be reliably identified as participating in the CORS protocol
            // as the `Origin` header is also included for all requests whose method is neither
            // `GET` nor `HEAD`."
            // Explicitly set the origin instead of using *, since credentials
            // can't be used in conjunction with *. This will always be set
            /// for valid preflight requests.
            response.writeHeader("Access-Control-Allow-Origin", origin);
        }
    };
}
function sendResponse(response, closeConnection, statusCode, contentType, data, writeHeaders = noop) {
    response.cork(() => {
        response.writeStatus(statusCode);
        writeHeaders(response);
        if (contentType != null) {
            response.writeHeader("Content-Type", contentType);
        }
        if (data !== null) {
            response.end(data, closeConnection);
        }
        else {
            // in the case that body is not provided, it must specifically be <undefined> and not <null>
            response.end(undefined, closeConnection);
        }
    });
}
function sendChunkedResponse(response, closeConnection, statusCode, contentType, data, chunkSize, writeHeaders = noop) {
    const fragments = (0, fragment_generator_1.getFragmentGenerator)(data, chunkSize);
    // get our first fragment
    const { value: firstFragment } = fragments.next();
    // check if there is any more fragments after this one
    let { value: nextFragment, done } = fragments.next();
    // if there are no more fragments send the "firstFragment" via `sendResponse`,
    // as we don't need to chunk it.
    if (done) {
        sendResponse(response, closeConnection, statusCode, contentType, firstFragment, writeHeaders);
    }
    else {
        response.cork(() => {
            response.writeStatus(statusCode);
            writeHeaders(response);
            response.writeHeader("Content-Type", contentType);
            // since we have at least two fragments send both now
            response.write(firstFragment);
            response.write(nextFragment);
            // and then keep sending the rest
            for (nextFragment of fragments) {
                response.write(nextFragment);
            }
            response.end(undefined, closeConnection);
        });
    }
}
class HttpServer {
    constructor(app, connector, options) {
        _HttpServer_connector.set(this, void 0);
        _HttpServer_options.set(this, void 0);
        _HttpServer_isClosing.set(this, false);
        _HttpServer_handlePost.set(this, (response, request) => {
            // handle JSONRPC post requests...
            const writeHeaders = prepareCORSResponseHeaders("POST", request);
            // TODO(perf): pre-allocate the buffer if we know the Content-Length
            let buffer;
            let aborted = false;
            response.onAborted(() => {
                aborted = true;
            });
            response.onData((message, isLast) => {
                const chunk = Buffer.from(message);
                if (isLast) {
                    // we have to use any here because typescript isn't smart enough
                    // to understand the ambiguity of RequestFormat and ReturnType
                    // on the Connector interface must match up appropriately
                    const connector = __classPrivateFieldGet(this, _HttpServer_connector, "f");
                    let payload;
                    try {
                        const message = buffer
                            ? Buffer.concat([buffer, chunk], buffer.length + chunk.length)
                            : chunk;
                        payload = connector.parse(message);
                    }
                    catch (e) {
                        sendResponse(response, __classPrivateFieldGet(this, _HttpServer_isClosing, "f"), http_response_codes_1.default.BAD_REQUEST, content_types_1.default.PLAIN, "400 Bad Request: " + e.message, writeHeaders);
                        return;
                    }
                    connector
                        .handle(payload, request)
                        .then(({ value }) => value)
                        .then(result => {
                        if (aborted) {
                            // if the request has been aborted don't try sending (it'll
                            // cause an `Unhandled promise rejection` if we try)
                            return;
                        }
                        const data = connector.format(result, payload);
                        if (util_1.types.isGeneratorObject(data)) {
                            sendChunkedResponse(response, __classPrivateFieldGet(this, _HttpServer_isClosing, "f"), http_response_codes_1.default.OK, content_types_1.default.JSON, data, __classPrivateFieldGet(this, _HttpServer_options, "f").chunkSize, writeHeaders);
                        }
                        else {
                            sendResponse(response, __classPrivateFieldGet(this, _HttpServer_isClosing, "f"), http_response_codes_1.default.OK, content_types_1.default.JSON, data, writeHeaders);
                        }
                    })
                        .catch(error => {
                        if (aborted) {
                            // if the request has been aborted don't try sending (it'll
                            // cause an `Unhandled promise rejection` if we try)
                            return;
                        }
                        const data = connector.formatError(error, payload);
                        sendResponse(response, __classPrivateFieldGet(this, _HttpServer_isClosing, "f"), http_response_codes_1.default.OK, content_types_1.default.JSON, data, writeHeaders);
                    });
                }
                else {
                    if (buffer) {
                        buffer = Buffer.concat([buffer, chunk], buffer.length + chunk.length);
                    }
                    else {
                        buffer = Buffer.concat([chunk], chunk.length);
                    }
                }
            });
        });
        _HttpServer_handleOptions.set(this, (response, request) => {
            // handle CORS preflight requests...
            const writeHeaders = prepareCORSResponseHeaders("OPTIONS", request);
            // OPTIONS responses don't have a body, so respond with `204 No Content`...
            sendResponse(response, __classPrivateFieldGet(this, _HttpServer_isClosing, "f"), http_response_codes_1.default.NO_CONTENT, null, null, writeHeaders);
        });
        __classPrivateFieldSet(this, _HttpServer_connector, connector, "f");
        __classPrivateFieldSet(this, _HttpServer_options, options, "f");
        // JSON-RPC routes...
        app
            .post(options.rpcEndpoint, __classPrivateFieldGet(this, _HttpServer_handlePost, "f"))
            .options(options.rpcEndpoint, __classPrivateFieldGet(this, _HttpServer_handleOptions, "f"));
        // because Easter Eggs are fun...
        app.get("/418", response => {
            sendResponse(response, __classPrivateFieldGet(this, _HttpServer_isClosing, "f"), http_response_codes_1.default.IM_A_TEAPOT, content_types_1.default.PLAIN, "418 I'm a teapot");
        });
        // fallback routes...
        app.any("/*", (response, request) => {
            const connectionHeader = request.getHeader("connection");
            if (connectionHeader && connectionHeader.toLowerCase() === "upgrade") {
                // if we got here it means the websocket server wasn't enabled but
                // a client tried to connect via websocket. This is a Bad Request.
                sendResponse(response, __classPrivateFieldGet(this, _HttpServer_isClosing, "f"), http_response_codes_1.default.BAD_REQUEST, content_types_1.default.PLAIN, "400 Bad Request");
            }
            else {
                // all other requests don't mean anything to us, so respond with `404 Not Found`...
                sendResponse(response, __classPrivateFieldGet(this, _HttpServer_isClosing, "f"), http_response_codes_1.default.NOT_FOUND, content_types_1.default.PLAIN, "404 Not Found");
            }
        });
    }
    close() {
        // flags the server as closing, indicating the connection should be closed with subsequent responses
        // as there is no way presently to close existing connections outside of the request/response context
        // see discussion: https://github.com/uNetworking/uWebSockets.js/issues/663#issuecomment-1026283415
        __classPrivateFieldSet(this, _HttpServer_isClosing, true, "f");
    }
}
exports.default = HttpServer;
_HttpServer_connector = new WeakMap(), _HttpServer_options = new WeakMap(), _HttpServer_isClosing = new WeakMap(), _HttpServer_handlePost = new WeakMap(), _HttpServer_handleOptions = new WeakMap();
//# sourceMappingURL=http-server.js.map