"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Performance = void 0;
const perf_hooks_1 = require("perf_hooks");
const settings_1 = require("./settings");
class Marker {
    constructor(name, details = {}) {
        this.name = name;
        this.details = details;
        this.stopped = false;
        this.startMarker = `${this.name}-start`;
        this.stopMarker = `${this.name}-stop`;
        const [caller, scope] = name.split('#');
        const [module, method] = caller.split('.');
        this.module = module;
        this.method = method;
        this.scope = scope;
        perf_hooks_1.performance.mark(this.startMarker);
    }
    addDetails(details) {
        this.details = { ...this.details, ...details };
    }
    stop() {
        this.stopped = true;
        perf_hooks_1.performance.mark(this.stopMarker);
    }
    measure() {
        perf_hooks_1.performance.measure(this.name, this.startMarker, this.stopMarker);
    }
}
class Performance {
    static get enabled() {
        return settings_1.settings.performanceEnabled ?? false;
    }
    static get results() {
        if (!Performance.enabled)
            return [];
        if (Performance._results.length > 0)
            return Performance._results;
        throw new Error('Perf results not available. Did you forget to call await Performance.collect()?');
    }
    static getResult(name) {
        return Performance.results.find(r => r.name === name);
    }
    static get highlights() {
        if (!Performance.enabled)
            return {};
        if (Performance._highlights)
            return Performance._highlights;
        throw new Error('Perf results not available. Did you forget to call await Performance.collect()?');
    }
    /**
     * Add a new performance marker
     *
     * @param name Name of the marker. Use `module.method#scope` format
     * @param details Arbitrary details to attach to the marker
     * @returns Marker instance
     */
    static mark(name, details = {}) {
        if (!Performance.enabled)
            return;
        const marker = new Marker(name, details);
        Performance.markers[marker.name] = marker;
        return marker;
    }
    /**
     * Collect performance results into static Performance.results
     *
     * @returns Promise<void>
     */
    static async collect() {
        if (!Performance.enabled)
            return;
        if (Performance._results.length > 0)
            return;
        const markers = Object.values(Performance.markers);
        if (markers.length === 0)
            return;
        for (const marker of markers.filter(m => !m.stopped)) {
            marker.stop();
        }
        return new Promise(resolve => {
            const perfObserver = new perf_hooks_1.PerformanceObserver(items => {
                for (const entry of items.getEntries()) {
                    if (Performance.markers[entry.name]) {
                        const marker = Performance.markers[entry.name];
                        Performance._results.push({
                            name: entry.name,
                            module: marker.module,
                            method: marker.method,
                            scope: marker.scope,
                            duration: entry.duration,
                            details: marker.details,
                        });
                    }
                }
                const command = Performance.results.find(r => r.name.startsWith('config.runCommand'));
                const commandLoadTime = command ? Performance.getResult(`plugin.findCommand#${command.details.plugin}.${command.details.command}`)?.duration ?? 0 : 0;
                const pluginLoadTimes = Object.fromEntries(Performance.results
                    .filter(({ name }) => name.startsWith('plugin.load#'))
                    .sort((a, b) => b.duration - a.duration)
                    .map(({ scope, duration }) => [scope, duration]));
                const hookRunTimes = Performance.results
                    .filter(({ name }) => name.startsWith('config.runHook#'))
                    .reduce((acc, perfResult) => {
                    const event = perfResult.details.event;
                    if (event) {
                        if (!acc[event])
                            acc[event] = {};
                        acc[event][perfResult.scope] = perfResult.duration;
                    }
                    else {
                        const event = perfResult.scope;
                        if (!acc[event])
                            acc[event] = {};
                        acc[event].total = perfResult.duration;
                    }
                    return acc;
                }, {});
                const pluginLoadTimeByType = Object.fromEntries(Performance.results
                    .filter(({ name }) => name.startsWith('config.loadPlugins#'))
                    .sort((a, b) => b.duration - a.duration)
                    .map(({ scope, duration }) => [scope, duration]));
                Performance._highlights = {
                    configLoadTime: Performance.getResult('config.load')?.duration ?? 0,
                    runTime: Performance.getResult('main.run')?.duration ?? 0,
                    initTime: Performance.getResult('main.run#init')?.duration ?? 0,
                    commandLoadTime,
                    pluginLoadTimes,
                    hookRunTimes,
                    corePluginsLoadTime: pluginLoadTimeByType.core ?? 0,
                    userPluginsLoadTime: pluginLoadTimeByType.user ?? 0,
                    linkedPluginsLoadTime: pluginLoadTimeByType.link ?? 0,
                };
                resolve();
            });
            perfObserver.observe({ entryTypes: ['measure'], buffered: true });
            for (const marker of markers) {
                try {
                    marker.measure();
                }
                catch {
                    // ignore
                }
            }
            perf_hooks_1.performance.clearMarks();
        });
    }
    /**
     * Add debug logs for plugin loading performance
     * @returns void
     */
    static debug() {
        if (!Performance.enabled)
            return;
        const debug = require('debug')('perf');
        debug('Init Time: %sms', Performance.highlights.initTime.toFixed(4));
        debug('Config Load Time: %sms', Performance.highlights.configLoadTime.toFixed(4));
        debug('Command Load Time: %sms', Performance.highlights.commandLoadTime.toFixed(4));
        debug('Execution Time: %sms', Performance.highlights.runTime.toFixed(4));
        debug('Core Plugin Load Time: %sms', Performance.highlights.corePluginsLoadTime.toFixed(4));
        debug('User Plugin Load Time: %sms', Performance.highlights.userPluginsLoadTime.toFixed(4));
        debug('Linked Plugin Load Time: %sms', Performance.highlights.linkedPluginsLoadTime.toFixed(4));
        debug('Plugin Load Times:');
        for (const [plugin, duration] of Object.entries(Performance.highlights.pluginLoadTimes)) {
            debug(`  ${plugin}: ${duration.toFixed(4)}ms`);
        }
        debug('Hook Run Times:');
        for (const [event, runTimes] of Object.entries(Performance.highlights.hookRunTimes)) {
            debug(`  ${event}:`);
            for (const [plugin, duration] of Object.entries(runTimes)) {
                debug(`    ${plugin}: ${duration.toFixed(4)}ms`);
            }
        }
    }
}
exports.Performance = Performance;
Performance.markers = {};
Performance._results = [];
