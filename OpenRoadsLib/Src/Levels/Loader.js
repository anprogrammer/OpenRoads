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

            var levelWidth = 7, levelLength = bytes.length / 2 / levelWidth;

            var level = new Levels.Level(this.levelNumber > 0 ? 'Level ' + this.levelNumber : 'Demo Level', gravity, fuel, oxygen, colors);
            var cells = [];
            for (var x = 0; x < levelWidth; x++) {
                var col = [];
                cells.push(col);
                for (var y = 0; y < levelLength; y++) {
                    var idx = x * 2 + y * 14;
                    var colorLow = bytes[idx] & 0xF, colorHigh = bytes[idx] >> 4, color = colorLow || colorHigh;
                    col.push(new Levels.Cell(level, colorLow, colorHigh, bytes[idx], bytes[idx + 1]));
                }
            }
            level.Cells = cells;
            return level;
        };
        return LevelLoader;
    })();
    Levels.LevelLoader = LevelLoader;

    var MultiLevelLoader = (function () {
        function MultiLevelLoader(stream) {
            this.Levels = [];
            var reader = new Data.BinaryReader(stream);
            var l1Start = reader.getUint16(), l1Size = reader.getUint16();
            var level1StartBit = l1Start * 8;

            var levels = [];
            levels.push(new LevelLoader(0, l1Start, l1Size));
            for (var i = 0; stream.getPosition() < level1StartBit; i++) {
                levels.push(new LevelLoader(i + 1, reader.getUint16(), reader.getUint16()));
            }

            for (var i = 0; i < levels.length; i++) {
                this.Levels.push(levels[i].load(stream));
            }
        }
        return MultiLevelLoader;
    })();
    Levels.MultiLevelLoader = MultiLevelLoader;
})(Levels || (Levels = {}));
