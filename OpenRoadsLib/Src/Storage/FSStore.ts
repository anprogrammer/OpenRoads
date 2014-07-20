module Stores {
    export class FSStore implements KVStore {
        private filename: string;
        private fs: any;
        private opts: { [s: string]: string } = {};
        constructor(prefix: string) {
            this.filename = 'Data/settings-' + prefix + '.json';
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