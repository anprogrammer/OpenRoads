module Game {
    export class FPMath {
        public round32(n: number): number {
            return Math.floor(n * 0x10000) / 0x10000;
        }

        public round16(n: number): number {
            return Math.floor(n * 0x80) / 0x80;
        }
    }
} 