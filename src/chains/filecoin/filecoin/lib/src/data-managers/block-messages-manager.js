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
var _BlockMessagesManager_signedMessageManager;
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = __importDefault(require("./manager"));
const block_messages_1 = require("../things/block-messages");
const signed_message_1 = require("../things/signed-message");
const sig_type_1 = require("../things/sig-type");
class BlockMessagesManager extends manager_1.default {
    constructor(base, signedMessageManager) {
        super(base, block_messages_1.BlockMessages);
        _BlockMessagesManager_signedMessageManager.set(this, void 0);
        __classPrivateFieldSet(this, _BlockMessagesManager_signedMessageManager, signedMessageManager, "f");
    }
    static async initialize(base, signedMessageManager) {
        const manager = new BlockMessagesManager(base, signedMessageManager);
        return manager;
    }
    async putBlockMessages(blockCID, messages) {
        // remove messages here as they'll be stored in their own manager
        const blockMessagesCidsOnly = new block_messages_1.BlockMessages({
            cids: messages.cids
        });
        await super.set(blockCID.value, blockMessagesCidsOnly);
        for (const message of messages.blsMessages) {
            const signedMessageWrapper = new signed_message_1.SignedMessage({
                message,
                Signature: {
                    Type: sig_type_1.SigType.SigTypeBLS,
                    Data: Buffer.from([0]).toString("base64")
                }
            });
            await __classPrivateFieldGet(this, _BlockMessagesManager_signedMessageManager, "f").putSignedMessage(signedMessageWrapper);
        }
        for (const message of messages.secpkMessages) {
            await __classPrivateFieldGet(this, _BlockMessagesManager_signedMessageManager, "f").putSignedMessage(message);
        }
    }
    async getBlockMessages(blockCID) {
        const messages = await super.get(blockCID.value);
        if (!messages) {
            return new block_messages_1.BlockMessages();
        }
        for (const cid of messages.cids) {
            const signedMessage = await __classPrivateFieldGet(this, _BlockMessagesManager_signedMessageManager, "f").get(cid.root.value);
            if (!signedMessage) {
                throw new Error(`Could not find signed message with cid ${cid.root.value} for block ${blockCID.value}`);
            }
            if (signedMessage.signature.type === sig_type_1.SigType.SigTypeBLS) {
                messages.blsMessages.push(signedMessage.message);
            }
            else {
                messages.secpkMessages.push(signedMessage);
            }
        }
        return messages;
    }
}
exports.default = BlockMessagesManager;
_BlockMessagesManager_signedMessageManager = new WeakMap();
//# sourceMappingURL=block-messages-manager.js.map