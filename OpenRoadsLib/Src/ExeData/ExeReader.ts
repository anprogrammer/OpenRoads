module ExeData {
    export class ExeReader implements Data.RandomAccessBitStream {
        private stream: Data.RandomAccessBitStream;
        private offset: number;

        constructor(stream: Data.RandomAccessBitStream) {
            this.stream = stream;
            var reader = new Data.BinaryReader(stream);
            stream.setPosition(8 * 8);
            this.offset = reader.getUint16() * 16 + 0x66E * 16;
            this.setPosition(0);
        }

        public getBit(): number {
            return this.stream.getBit();
        }

        public eof(): boolean {
            return this.stream.eof();
        }

        public setPosition(bit: number): void {
            this.stream.setPosition(bit + this.offset * 8);
        }

        public getPosition(): number {
            return this.stream.getPosition() - this.offset * 8;
        }
    }
}