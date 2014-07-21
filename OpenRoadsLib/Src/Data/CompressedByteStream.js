var Data;
(function (Data) {
    var CompressedByteStream = (function () {
        function CompressedByteStream(stream) {
            this.buffer = [];
            this.source = stream;
            this.len1 = this.source.getUint8();
            this.len2 = this.source.getUint8();
            this.len3 = this.source.getUint8();
            this.len4 = (1 << this.len2);
            this.outputStream = new Data.ArrayBitStream(this.buffer);
        }
        CompressedByteStream.prototype.copySet = function (offset) {
            var copyStart = this.buffer.length - 2 - offset;
            var bytesToCopy = this.source.getBits(this.len1) + 1;
            for (var i = 0; i <= bytesToCopy; i++) {
                this.buffer.push(this.buffer[copyStart + i]);
            }
        };

        CompressedByteStream.prototype.advanceBuffer = function () {
            if (this.source.getBit() == 1) {
                if (this.source.getBit() == 1) {
                    this.buffer.push(this.source.getUint8());
                } else {
                    var copySize = this.source.getBits(this.len3) + this.len4;
                    this.copySet(copySize);
                }
            } else {
                var copySize = this.source.getBits(this.len2);
                this.copySet(copySize);
            }
        };

        CompressedByteStream.prototype.getBit = function () {
            if (this.outputStream.eof()) {
                this.advanceBuffer();
            }
            return this.outputStream.getBit();
        };

        CompressedByteStream.prototype.eof = function () {
            return this.source.eof();
        };
        return CompressedByteStream;
    })();
    Data.CompressedByteStream = CompressedByteStream;
})(Data || (Data = {}));
