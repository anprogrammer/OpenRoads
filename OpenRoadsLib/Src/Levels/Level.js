/// <reference path="../Data/Color.ts" />
var Levels;
(function (Levels) {
    var Level = (function () {
        function Level(gravity, fuel, oxygen, colors, bytes) {
            this.Gravity = gravity;
            this.Fuel = fuel;
            this.Oxygen = oxygen;
            this.Colors = colors;
            this.Bytes = bytes;
        }
        return Level;
    })();
    Levels.Level = Level;
})(Levels || (Levels = {}));
//# sourceMappingURL=Level.js.map
