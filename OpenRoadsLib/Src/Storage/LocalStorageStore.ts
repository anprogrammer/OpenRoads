module Stores {
    export class LocalStorageStore implements KVStore {
        setValue(k: string, v: string): void {
            localStorage.setItem(k, v);
        }
        getValue(k: string): string {
            return localStorage.getItem(k);
        }
    }
} 