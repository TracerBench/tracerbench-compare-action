"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stdout = exports.stderr = exports.execute = exports.ux = exports.flush = exports.settings = exports.toConfiguredId = exports.toStandardizedId = exports.tsPath = exports.toCached = exports.run = exports.Performance = exports.Plugin = exports.Parser = exports.Interfaces = exports.HelpBase = exports.Help = exports.loadHelpClass = exports.Flags = exports.Errors = exports.Config = exports.CommandHelp = exports.Command = exports.Args = void 0;
const command_1 = require("./command");
Object.defineProperty(exports, "Command", { enumerable: true, get: function () { return command_1.Command; } });
const main_1 = require("./main");
Object.defineProperty(exports, "run", { enumerable: true, get: function () { return main_1.run; } });
Object.defineProperty(exports, "execute", { enumerable: true, get: function () { return main_1.execute; } });
const config_1 = require("./config");
Object.defineProperty(exports, "Config", { enumerable: true, get: function () { return config_1.Config; } });
Object.defineProperty(exports, "Plugin", { enumerable: true, get: function () { return config_1.Plugin; } });
Object.defineProperty(exports, "tsPath", { enumerable: true, get: function () { return config_1.tsPath; } });
Object.defineProperty(exports, "toCached", { enumerable: true, get: function () { return config_1.toCached; } });
const Interfaces = require("./interfaces");
exports.Interfaces = Interfaces;
const Errors = require("./errors");
exports.Errors = Errors;
const Flags = require("./flags");
exports.Flags = Flags;
const Args = require("./args");
exports.Args = Args;
const help_1 = require("./help");
Object.defineProperty(exports, "CommandHelp", { enumerable: true, get: function () { return help_1.CommandHelp; } });
Object.defineProperty(exports, "HelpBase", { enumerable: true, get: function () { return help_1.HelpBase; } });
Object.defineProperty(exports, "Help", { enumerable: true, get: function () { return help_1.Help; } });
Object.defineProperty(exports, "loadHelpClass", { enumerable: true, get: function () { return help_1.loadHelpClass; } });
const util_1 = require("./help/util");
Object.defineProperty(exports, "toStandardizedId", { enumerable: true, get: function () { return util_1.toStandardizedId; } });
Object.defineProperty(exports, "toConfiguredId", { enumerable: true, get: function () { return util_1.toConfiguredId; } });
const Parser = require("./parser");
exports.Parser = Parser;
const settings_1 = require("./settings");
Object.defineProperty(exports, "settings", { enumerable: true, get: function () { return settings_1.settings; } });
const ux = require("./cli-ux");
exports.ux = ux;
const stream_1 = require("./cli-ux/stream");
Object.defineProperty(exports, "stderr", { enumerable: true, get: function () { return stream_1.stderr; } });
Object.defineProperty(exports, "stdout", { enumerable: true, get: function () { return stream_1.stdout; } });
const performance_1 = require("./performance");
Object.defineProperty(exports, "Performance", { enumerable: true, get: function () { return performance_1.Performance; } });
const flush = ux.flush;
exports.flush = flush;
function checkCWD() {
    try {
        process.cwd();
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            stream_1.stderr.write('WARNING: current directory does not exist\n');
        }
    }
}
checkCWD();
