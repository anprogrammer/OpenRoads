/// <reference path="BitStream.ts"  />
var Data;
(function (Data) {
    var BinaryReader = (function () {
        function BinaryReader(stream) {
            this.stream = stream;
        }
        BinaryReader.prototype.getBit = function () {
            return this.stream.getBit();
        };

        BinaryReader.prototype.getBits = function (n) {
            var byte = 0;
            for (var i = 0; i < n; i++) {
                byte |= this.getBit() * (1 << i);
            }
            return byte;
        };

        BinaryReader.prototype.getUint8 = function () {
            return this.getBits(8);
        };

        BinaryReader.prototype.getUint16 = function () {
            return this.getUint8() | (this.getUint8() << 8);
        };

        BinaryReader.prototype.getUint32 = function () {
            return this.getUint16() | (this.getUint16() << 16);
        };

        BinaryReader.prototype.eof = function () {
            return this.stream.eof();
        };
        return BinaryReader;
    })();
    Data.BinaryReader = BinaryReader;
})(Data || (Data = {}));
//# sourceMappingURL=BinaryReader.js.map
