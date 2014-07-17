module Stores {
    export class FSStore implements KVStore {
        private filename: string = 'Data/settings.json';
        private fs: any;
        private opts: { [s: string]: string } = {};
        constructor() {
            this.fs = require('fs');
            try {
            this.opts = JSON.parse(this.fs.readFileSync(this.filename, 'utf-8'));
            } catch (e) {
            }
        }

        public getValue(k: string): string {
            return (k in this.opts) ? this.opts[k] : null;
        }

        public setValue(k: string, v: string): void {
            this.opts[k] = v;
            this.fs.writeFileSync(this.filename, JSON.stringify(this.opts));
        }
    }
} 