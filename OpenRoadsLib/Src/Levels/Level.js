var Levels;
(function (Levels) {
    (function (TouchEffect) {
        TouchEffect[TouchEffect["None"] = 0] = "None";
        TouchEffect[TouchEffect["Accelerate"] = 1] = "Accelerate";
        TouchEffect[TouchEffect["Decelerate"] = 2] = "Decelerate";
        TouchEffect[TouchEffect["Kill"] = 3] = "Kill";
        TouchEffect[TouchEffect["Slide"] = 4] = "Slide";
        TouchEffect[TouchEffect["RefillOxygen"] = 5] = "RefillOxygen";
    })(Levels.TouchEffect || (Levels.TouchEffect = {}));
    var TouchEffect = Levels.TouchEffect;

    var CubeColors = (function () {
        function CubeColors(left, right, top, front) {
            this.Left = left;
            this.Right = right;
            this.Top = top;
            this.Front = front;
        }
        return CubeColors;
    })();
    Levels.CubeColors = CubeColors;

    var CubeProperties = (function () {
        function CubeProperties(height, colors, effect) {
            this.Height = height;
            this.Colors = colors;
            this.Effect = effect;
        }
        return CubeProperties;
    })();
    Levels.CubeProperties = CubeProperties;

    var TileProperties = (function () {
        function TileProperties(colors, effect) {
            this.Colors = colors;
            this.Effect = effect;
        }
        return TileProperties;
    })();
    Levels.TileProperties = TileProperties;

    var TunnelProperties = (function () {
        function TunnelProperties(colors) {
            this.TunnelColors = colors;
        }
        return TunnelProperties;
    })();
    Levels.TunnelProperties = TunnelProperties;

    var Cell = (function () {
        function Cell(level, colorIndexLow, colorIndexHigh, colorRaw, flags) {
            this.Tunnel = null;
            this.Cube = null;
            this.Tile = null;
            this.CI = colorRaw;
            if (flags & 1) {
                this.Tunnel = new TunnelProperties(level.getTunnelColors());
            }
            var lowEffect;
            switch (colorIndexLow) {
                case 10:
                    lowEffect = 1 /* Accelerate */;
                    break;
                case 12:
                    lowEffect = 3 /* Kill */;
                    break;
                case 9:
                    lowEffect = 5 /* RefillOxygen */;
                    break;
                case 8:
                    lowEffect = 4 /* Slide */;
                    break;
                case 2:
                    lowEffect = 2 /* Decelerate */;
                    break;
                default:
                    lowEffect = 0 /* None */;
            }
            var highEffect;
            switch (colorIndexHigh) {
                case 10:
                    highEffect = 1 /* Accelerate */;
                    break;
                case 12:
                    highEffect = 3 /* Kill */;
                    break;
                case 9:
                    highEffect = 5 /* RefillOxygen */;
                    break;
                case 8:
                    highEffect = 4 /* Slide */;
                    break;
                case 2:
                    highEffect = 2 /* Decelerate */;
                    break;
                default:
                    highEffect = 0 /* None */;
            }

            if (flags & 6) {
                var height = [80, 100, 100, 100, 120][flags & 6];
                var colors = colorIndexHigh > 0 ? level.getCubeColorsWithTop(colorIndexHigh) : level.getCubeColors();
                this.Cube = new CubeProperties(height, colors, highEffect);
            }

            if (colorIndexLow > 0) {
                this.Tile = new TileProperties(level.getTileColors(colorIndexLow), lowEffect);
            }
        }
        Cell.prototype.isEmpty = function () {
            return this.Cube == null && this.Tile == null && this.Tunnel == null;
        };

        Cell.getEmpty = function () {
            return new Cell(null, 0, 0, 0, 0);
        };
        return Cell;
    })();
    Levels.Cell = Cell;

    var Level = (function () {
        function Level(name, gravity, fuel, oxygen, colors) {
            this.Name = name;
            this.Gravity = gravity;
            this.Fuel = fuel;
            this.Oxygen = oxygen;
            this.Colors = colors;
        }
        Level.prototype.getCell = function (pos) {
            var x = pos.getXPosition() - 95;
            if (x > 322 || x < 0) {
                return Cell.getEmpty();
            }

            var z = Math.floor(Math.floor(pos.getZPosition() * 8.0) / 8);
            x /= 0x2E;
            x = Math.floor(x);

            if (x < this.Cells.length && z < this.Cells[x].length) {
                return this.Cells[x][z];
            } else {
                return Cell.getEmpty();
            }
        };

        Level.prototype.width = function () {
            return this.Cells.length;
        };

        Level.prototype.length = function () {
            return this.Cells[0].length;
        };

        Level.prototype.getTunnelColors = function () {
            return this.Colors.slice(66, 72).reverse();
        };

        Level.prototype.getTileColors = function (startIndex) {
            return new CubeColors(this.Colors[startIndex + 45], this.Colors[startIndex + 30], this.Colors[startIndex], this.Colors[startIndex + 15]);
        };

        Level.prototype.getCubeColors = function () {
            return new CubeColors(this.Colors[64], this.Colors[63], this.Colors[61], this.Colors[62]);
        };

        Level.prototype.getCubeColorsWithTop = function (cTop) {
            return new CubeColors(this.Colors[64], this.Colors[63], this.Colors[cTop], this.Colors[62]);
        };

        Level.prototype.getLength = function () {
            return this.Cells[0].length;
        };
        return Level;
    })();
    Levels.Level = Level;
})(Levels || (Levels = {}));
