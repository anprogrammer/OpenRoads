/// <reference path="BitStream.ts" />
/// <reference path="ArrayBitStream.ts" />
module Data {
    export class CompressedByteStream implements BitStream {
        private source: BinaryReader;

        private len1: number;
        private len2: number;
        private len3: number;
        private len4: number;
        private buffer: number[] = [];
        private outputStream: BitStream;

        constructor(stream: BinaryReader) {
            this.source = stream;
            this.len1 = this.source.getUint8();
            this.len2 = this.source.getUint8();
            this.len3 = this.source.getUint8();
            this.len4 = (1 << this.len2);
            this.outputStream = new ArrayBitStream(this.buffer);
        }

        private copySet(offset: number) {
            var copyStart = this.buffer.length - 2 - offset;
            var bytesToCopy = this.source.getBits(this.len1) + 1;
            for (var i: number = 0; i <= bytesToCopy; i++) {
                this.buffer.push(this.buffer[copyStart + i]);
            }
        }

        private advanceBuffer(): void {
            if (this.source.getBit() == 1) {
                if (this.source.getBit() == 1) { //Raw byte follows
                    this.buffer.push(this.source.getUint8());
                } else { //Large copy
                    var copySize: number = this.source.getBits(this.len3) + this.len4;
                    this.copySet(copySize);
                }
            } else {
                var copySize: number = this.source.getBits(this.len2);
                this.copySet(copySize);
            }
        }

        public getBit(): number {
            if (this.outputStream.eof()) {
                this.advanceBuffer();
            }
            return this.outputStream.getBit();
        }

        public eof(): boolean {
            return this.source.eof();
        }
    }
} 