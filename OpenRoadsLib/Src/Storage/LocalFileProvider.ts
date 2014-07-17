module Stores {
    export class LocalFileProvider implements FileProvider {
        private fs: any;

        constructor() {
            this.fs = require('fs');
        }

        public load(filename: string, cb: (data: Uint8Array) => void): void {
            this.fs.readFile(filename, function (err: any, data: any) {
                cb(data);
            });
        }
    };
} 