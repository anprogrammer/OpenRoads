/// <reference path="../Data/Color.ts" />
module Levels {
    export enum TouchEffect {
        None,
        Accelerate,
        Decelerate,
        Kill,
        Slide,
        RefillOxygen
    }

    export class CubeColors {
        public Left: Data.Color;
        public Right: Data.Color;
        public Top: Data.Color;
        public Front: Data.Color;
        constructor(left: Data.Color, right: Data.Color, top: Data.Color, front: Data.Color) {
            this.Left = left;
            this.Right = right;
            this.Top = top;
            this.Front = front;
        }
    }

    export class CubeProperties {
        public Height: number;
        public Colors: CubeColors;
        public Effect: TouchEffect;
        constructor(height: number, colors: CubeColors, effect: TouchEffect) {
            this.Height = height;
            this.Colors = colors;
            this.Effect = effect;
        }
    }

    export class TileProperties {
        public Colors: CubeColors;
        public Effect: TouchEffect;
        constructor(colors: CubeColors, effect: TouchEffect) {
            this.Colors = colors;
            this.Effect = effect;
        }
    }

    export class TunnelProperties {
        public TunnelColors: Data.Color[];
        constructor(colors: Data.Color[]) {
            this.TunnelColors = colors;
        }
    }

    export class Cell {
        public Tunnel: TunnelProperties = null;
        public Cube: CubeProperties = null;
        public Tile: TileProperties = null;
        public CI: number;

        constructor(level: Level, colorIndexLow: number, colorIndexHigh: number, colorRaw: number, flags: number) {
            this.CI = colorRaw;
            if (flags & 1) { //Tunnel
                this.Tunnel = new TunnelProperties(level.getTunnelColors());
            }
            var lowEffect: TouchEffect;
            switch (colorIndexLow) {
                case 10:
                    lowEffect = TouchEffect.Accelerate;
                    break;
                case 12:
                    lowEffect = TouchEffect.Kill;
                    break;
                case 9:
                    lowEffect = TouchEffect.RefillOxygen;
                    break;
                case 8:
                    lowEffect = TouchEffect.Slide;
                    break;
                case 2:
                    lowEffect = TouchEffect.Decelerate;
                    break;
                default:
                    lowEffect = TouchEffect.None;
            }
            var highEffect: TouchEffect;
            switch (colorIndexHigh) {
                case 10:
                    highEffect = TouchEffect.Accelerate;
                    break;
                case 12:
                    highEffect = TouchEffect.Kill;
                    break;
                case 9:
                    highEffect = TouchEffect.RefillOxygen;
                    break;
                case 8:
                    highEffect = TouchEffect.Slide;
                    break;
                case 2:
                    highEffect = TouchEffect.Decelerate;
                    break;
                default:
                    highEffect = TouchEffect.None;
            }
            
            if (flags & 6) { //Cube
                var height = [80, 100, 100, 100, 120][flags & 6];
                var colors: CubeColors = colorIndexHigh > 0 ? level.getCubeColorsWithTop(colorIndexHigh) : level.getCubeColors();
                this.Cube = new CubeProperties(height, colors, highEffect);
            }

            if (colorIndexLow > 0) {
                this.Tile = new TileProperties(level.getTileColors(colorIndexLow), lowEffect);
            }
        }

        public isEmpty(): boolean {
            return this.Cube == null && this.Tile == null && this.Tunnel == null;
        }

        public static getEmpty(): Cell {
            return new Cell(null, 0, 0, 0, 0);
        }
    }

    export class Level {
        public Name: string;
        public Gravity: number;
        public Fuel: number;
        public Oxygen: number;
        public Cells: Cell[][];
        public Colors: Data.Color[];

        constructor(name: string, gravity: number, fuel: number, oxygen: number, colors: Data.Color[]) {
            this.Name = name;
            this.Gravity = gravity;
            this.Fuel = fuel;
            this.Oxygen = oxygen;
            this.Colors = colors;
        }

        public getCell(pos: Game.Position): Cell {
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
        }

        public width(): number {
            return this.Cells.length;
        }

        public length(): number {
            return this.Cells[0].length;
        }

        public getTunnelColors(): Data.Color[] {
            return this.Colors.slice(66, 72).reverse();
        }

        public getTileColors(startIndex: number): CubeColors {
            return new CubeColors(this.Colors[startIndex + 45], this.Colors[startIndex + 30], this.Colors[startIndex], this.Colors[startIndex + 15]);
        }

        public getCubeColors(): CubeColors {
            return new CubeColors(this.Colors[64], this.Colors[63], this.Colors[61], this.Colors[62]);
        }

        public getCubeColorsWithTop(cTop: number): CubeColors {
            return new CubeColors(this.Colors[64], this.Colors[63], this.Colors[cTop], this.Colors[62]);
        }

        public getLength(): number {
            return this.Cells[0].length;
        }
    }
} 