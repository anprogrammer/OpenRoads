module Managers {
    export class StreamManager {
        private streams: { [s: string]: Uint8Array } = {};
        private filterBasePath: string = 'Data/';
        private basePath: string = 'Data/';
        private provider: Stores.FileProvider;

        constructor(provider: Stores.FileProvider, basePath: string = 'Data/') {
            this.provider = provider;
            this.basePath = basePath;
        }

        load(filename: string): P.Promise<Uint8Array> {
            var p = P.defer<Uint8Array>();
            this.provider.load(filename.replace(this.filterBasePath, this.basePath), (result) => {
                this.streams[filename.toUpperCase().split('/')[1]] = result;
                p.resolve(result);
            });

            return p.promise();
        }

        loadMultiple(filenames: string[]): P.Promise<any[]> {
            var promises = filenames.map((f) => this.load(f));
            return P.when.apply(null, promises);
        }

        getStream(filename: string) {
            filename = filename.toUpperCase();
            if (!(filename in this.streams)) {
                throw filename + " not loaded";
            }
            return new Data.ArrayBitStream(<any>this.streams[filename]);
        }

        getRawArray(filename: string): Uint8Array {
            filename = filename.toUpperCase();
            if (!(filename in this.streams)) {
                throw filename + " not loaded";
            }
            return this.streams[filename];
        }

        getText(filename: string) {
            filename = filename.toUpperCase();
            if (!(filename in this.streams)) {
                throw filename + " not loaded";
            }
            return String.fromCharCode.apply(null, this.streams[filename]);
        }
    }
} 