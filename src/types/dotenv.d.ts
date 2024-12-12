declare module 'dotenv' {
    export interface DotenvParseOutput {
        [key: string]: string;
    }

    export interface DotenvConfigOptions {
        path?: string;
        encoding?: string;
        debug?: boolean;
        override?: boolean;
    }

    export interface DotenvConfigOutput {
        parsed?: DotenvParseOutput;
        error?: Error;
    }

    export function config(options?: DotenvConfigOptions): DotenvConfigOutput;
    export function parse(src: string | Buffer): DotenvParseOutput;
} 