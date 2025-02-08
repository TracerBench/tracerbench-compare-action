/**
 * Convert a path from the compiled ./lib files to the ./src typescript source
 * this is for developing typescript plugins/CLIs
 * if there is a tsconfig and the original sources exist, it attempts to require ts-node
 */
export declare function tsPath(root: string, orig: string, type?: string): string;
export declare function tsPath(root: string, orig: string | undefined, type?: string): string | undefined;
