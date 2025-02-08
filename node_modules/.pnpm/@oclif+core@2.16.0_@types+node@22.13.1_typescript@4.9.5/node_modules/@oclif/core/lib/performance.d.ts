type Details = Record<string, string | boolean | number | string[]>;
type PerfResult = {
    name: string;
    duration: number;
    details: Details;
    module: string;
    method: string | undefined;
    scope: string | undefined;
};
type PerfHighlights = {
    configLoadTime: number;
    runTime: number;
    initTime: number;
    commandLoadTime: number;
    pluginLoadTimes: Record<string, number>;
    corePluginsLoadTime: number;
    userPluginsLoadTime: number;
    linkedPluginsLoadTime: number;
    hookRunTimes: Record<string, Record<string, number>>;
};
declare class Marker {
    name: string;
    details: Details;
    module: string;
    method: string;
    scope: string;
    stopped: boolean;
    private startMarker;
    private stopMarker;
    constructor(name: string, details?: Details);
    addDetails(details: Details): void;
    stop(): void;
    measure(): void;
}
export declare class Performance {
    private static markers;
    private static _results;
    private static _highlights;
    static get enabled(): boolean;
    static get results(): PerfResult[];
    static getResult(name: string): PerfResult | undefined;
    static get highlights(): PerfHighlights;
    /**
     * Add a new performance marker
     *
     * @param name Name of the marker. Use `module.method#scope` format
     * @param details Arbitrary details to attach to the marker
     * @returns Marker instance
     */
    static mark(name: string, details?: Details): Marker | undefined;
    /**
     * Collect performance results into static Performance.results
     *
     * @returns Promise<void>
     */
    static collect(): Promise<void>;
    /**
     * Add debug logs for plugin loading performance
     * @returns void
     */
    static debug(): void;
}
export {};
