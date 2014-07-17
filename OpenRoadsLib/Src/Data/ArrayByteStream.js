/// <reference path="ByteStream.ts" />
var Data;
(function (Data) {
    var ArrayByteStream = (function () {
        function ArrayByteStream(data) {
            this.data = data;
            this.idx = 0;
        }
        ArrayByteStream.prototype.getUint8 = function () {
            return this.data[this.idx++];
        };

        ArrayByteStream.prototype.eof = function () {
            return this.idx == this.data.length;
        };
        return ArrayByteStream;
    })();
    Data.ArrayByteStream = ArrayByteStream;
})(Data || (Data = {}));
//# sourceMappingURL=ArrayByteStream.js.map
