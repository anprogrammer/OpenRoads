/// <reference path="BitStream.ts" />
var Data;
(function (Data) {
    var ArrayBitStream = (function () {
        function ArrayBitStream(data) {
            this.data = data;
            this.idx = 0;
        }
        ArrayBitStream.prototype.getBit = function () {
            var idx = this.idx;
            this.idx++;

            var byteIdx = Math.floor(idx / 8), bitIdx = idx % 8;

            return (this.data[byteIdx] & (1 << bitIdx)) >> bitIdx;
        };

        ArrayBitStream.prototype.setPosition = function (idx) {
            this.idx = idx;
        };

        ArrayBitStream.prototype.eof = function () {
            return this.idx == (this.data.length * 8);
        };
        return ArrayBitStream;
    })();
    Data.ArrayBitStream = ArrayBitStream;
})(Data || (Data = {}));
//# sourceMappingURL=ArrayBitStream.js.map
