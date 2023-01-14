"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const colors_1 = require("@ganache/colors");
const utils_1 = require("@ganache/utils");
const util_1 = require("@ethereumjs/util");
function capitalizeFirstLetter(string) {
    return string[0].toUpperCase() + string.slice(1);
}
function color(str) {
    return (0, chalk_1.default) `{hex("${colors_1.TruffleColors.porsche}") ${str}}`;
}
function default_1(provider, cliSettings) {
    const liveOptions = provider.getOptions();
    const accounts = provider.getInitialAccounts();
    const addresses = Object.keys(accounts);
    const logs = [];
    logs.push("");
    logs.push("Available Accounts");
    logs.push("==================");
    if (addresses.length > 0) {
        addresses.forEach(function (address, index) {
            const balance = accounts[address].balance;
            const strBalance = balance / utils_1.WEI;
            const about = balance % utils_1.WEI === 0n ? "" : "~";
            let line = `(${index}) ${(0, util_1.toChecksumAddress)(address)} (${about}${strBalance} ETH)`;
            if (!accounts[address].unlocked) {
                line += " 🔒";
            }
            logs.push(line);
        });
        logs.push("");
        logs.push("Private Keys");
        logs.push("==================");
        addresses.forEach(function (address, index) {
            logs.push(`(${index}) ${accounts[address].secretKey}`);
        });
        if (liveOptions.wallet.accountKeysPath != null) {
            logs.push("");
            logs.push(`Accounts and keys saved to ${liveOptions.wallet.accountKeysPath}`);
        }
    }
    else {
        logs.push("(no accounts unlocked)");
    }
    if (liveOptions.wallet.accounts == null) {
        logs.push("");
        logs.push("HD Wallet");
        logs.push("==================");
        logs.push(`Mnemonic:      ${color(liveOptions.wallet.mnemonic)}`);
        logs.push(`Base HD Path:  ${color(liveOptions.wallet.hdPath.join("/") + "/{account_index}")}`);
    }
    if (liveOptions.miner.defaultGasPrice) {
        logs.push("");
        logs.push("Default Gas Price");
        logs.push("==================");
        logs.push(color(liveOptions.miner.defaultGasPrice.toBigInt().toString()));
    }
    if (liveOptions.miner.blockGasLimit) {
        logs.push("");
        logs.push("BlockGas Limit");
        logs.push("==================");
        logs.push(color(liveOptions.miner.blockGasLimit.toBigInt().toString()));
    }
    if (liveOptions.miner.callGasLimit) {
        logs.push("");
        logs.push("Call Gas Limit");
        logs.push("==================");
        logs.push(color(liveOptions.miner.callGasLimit.toBigInt().toString()));
    }
    if (liveOptions.fork.network || liveOptions.fork.url) {
        logs.push("");
        logs.push("Forked Chain");
        logs.push("==================");
        let location;
        if (liveOptions.fork.network) {
            location = `Ethereum ${capitalizeFirstLetter(liveOptions.fork.network.replace("goerli", "görli"))}, via ${(0, chalk_1.default) `{hex("${colors_1.TruffleColors.infura}") 丕Infura}`}`;
        }
        else {
            location = liveOptions.fork.url.toString();
        }
        logs.push(`Location:        ${color(location)}`);
        logs.push(`Block:           ${color(liveOptions.fork.blockNumber.toString())}`);
        logs.push(`Network ID:      ${color(liveOptions.chain.networkId.toString())}`);
        logs.push(`Time:            ${color(liveOptions.chain.time.toString())}`);
        if (liveOptions.fork.requestsPerSecond !== 0) {
            logs.push(`Requests/Second: ${color(liveOptions.fork.requestsPerSecond.toString())}`);
        }
    }
    logs.push("");
    logs.push("Chain Id");
    logs.push("==================");
    logs.push(color(liveOptions.chain.chainId.toString()));
    logs.push("");
    logs.push("RPC Listening on " + cliSettings.host + ":" + cliSettings.port);
    console.log(logs.join("\n"));
}
exports.default = default_1;
//# sourceMappingURL=ethereum.js.map