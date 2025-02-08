import { Options, Plugin as IPlugin } from '../interfaces/plugin';
import { Config as IConfig, ArchTypes, PlatformTypes, LoadOptions, VersionDetails } from '../interfaces/config';
import { Hook, Hooks, PJSON, Topic } from '../interfaces';
import { Command } from '../command';
export declare class Config implements IConfig {
    options: Options;
    private _base;
    arch: ArchTypes;
    bin: string;
    binPath?: string;
    cacheDir: string;
    channel: string;
    configDir: string;
    dataDir: string;
    debug: number;
    dirname: string;
    errlog: string;
    flexibleTaxonomy: boolean;
    home: string;
    name: string;
    npmRegistry?: string;
    pjson: PJSON.CLI;
    platform: PlatformTypes;
    plugins: IPlugin[];
    root: string;
    shell: string;
    topicSeparator: ':' | ' ';
    userAgent: string;
    userPJSON?: PJSON.User;
    valid: boolean;
    version: string;
    windows: boolean;
    binAliases?: string[];
    nsisCustomization?: string;
    protected warned: boolean;
    private commandPermutations;
    private topicPermutations;
    private _commands;
    private _topics;
    private _commandIDs;
    private pluginLoader;
    private rootPlugin;
    constructor(options: Options);
    static load(opts?: LoadOptions): Promise<Config>;
    load(): Promise<void>;
    loadPluginsAndCommands(opts?: {
        force: boolean;
    }): Promise<void>;
    runHook<T extends keyof Hooks>(event: T, opts: Hooks[T]['options'], timeout?: number, captureErrors?: boolean): Promise<Hook.Result<Hooks[T]['return']>>;
    runCommand<T = unknown>(id: string, argv?: string[], cachedCommand?: Command.Loadable | null): Promise<T>;
    scopedEnvVar(k: string): string | undefined;
    scopedEnvVarTrue(k: string): boolean;
    /**
     * this DOES NOT account for bin aliases, use scopedEnvVarKeys instead which will account for bin aliases
     * @param {string} k, the unscoped key you want to get the value for
     * @returns {string} returns the env var key
     */
    scopedEnvVarKey(k: string): string;
    /**
     * gets the scoped env var keys for a given key, including bin aliases
     * @param {string} k, the env key e.g. 'debug'
     * @returns {string[]} e.g. ['SF_DEBUG', 'SFDX_DEBUG']
     */
    scopedEnvVarKeys(k: string): string[];
    findCommand(id: string, opts: {
        must: true;
    }): Command.Loadable;
    findCommand(id: string, opts?: {
        must: boolean;
    }): Command.Loadable | undefined;
    findTopic(id: string, opts: {
        must: true;
    }): Topic;
    findTopic(id: string, opts?: {
        must: boolean;
    }): Topic | undefined;
    /**
     * Find all command ids that include the provided command id.
     *
     * For example, if the command ids are:
     * - foo:bar:baz
     * - one:two:three
     *
     * `bar` would return `foo:bar:baz`
     *
     * @param partialCmdId string
     * @param argv string[] process.argv containing the flags and arguments provided by the user
     * @returns string[]
     */
    findMatches(partialCmdId: string, argv: string[]): Command.Loadable[];
    /**
     * Returns an array of all commands. If flexible taxonomy is enabled then all permutations will be appended to the array.
     * @returns Command.Loadable[]
     */
    getAllCommands(): Command.Loadable[];
    /**
     * Returns an array of all command ids. If flexible taxonomy is enabled then all permutations will be appended to the array.
     * @returns string[]
     */
    getAllCommandIDs(): string[];
    get commands(): Command.Loadable[];
    get commandIDs(): string[];
    get topics(): Topic[];
    get versionDetails(): VersionDetails;
    s3Key(type: keyof PJSON.S3.Templates, ext?: '.tar.gz' | '.tar.xz' | IConfig.s3Key.Options, options?: IConfig.s3Key.Options): string;
    s3Url(key: string): string;
    getPluginsList(): IPlugin[];
    protected dir(category: 'cache' | 'data' | 'config'): string;
    protected windowsHome(): string | undefined;
    protected windowsHomedriveHome(): string | undefined;
    protected windowsUserprofileHome(): string | undefined;
    protected macosCacheDir(): string | undefined;
    protected _shell(): string;
    protected _debug(): number;
    protected warn(err: string | Error | {
        name: string;
        detail: string;
    }, scope?: string): void;
    protected get isProd(): boolean;
    private isJitPluginCommand;
    private getCmdLookupId;
    private getTopicLookupId;
    private loadCommands;
    private loadTopics;
    /**
     * This method is responsible for locating the correct plugin to use for a named command id
     * It searches the {Config} registered commands to match either the raw command id or the command alias
     * It is possible that more than one command will be found. This is due the ability of two distinct plugins to
     * create the same command or command alias.
     *
     * In the case of more than one found command, the function will select the command based on the order in which
     * the plugin is included in the package.json `oclif.plugins` list. The command that occurs first in the list
     * is selected as the command to run.
     *
     * Commands can also be present from either an install or a link. When a command is one of these and a core plugin
     * is present, this function defers to the core plugin.
     *
     * If there is not a core plugin command present, this function will return the first
     * plugin as discovered (will not change the order)
     *
     * @param commands commands to determine the priority of
     * @returns command instance {Command.Loadable} or undefined
     */
    private determinePriority;
    /**
      * Insert legacy plugins
      *
      * Replace invalid CLI plugins (cli-engine plugins, mostly Heroku) loaded via `this.loadPlugins`
      * with oclif-compatible ones returned by @oclif/plugin-legacy init hook.
      *
      * @param plugins array of oclif-compatible plugins
      * @returns void
      */
    private insertLegacyPlugins;
}
export declare function toCached(c: Command.Class, plugin?: IPlugin | undefined, isWritingManifest?: boolean): Promise<Command.Cached>;
