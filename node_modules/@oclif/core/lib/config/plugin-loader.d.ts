import { Plugin as IPlugin } from '../interfaces/plugin';
type PluginLoaderOptions = {
    root: string;
    plugins?: IPlugin[] | PluginsMap;
};
type LoadOpts = {
    devPlugins?: boolean;
    userPlugins?: boolean;
    dataDir: string;
    rootPlugin: IPlugin;
    force?: boolean;
};
type PluginsMap = Map<string, IPlugin>;
export default class PluginLoader {
    options: PluginLoaderOptions;
    plugins: PluginsMap;
    errors: (string | Error)[];
    private pluginsProvided;
    constructor(options: PluginLoaderOptions);
    loadRoot(): Promise<IPlugin>;
    loadChildren(opts: LoadOpts): Promise<{
        plugins: PluginsMap;
        errors: (string | Error)[];
    }>;
    private loadCorePlugins;
    private loadDevPlugins;
    private loadUserPlugins;
    private loadPlugins;
}
export {};
