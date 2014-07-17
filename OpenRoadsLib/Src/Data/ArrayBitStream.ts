/// <reference path="BitStream.ts" />
module Data {
    export class ArrayBitStream implements RandomAccessBitStream {
        private data: number[];
        private idx: number;
        constructor(data: number[]) {
            this.data = data;
            this.idx = 0;
        }

        public getBit(): number {
            var idx = this.idx;
            this.idx++;

            var byteIdx = Math.floor(idx / 8),
                bitIdx = 7 - (idx % 8);

            return (this.data[byteIdx] & (1 << bitIdx)) >> bitIdx;
        }

        public setPosition(idx: number) {
            this.idx = idx;
        }

        public getPosition(): number {
            return this.idx;
        }

        public eof(): boolean {
            return this.idx >= (this.data.length * 8);
        }

        public getLength(): number {
            return this.data.length * 8;
        }
    }
} 