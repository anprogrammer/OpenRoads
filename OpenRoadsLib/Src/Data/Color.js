var Data;
(function (Data) {
    var Color = (function () {
        function Color(r, g, b) {
            this.R = r;
            this.G = g;
            this.B = b;
        }
        Color.prototype.negative = function () {
            return new Color(255 - this.R, 255 - this.G, 255 - this.B);
        };

        Color.prototype.scale = function (n) {
            return new Color(Math.floor(this.R * n), Math.floor(this.G * n), Math.floor(this.B * n));
        };

        Color.prototype.toCss = function () {
            return 'rgb(' + this.R + ',' + this.G + ',' + this.B + ')';
        };

        Color.prototype.toVec3 = function () {
            return new TSM.vec3([this.R / 255.0, this.G / 255.0, this.B / 255.0]);
        };

        Color.prototype.equals = function (b) {
            return this.R === b.R && this.G === b.G && this.B === b.B;
        };
        return Color;
    })();
    Data.Color = Color;
})(Data || (Data = {}));
