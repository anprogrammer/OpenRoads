/// <reference path="../Data/BitStream.ts" />
/// <reference path="../Data/BinaryReader.ts" />
var Levels;
(function (Levels) {
    var LevelLoader = (function () {
        function LevelLoader(levelNumber, levelStartByte, levelSize) {
            this.levelNumber = levelNumber;
            this.levelStartByte = levelStartByte;
            this.levelSize = levelSize;
        }
        LevelLoader.prototype.load = function (stream) {
            stream.setPosition(this.levelStartByte * 8);
            var reader = new Data.BinaryReader(stream);
            var gravity = reader.getUint16();
            var fuel = reader.getUint16();
            var oxygen = reader.getUint16();

            var colors = [];
            for (var i = 0; i < 72; i++) {
                colors.push(new Data.Color(reader.getUint8() * 4, reader.getUint8() * 4, reader.getUint8() * 4));
            }

            var bytes = [];
            var stream2 = new Data.BinaryReader(new Data.CompressedByteStream(reader));
            for (var i = 0; i < this.levelSize; i++) {
                bytes.push(stream2.getUint8());
            }

            return new Levels.Level(gravity, fuel, oxygen, colors, bytes);
        };
        return LevelLoader;
    })();
    Levels.LevelLoader = LevelLoader;
    var MultiLevelLoader = (function () {
        function MultiLevelLoader(stream) {
            this.Levels = [];
            var reader = new Data.BinaryReader(stream);
            var l1Start = reader.getUint16(), l1Size = reader.getUint16();
            var additionalLevelCount = l1Start * 8;

            var levels = [];
            levels.push(new LevelLoader(1, l1Start, l1Size));
            for (var i = 0; i < additionalLevelCount; i++) {
                levels.push(new LevelLoader(i + 2, l1Start, l1Size));
            }

            for (var i = 0; i < levels.length; i++) {
                this.Levels.push(levels[i].load(stream));
            }
        }
        return MultiLevelLoader;
    })();
    Levels.MultiLevelLoader = MultiLevelLoader;
})(Levels || (Levels = {}));
//# sourceMappingURL=Loader.js.map
