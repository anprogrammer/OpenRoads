module Levels {
    export class LevelLoader {
        private levelNumber: number;
        private levelStartByte: number;
        private levelSize: number;

        constructor(levelNumber: number, levelStartByte: number, levelSize: number) {
            this.levelNumber = levelNumber;
            this.levelStartByte = levelStartByte;
            this.levelSize = levelSize;
        }

        public load(stream: Data.RandomAccessBitStream): Level {
            stream.setPosition(this.levelStartByte * 8);
            var reader = new Data.BinaryReader(stream);
            var gravity: number = reader.getUint16();
            var fuel: number = reader.getUint16();
            var oxygen: number = reader.getUint16();

            var colors: Data.Color[] = [];
            for (var i = 0; i < 72; i++) {
                colors.push(new Data.Color(reader.getUint8() * 4, reader.getUint8() * 4, reader.getUint8() * 4));
            }

            var bytes: number[] = [];
            var stream2 = new Data.BinaryReader(new Data.CompressedByteStream(reader));
            for (var i = 0; i < this.levelSize; i++) {
                bytes.push(stream2.getUint8());
            }

            var levelWidth: number = 7,
                levelLength: number = bytes.length / 2 / levelWidth;

            var level = new Level(this.levelNumber > 0 ? 'Level ' + this.levelNumber : 'Demo Level', gravity, fuel, oxygen, colors);
            var cells: Cell[][] = [];
            for (var x: number = 0; x < levelWidth; x++) {
                var col: Cell[] = [];
                cells.push(col);
                for (var y: number = 0; y < levelLength; y++) {
                    var idx = x * 2 + y * 14;
                    var colorLow = bytes[idx] & 0xF, colorHigh = bytes[idx] >> 4, color = colorLow || colorHigh;
                    col.push(new Cell(level,colorLow, colorHigh, bytes[idx], bytes[idx + 1]));
                }
            }
            level.Cells = cells;
            return level;
        }
    }

    export class MultiLevelLoader {
        public Levels: Level[] = [];
        constructor(stream: Data.RandomAccessBitStream) {
            var reader = new Data.BinaryReader(stream);
            var l1Start: number = reader.getUint16(),
                l1Size: number = reader.getUint16();
            var level1StartBit = l1Start * 8;

            var levels: LevelLoader[] = [];
            levels.push(new LevelLoader(0, l1Start, l1Size));
            for (var i: number = 0; stream.getPosition() < level1StartBit; i++) {
                levels.push(new LevelLoader(i + 1, reader.getUint16(), reader.getUint16()));
            }

            for (var i: number = 0; i < levels.length; i++) {
                this.Levels.push(levels[i].load(stream));
            }
        }
    }
} 