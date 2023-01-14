"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerOptions = void 0;
const flavors_1 = require("@ganache/flavors");
const buffer_1 = require("buffer");
const normalize = (rawInput) => rawInput;
exports.ServerOptions = {
    ws: {
        normalize,
        cliDescription: "Enable a websocket server.",
        default: () => true,
        legacyName: "ws",
        cliType: "boolean"
    },
    wsBinary: {
        normalize,
        cliDescription: "Whether or not websockets should response with binary data (ArrayBuffers) or strings.",
        default: () => "auto",
        cliChoices: ["true", "false", "auto"]
    },
    rpcEndpoint: {
        normalize,
        cliDescription: "Defines the endpoint route the HTTP and WebSocket servers will listen on.",
        default: (config, flavor) => {
            switch (flavor) {
                case flavors_1.FilecoinFlavorName:
                    return "/rpc/v0";
                case flavors_1.DefaultFlavor:
                default:
                    return "/";
            }
        },
        defaultDescription: '"/" (Ethereum), "/rpc/v0" (Filecoin)'
    },
    chunkSize: {
        normalize: number => {
            if (number < 0 || number > buffer_1.kMaxLength) {
                throw new Error(`--server.chunkSize must be >= 0 and <= ${buffer_1.kMaxLength}`);
            }
            return number;
        },
        cliDescription: "For memory and performance reasons ganache may respond with chunked transfer-encoding over HTTP and fragmented send over WebSockets. This option allows you to control the approximate size of each chunk.",
        default: () => 1024 * 1024,
        cliType: "number"
    }
};
//# sourceMappingURL=server-options.js.map