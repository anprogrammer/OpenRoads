module Stores {
    export class LocalStorageStore implements KVStore {
        private prefix: string;
        constructor(prefix: string) {
            this.prefix = prefix;
        }

        setValue(k: string, v: string): void {
            localStorage.setItem(this.prefix + '-' + k, v);
        }
        getValue(k: string): string {
            return localStorage.getItem(this.prefix + '-' + k);
        }
    }
} 