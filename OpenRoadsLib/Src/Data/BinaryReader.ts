/// <reference path="BitStream.ts"  />
module Data {
    export class BinaryReader implements BitStream {
        private stream: BitStream;

        constructor(stream: BitStream) {
            this.stream = stream;
        }

        public getBit(): number {
            return this.stream.getBit();
        }

        public getBits(n: number): number {
            var byte: number = 0;
            for (var i: number = 0; i < n; i++) {
                byte |= this.getBit() * (1 << (n - i - 1));
            }
            return byte;
        }

        public getUint8(): number {
            return this.getBits(8);
        }

        public getUint16(): number {
            return this.getUint8() | (this.getUint8() << 8);
        }

        public getUint32(): number {
            return this.getUint16() | (this.getUint16() << 16);
        }

        public getFixedLengthString(len: number) {
            var s = '';
            for (var i = 0; i < len; i++) {
                s += String.fromCharCode(this.getUint8());
            }
            return s;
        }

        public eof(): boolean {
            return this.stream.eof();
        }
    }
}