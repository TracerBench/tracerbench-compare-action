"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const Plugin = require("./plugin");
const util_1 = require("./util");
const util_2 = require("../util");
const performance_1 = require("../performance");
// eslint-disable-next-line new-cap
const debug = (0, util_1.Debug)();
class PluginLoader {
    constructor(options) {
        this.options = options;
        this.plugins = new Map();
        this.errors = [];
        this.pluginsProvided = false;
        if (options.plugins) {
            this.pluginsProvided = true;
            this.plugins = Array.isArray(options.plugins) ? new Map(options.plugins.map(p => [p.name, p])) : options.plugins;
        }
    }
    async loadRoot() {
        let rootPlugin;
        if (this.pluginsProvided) {
            const plugins = [...this.plugins.values()];
            rootPlugin = plugins.find(p => p.root === this.options.root) ?? plugins[0];
        }
        else {
            rootPlugin = new Plugin.Plugin({ root: this.options.root });
            await rootPlugin.load();
        }
        this.plugins.set(rootPlugin.name, rootPlugin);
        return rootPlugin;
    }
    async loadChildren(opts) {
        if (!this.pluginsProvided || opts.force) {
            await this.loadUserPlugins(opts);
            await this.loadDevPlugins(opts);
            await this.loadCorePlugins(opts);
        }
        return { plugins: this.plugins, errors: this.errors };
    }
    async loadCorePlugins(opts) {
        if (opts.rootPlugin.pjson.oclif.plugins) {
            await this.loadPlugins(opts.rootPlugin.root, 'core', opts.rootPlugin.pjson.oclif.plugins);
        }
    }
    async loadDevPlugins(opts) {
        if (opts.devPlugins !== false) {
            // do not load oclif.devPlugins in production
            if ((0, util_2.isProd)())
                return;
            try {
                const devPlugins = opts.rootPlugin.pjson.oclif.devPlugins;
                if (devPlugins)
                    await this.loadPlugins(opts.rootPlugin.root, 'dev', devPlugins);
            }
            catch (error) {
                process.emitWarning(error);
            }
        }
    }
    async loadUserPlugins(opts) {
        if (opts.userPlugins !== false) {
            try {
                const userPJSONPath = path.join(opts.dataDir, 'package.json');
                debug('reading user plugins pjson %s', userPJSONPath);
                const pjson = await (0, util_1.loadJSON)(userPJSONPath);
                if (!pjson.oclif)
                    pjson.oclif = { schema: 1 };
                if (!pjson.oclif.plugins)
                    pjson.oclif.plugins = [];
                await this.loadPlugins(userPJSONPath, 'user', pjson.oclif.plugins.filter((p) => p.type === 'user'));
                await this.loadPlugins(userPJSONPath, 'link', pjson.oclif.plugins.filter((p) => p.type === 'link'));
            }
            catch (error) {
                if (error.code !== 'ENOENT')
                    process.emitWarning(error);
            }
        }
    }
    async loadPlugins(root, type, plugins, parent) {
        if (!plugins || plugins.length === 0)
            return;
        const mark = performance_1.Performance.mark(`config.loadPlugins#${type}`);
        debug('loading plugins', plugins);
        await Promise.all((plugins || []).map(async (plugin) => {
            try {
                const name = typeof plugin === 'string' ? plugin : plugin.name;
                const opts = {
                    name,
                    type,
                    root,
                };
                if (typeof plugin !== 'string') {
                    opts.tag = plugin.tag || opts.tag;
                    opts.root = plugin.root || opts.root;
                }
                if (this.plugins.has(name))
                    return;
                const pluginMarker = performance_1.Performance.mark(`plugin.load#${name}`);
                const instance = new Plugin.Plugin(opts);
                await instance.load();
                pluginMarker?.addDetails({
                    hasManifest: instance.hasManifest,
                    commandCount: instance.commands.length,
                    topicCount: instance.topics.length,
                    type: instance.type,
                    usesMain: Boolean(instance.pjson.main),
                    name: instance.name,
                });
                pluginMarker?.stop();
                this.plugins.set(instance.name, instance);
                if (parent) {
                    instance.parent = parent;
                    if (!parent.children)
                        parent.children = [];
                    parent.children.push(instance);
                }
                await this.loadPlugins(instance.root, type, instance.pjson.oclif.plugins || [], instance);
            }
            catch (error) {
                this.errors.push(error);
            }
        }));
        mark?.addDetails({ pluginCount: plugins.length });
        mark?.stop();
    }
}
exports.default = PluginLoader;
