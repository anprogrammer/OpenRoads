module Stores {
    export interface KVStore {
        setValue(k: string, v: string): void;
        getValue(k: string): string;
    }
} 