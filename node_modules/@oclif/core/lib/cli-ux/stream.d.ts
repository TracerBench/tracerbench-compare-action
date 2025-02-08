/**
 * A wrapper around process.stdout and process.stderr that allows us to mock out the streams for testing.
 */
declare class Stream {
    channel: 'stdout' | 'stderr';
    constructor(channel: 'stdout' | 'stderr');
    get isTTY(): boolean;
    getWindowSize(): number[];
    write(data: string): boolean;
    read(): boolean;
    on(event: string, listener: (...args: any[]) => void): Stream;
    once(event: string, listener: (...args: any[]) => void): Stream;
    emit(event: string, ...args: any[]): boolean;
}
export declare const stdout: Stream;
export declare const stderr: Stream;
export {};
