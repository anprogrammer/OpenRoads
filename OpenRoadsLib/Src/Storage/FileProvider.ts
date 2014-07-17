module Stores {
    export interface FileProvider {
        load(filename: string, cb: (data: Uint8Array) => void): void;
    };
}