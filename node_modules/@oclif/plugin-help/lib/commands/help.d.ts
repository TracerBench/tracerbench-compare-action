import { Command } from '@oclif/core';
export default class HelpCommand extends Command {
    static description: string;
    static flags: {
        'nested-commands': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    static args: {
        commands: import("@oclif/core/lib/interfaces/parser").Arg<string | undefined, Record<string, unknown>>;
    };
    static strict: boolean;
    run(): Promise<void>;
}
