"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandArgs = void 0;
const colors_1 = require("@ganache/colors");
const yargs_1 = __importDefault(require("yargs"));
const flavors_1 = require("@ganache/flavors");
const chalk_1 = __importDefault(require("chalk"));
const os_1 = require("os");
const marked_1 = __importDefault(require("marked"));
const marked_terminal_1 = __importDefault(require("marked-terminal"));
const core_1 = require("@ganache/core");
marked_1.default.setOptions({
    renderer: new marked_terminal_1.default({
        codespan: chalk_1.default.hex(colors_1.TruffleColors.porsche),
        // Disable `unescape` since doesn't work for everything (we just do it ourselves)
        unescape: false
    })
});
const wrapWidth = Math.min(120, yargs_1.default.terminalWidth());
const NEED_HELP = "Need more help? Reach out to the Truffle community at";
const COMMUNITY_LINK = "https://trfl.io/support";
function unescapeEntities(html) {
    return html
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\*\#COLON\|\*/g, ":");
}
const highlight = (t) => unescapeEntities(marked_1.default.parseInline(t));
const center = (str) => " ".repeat(Math.max(0, Math.floor((wrapWidth - str.length) / 2))) + str;
const addAliases = (args, aliases, key) => {
    const options = { hidden: true, alias: key };
    return aliases.reduce((args, a) => args.option(a, options), args);
};
function processOption(state, category, group, option, optionObj, argv, flavor) {
    if (optionObj.disableInCLI !== true) {
        const shortHand = [];
        const legacyAliases = [];
        let description = highlight(optionObj.cliDescription || "");
        if (optionObj.cliAliases) {
            optionObj.cliAliases.forEach(alias => {
                if (alias.length === 1)
                    shortHand.push(alias);
                else
                    legacyAliases.push(alias);
            });
            description = (0, chalk_1.default) `${description}${os_1.EOL}{dim deprecated aliases: ${legacyAliases
                .map(a => `--${a}`)
                .join(", ")}}`;
        }
        const generateDefaultDescription = () => {
            // default sometimes requires a config, so we supply one
            return (state[option] = optionObj.default
                ? optionObj.default(state, flavor).toString()
                : undefined);
        };
        const defaultDescription = "defaultDescription" in optionObj
            ? optionObj.defaultDescription
            : generateDefaultDescription();
        // we need to specify the type of each array so yargs properly casts
        // the types held within each array
        const { cliType } = optionObj;
        const array = cliType && cliType.startsWith("array:"); // e.g. array:string or array:number
        const type = (array
            ? cliType.slice(6) // remove the "array:" part
            : cliType);
        const options = {
            group,
            description,
            alias: shortHand,
            defaultDescription,
            array,
            type,
            choices: optionObj.cliChoices,
            coerce: optionObj.cliCoerce,
            implies: optionObj.implies
        };
        const key = `${category}.${option}`;
        // First, create *hidden* deprecated aliases...
        argv = addAliases(argv, legacyAliases, key);
        // and *then* create the main option, as options added later take precedence
        // example: `-d --wallet.seed 123` is invalid (mutally exclusive). If aliases are defined _after_
        // the main option definition the error message will be `Arguments deterministic and wallet.seed are mutually exclusive`
        // when it should be `Arguments wallet.deterministic and wallet.seed are mutually exclusive`
        argv = argv.option(key, options);
    }
}
function applyDefaults(flavorDefaults, flavorArgs, flavor) {
    for (const category in flavorDefaults) {
        const group = `${category[0].toUpperCase()}${category.slice(1)}:`;
        const categoryObj = flavorDefaults[category];
        const state = {};
        for (const option in categoryObj) {
            const optionObj = categoryObj[option];
            processOption(state, category, group, option, optionObj, flavorArgs, flavor);
        }
    }
}
function default_1(version, isDocker, rawArgs = process.argv.slice(2)) {
    const versionUsageOutputText = (0, chalk_1.default) `{hex("${colors_1.TruffleColors.porsche}").bold ${center(version)}}`;
    // disable dot-notation because yargs just can't coerce args properly...
    // ...on purpose! https://github.com/yargs/yargs/issues/1021#issuecomment-352324693
    yargs_1.default
        .parserConfiguration({ "dot-notation": false })
        .strict()
        .usage(versionUsageOutputText)
        .epilogue(versionUsageOutputText +
        os_1.EOL +
        os_1.EOL +
        (0, chalk_1.default) `{hex("${colors_1.TruffleColors.porsche}").bold ${center(NEED_HELP)}}` +
        os_1.EOL +
        (0, chalk_1.default) `{hex("${colors_1.TruffleColors.turquoise}") ${center(COMMUNITY_LINK)}}`);
    let flavor;
    for (flavor in flavors_1.DefaultOptionsByName) {
        const flavorDefaults = flavors_1.DefaultOptionsByName[flavor];
        let command;
        let defaultPort;
        switch (flavor) {
            // since "ethereum" is the DefaultFlavor we don't need a `case` for it
            case flavors_1.FilecoinFlavorName:
                command = flavor;
                defaultPort = 7777;
                break;
            case flavors_1.DefaultFlavor:
                command = ["$0", flavor];
                defaultPort = 8545;
                break;
            default:
                command = flavor;
                defaultPort = 8545;
        }
        yargs_1.default.command(command, (0, chalk_1.default) `Use the {bold ${flavor}} flavor of Ganache`, flavorArgs => {
            applyDefaults(flavorDefaults, flavorArgs, flavor);
            applyDefaults(core_1._DefaultServerOptions, flavorArgs, flavor);
            flavorArgs = flavorArgs
                .option("server.host", {
                group: "Server:",
                description: (0, chalk_1.default) `Hostname to listen on.${os_1.EOL}{dim deprecated aliases: --host, --hostname}${os_1.EOL}`,
                alias: ["h", "host", "hostname"],
                type: "string",
                default: isDocker ? "0.0.0.0" : "127.0.0.1"
            })
                .option("server.port", {
                group: "Server:",
                description: (0, chalk_1.default) `Port to listen on.${os_1.EOL}{dim deprecated aliases: --port}${os_1.EOL}`,
                alias: ["p", "port"],
                type: "number",
                default: defaultPort
            })
                .check(argv => {
                const { "server.port": port, "server.host": host } = argv;
                if (port < 1 || port > 65535) {
                    throw new Error(`Invalid port number '${port}'`);
                }
                if (host.trim() === "") {
                    throw new Error("Cannot leave host blank; please provide a host");
                }
                return true;
            })
                .option("detach", {
                description: highlight("Run Ganache in detached (daemon) mode." +
                    os_1.EOL +
                    "See `ganache instances --help` for information on managing detached instances."),
                type: "boolean",
                alias: ["D", "😈"]
            });
        }, parsedArgs => {
            parsedArgs.action = parsedArgs.detach ? "start-detached" : "start";
        });
    }
    yargs_1.default
        .command("instances", highlight("Manage instances of Ganache running in detached mode." +
        os_1.EOL +
        "(Ganache can be run in detached mode by providing the `--detach` flag)"), _yargs => {
        _yargs
            .command("list", "List instances running in detached mode", _ => { }, listArgs => {
            listArgs.action = "list";
        })
            .command("stop <name>", "Stop the instance specified by <name>", stopArgs => {
            stopArgs.positional("name", { type: "string" });
        }, stopArgs => {
            stopArgs.action = "stop";
        })
            .version(false);
    })
        .showHelpOnFail(false, "Specify -? or --help for available options")
        .alias("help", "?")
        .wrap(wrapWidth)
        .version(version);
    const parsedArgs = yargs_1.default.parse(rawArgs);
    let finalArgs;
    if (parsedArgs.action === "stop") {
        finalArgs = {
            action: "stop",
            name: parsedArgs.name
        };
    }
    else if (parsedArgs.action === "list") {
        finalArgs = { action: "list" };
    }
    else if (parsedArgs.action === "start" ||
        parsedArgs.action === "start-detached") {
        const action = parsedArgs.action;
        const flavor = (parsedArgs._.length > 0
            ? parsedArgs._[0]
            : flavors_1.DefaultFlavor);
        finalArgs = {
            flavor,
            action,
            ...expandArgs(parsedArgs)
        };
    }
    else {
        throw new Error(`Unknown action: ${parsedArgs.action}`);
    }
    return finalArgs;
}
exports.default = default_1;
/**
 * Expands the arguments into an object including only namespaced keys from the
 * `args` argument.
 * @param  {object} args to be expanded
 * @returns {object} with the expanded arguments
 */
function expandArgs(args) {
    const namespacedArgs = {};
    for (const key in args) {
        // ignore keys that are kebab-cased - they will be duplicated as camelCase
        if (key.indexOf("-") === -1) {
            // split on the first "."
            const [namespace, option] = key.split(/\.(.+)/);
            // only copy namespaced/group keys, and ignore keys with kebab cases
            if (option) {
                if (!namespacedArgs[namespace]) {
                    namespacedArgs[namespace] = {};
                }
                namespacedArgs[namespace][option] = args[key];
            }
        }
    }
    return namespacedArgs;
}
exports.expandArgs = expandArgs;
//# sourceMappingURL=args.js.map