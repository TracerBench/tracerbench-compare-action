"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
const url_1 = require("url");
const chalk = require("chalk");
const util_1 = require("util");
const cli_ux_1 = require("./cli-ux");
const config_1 = require("./config");
const Errors = require("./errors");
const Parser = require("./parser");
const util_2 = require("./help/util");
const flags_1 = require("./flags");
const util_3 = require("./util");
const stream_1 = require("./cli-ux/stream");
const pjson = (0, util_3.requireJson)(__dirname, '..', 'package.json');
/**
 * swallows stdout epipe errors
 * this occurs when stdout closes such as when piping to head
 */
stream_1.stdout.on('error', (err) => {
    if (err && err.code === 'EPIPE')
        return;
    throw err;
});
const jsonFlag = {
    json: (0, flags_1.boolean)({
        description: 'Format output as json.',
        helpGroup: 'GLOBAL',
    }),
};
/**
 * An abstract class which acts as the base for each command
 * in your project.
 */
class Command {
    static get enableJsonFlag() {
        return this._enableJsonFlag;
    }
    static set enableJsonFlag(value) {
        this._enableJsonFlag = value;
        if (value === true) {
            this.baseFlags = jsonFlag;
        }
        else {
            delete this.baseFlags?.json;
            this.flags = {}; // force the flags setter to run
            delete this.flags?.json;
        }
    }
    static get '--'() {
        return Command['_--'];
    }
    static set '--'(value) {
        Command['_--'] = value;
    }
    get passThroughEnabled() {
        return Command['_--'];
    }
    /**
     * instantiate and run the command
     *
     * @param {Command.Class} this - the command class
     * @param {string[]} argv argv
     * @param {LoadOptions} opts options
     * @returns {Promise<unknown>} result
     */
    static async run(argv, opts) {
        if (!argv)
            argv = process.argv.slice(2);
        // Handle the case when a file URL string is passed in such as 'import.meta.url'; covert to file path.
        if (typeof opts === 'string' && opts.startsWith('file://')) {
            opts = (0, url_1.fileURLToPath)(opts);
        }
        const config = await config_1.Config.load(opts || require.main?.filename || __dirname);
        const cmd = new this(argv, config);
        if (!cmd.id) {
            const id = cmd.constructor.name.toLowerCase();
            cmd.id = id;
            cmd.ctor.id = id;
        }
        return cmd._run();
    }
    static get baseFlags() {
        return this._baseFlags;
    }
    static set baseFlags(flags) {
        this._baseFlags = Object.assign({}, this.baseFlags, flags);
        this.flags = {}; // force the flags setter to run
    }
    static get flags() {
        return this._flags;
    }
    static set flags(flags) {
        this._flags = Object.assign({}, this._flags ?? {}, this.baseFlags, flags);
    }
    constructor(argv, config) {
        this.argv = argv;
        this.config = config;
        this.id = this.ctor.id;
        try {
            this.debug = require('debug')(this.id ? `${this.config.bin}:${this.id}` : this.config.bin);
        }
        catch {
            this.debug = () => { };
        }
    }
    get ctor() {
        return this.constructor;
    }
    async _run() {
        let err;
        let result;
        try {
            // remove redirected env var to allow subsessions to run autoupdated client
            this.removeEnvVar('REDIRECTED');
            await this.init();
            result = await this.run();
        }
        catch (error) {
            err = error;
            await this.catch(error);
        }
        finally {
            await this.finally(err);
        }
        if (result && this.jsonEnabled())
            this.logJson(this.toSuccessJson(result));
        return result;
    }
    exit(code = 0) {
        Errors.exit(code);
    }
    warn(input) {
        if (!this.jsonEnabled())
            Errors.warn(input);
        return input;
    }
    error(input, options = {}) {
        return Errors.error(input, options);
    }
    log(message = '', ...args) {
        if (!this.jsonEnabled()) {
            message = typeof message === 'string' ? message : (0, util_1.inspect)(message);
            stream_1.stdout.write((0, util_1.format)(message, ...args) + '\n');
        }
    }
    logToStderr(message = '', ...args) {
        if (!this.jsonEnabled()) {
            message = typeof message === 'string' ? message : (0, util_1.inspect)(message);
            stream_1.stderr.write((0, util_1.format)(message, ...args) + '\n');
        }
    }
    /**
     * Determine if the command is being run with the --json flag in a command that supports it.
     *
     * @returns {boolean} true if the command supports json and the --json flag is present
     */
    jsonEnabled() {
        // if the command doesn't support json, return false
        if (!this.ctor.enableJsonFlag)
            return false;
        // if the command parameter pass through is enabled, return true if the --json flag is before the '--' separator
        if (this.passThroughEnabled) {
            const ptIndex = this.argv.indexOf('--');
            const jsonIndex = this.argv.indexOf('--json');
            return jsonIndex > -1 && (ptIndex === -1 || jsonIndex < ptIndex);
        }
        return this.argv.includes('--json') || this.config.scopedEnvVar?.('CONTENT_TYPE')?.toLowerCase() === 'json';
    }
    async init() {
        this.debug('init version: %s argv: %o', this.ctor._base, this.argv);
        if (this.config.debug)
            Errors.config.debug = true;
        if (this.config.errlog)
            Errors.config.errlog = this.config.errlog;
        const g = global;
        g['http-call'] = g['http-call'] || {};
        g['http-call'].userAgent = this.config.userAgent;
        this.warnIfCommandDeprecated();
    }
    warnIfFlagDeprecated(flags) {
        for (const flag of Object.keys(flags)) {
            const flagDef = this.ctor.flags[flag];
            const deprecated = flagDef?.deprecated;
            if (deprecated) {
                this.warn((0, util_2.formatFlagDeprecationWarning)(flag, deprecated));
            }
            const deprecateAliases = flagDef?.deprecateAliases;
            const aliases = (flagDef?.aliases ?? []).map(a => a.length === 1 ? `-${a}` : `--${a}`);
            if (deprecateAliases && aliases.length > 0) {
                const foundAliases = aliases.filter(alias => this.argv.some(a => a.startsWith(alias)));
                for (const alias of foundAliases) {
                    let preferredUsage = `--${flagDef?.name}`;
                    if (flagDef?.char) {
                        preferredUsage += ` | -${flagDef?.char}`;
                    }
                    this.warn((0, util_2.formatFlagDeprecationWarning)(alias, { to: preferredUsage }));
                }
            }
        }
    }
    warnIfCommandDeprecated() {
        const [id] = (0, util_2.normalizeArgv)(this.config);
        if (this.ctor.deprecateAliases && this.ctor.aliases.includes(id)) {
            const cmdName = (0, util_2.toConfiguredId)(this.ctor.id, this.config);
            const aliasName = (0, util_2.toConfiguredId)(id, this.config);
            this.warn((0, util_2.formatCommandDeprecationWarning)(aliasName, { to: cmdName }));
        }
        if (this.ctor.state === 'deprecated') {
            const cmdName = (0, util_2.toConfiguredId)(this.ctor.id, this.config);
            this.warn((0, util_2.formatCommandDeprecationWarning)(cmdName, this.ctor.deprecationOptions));
        }
    }
    async parse(options, argv = this.argv) {
        if (!options)
            options = this.ctor;
        const opts = { context: this, ...options };
        // the spread operator doesn't work with getters so we have to manually add it here
        opts.flags = options?.flags;
        opts.args = options?.args;
        const results = await Parser.parse(argv, opts);
        this.warnIfFlagDeprecated(results.flags ?? {});
        return results;
    }
    async catch(err) {
        process.exitCode = process.exitCode ?? err.exitCode ?? 1;
        if (this.jsonEnabled()) {
            this.logJson(this.toErrorJson(err));
        }
        else {
            if (!err.message)
                throw err;
            try {
                cli_ux_1.ux.action.stop(chalk.bold.red('!'));
            }
            catch { }
            throw err;
        }
    }
    async finally(_) {
        try {
            const config = Errors.config;
            if (config.errorLogger)
                await config.errorLogger.flush();
        }
        catch (error) {
            console.error(error);
        }
    }
    toSuccessJson(result) {
        return result;
    }
    toErrorJson(err) {
        return { error: err };
    }
    logJson(json) {
        cli_ux_1.ux.styledJSON(json);
    }
    removeEnvVar(envVar) {
        const keys = [];
        try {
            keys.push(...this.config.scopedEnvVarKeys(envVar));
        }
        catch {
            keys.push(this.config.scopedEnvVarKey(envVar));
        }
        keys.map(key => delete process.env[key]);
    }
}
exports.Command = Command;
Command._base = `${pjson.name}@${pjson.version}`;
/** An array of aliases for this command. */
Command.aliases = [];
/** When set to false, allows a variable amount of arguments */
Command.strict = true;
/** An order-dependent object of arguments for the command */
Command.args = {};
Command.hasDynamicHelp = false;
Command['_--'] = false;
Command._enableJsonFlag = false;
