module Data {
    export class Color {
        public R: number;
        public G: number;
        public B: number;
        constructor(r: number, g: number, b: number) {
            this.R = r;
            this.G = g;
            this.B = b;
        }

        negative(): Color {
            return new Color(255 - this.R, 255 - this.G, 255 - this.B);
        }

        scale(n: number): Color {
            return new Color(Math.floor(this.R * n), Math.floor(this.G * n), Math.floor(this.B * n));
        }

        toCss(): string {
            return 'rgb(' + this.R + ',' + this.G + ',' + this.B + ')';
        }

        toVec3(): TSM.vec3 {
            return new TSM.vec3([this.R / 255.0, this.G / 255.0, this.B / 255.0]);
        }

        public equals(b: Color): boolean {
            return this.R === b.R && this.G === b.G && this.B === b.B;
        }
    }
} 