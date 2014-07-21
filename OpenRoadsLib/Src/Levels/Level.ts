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

        public getCell(xPos: number, yPos: number, zPos: number): Cell {
            var x = xPos - 95;
            if (x > 322 || x < 0) {
                return Cell.getEmpty();
            }

            var z = Math.floor(Math.floor(zPos * 8.0) / 8);
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

        public getGravityAcceleration(): number {
            return -Math.floor(this.Gravity * 0x1680 / 0x190) / 0x80
        }

        private isInsideTileY(yPos: number, distFromCenter: number, cell: Levels.Cell): boolean {
            distFromCenter = Math.round(distFromCenter);
            if (distFromCenter > 37) {
                return false;
            }

            var tunCeils = [
                0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
                0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
                0x20, 0x1F, 0x1F, 0x1F, 0x1F, 0x1F, 0x1E, 0x1E,
                0x1E, 0x1D, 0x1D, 0x1D, 0x1C, 0x1B, 0x1A, 0x19,
                0x18, 0x16, 0x14, 0x12, 0x11, 0xE];
            var tunLows = [
                0x10, 0x10, 0x10, 0x10, 0x0F, 0x0E, 0x0D, 0x0B,
                0x08, 0x07, 0x06, 0x05, 0x03, 0x03, 0x03, 0x03,
                0x03, 0x03, 0x02, 0x01, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

            var y2 = yPos - 68;
            if (cell.Tunnel != null && cell.Cube == null) {
                return y2 > tunLows[distFromCenter] && y2 < tunCeils[distFromCenter];
            } else if (cell.Tunnel == null && cell.Cube != null) {
                return yPos < cell.Cube.Height;
            } else if (cell.Tunnel != null && cell.Cube != null) {
                return y2 > tunLows[distFromCenter] && yPos < cell.Cube.Height;
            } else {
                return false;
            }
        }

        public isInsideTunnel(xPos: number, yPos: number, zPos: number): boolean {
            var leftTile = this.getCell(xPos - 14, yPos, zPos);
            var rightTile = this.getCell(xPos + 14, yPos, zPos);

            if (!leftTile.isEmpty() || !rightTile.isEmpty()) {
                var centerTile = this.getCell(xPos, yPos, zPos);
                var distanceFromCenter = 23 - (xPos - 49) % 46;
                var var_A = -46;
                if (distanceFromCenter < 0) {
                    distanceFromCenter = 1 - distanceFromCenter;
                    var_A = -var_A;
                }

                if (this.isInsideTunnelY(yPos, distanceFromCenter, centerTile)) {
                    return true;
                }

                centerTile = this.getCell(xPos + var_A, yPos, zPos);
                if (this.isInsideTunnelY(yPos, 47 - distanceFromCenter, centerTile)) {
                    return true;
                }
            }
            return false;
        }

        private isInsideTunnelY(yPos: number, distFromCenter: number, cell: Levels.Cell): boolean {
            distFromCenter = Math.round(distFromCenter);
            if (distFromCenter > 37) {
                return false;
            }

            var tunCeils = [
                0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
                0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
                0x20, 0x1F, 0x1F, 0x1F, 0x1F, 0x1F, 0x1E, 0x1E,
                0x1E, 0x1D, 0x1D, 0x1D, 0x1C, 0x1B, 0x1A, 0x19,
                0x18, 0x16, 0x14, 0x12, 0x11, 0xE];
            var tunLows = [
                0x10, 0x10, 0x10, 0x10, 0x0F, 0x0E, 0x0D, 0x0B,
                0x08, 0x07, 0x06, 0x05, 0x03, 0x03, 0x03, 0x03,
                0x03, 0x03, 0x02, 0x01, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

            var y2 = yPos - 68;
            return cell.Tunnel != null && cell.Tile != null && y2 < tunLows[distFromCenter] && yPos >= 80;
        }

        public isInsideTile(xPos: number, yPos: number, zPos: number): boolean {
            var leftTile = this.getCell(xPos - 14, yPos, zPos);
            var rightTile = this.getCell(xPos + 14, yPos, zPos);

            if (!leftTile.isEmpty() || !rightTile.isEmpty()) {
                if (yPos < 80 && yPos > 0x1e80 / 0x80) {
                    return true;
                }

                if (yPos < 0x2180 / 0x80) {
                    return false;
                }

                var centerTile = this.getCell(xPos, yPos, zPos);
                var distanceFromCenter = 23 - (xPos - 49) % 46;
                var var_A = -46;
                if (distanceFromCenter < 0) {
                    distanceFromCenter = 1 - distanceFromCenter;
                    var_A = -var_A;
                }

                if (this.isInsideTileY(yPos, distanceFromCenter, centerTile)) {
                    return true;
                }

                centerTile = this.getCell(xPos + var_A, yPos, zPos);
                if (this.isInsideTileY(yPos, 47 - distanceFromCenter, centerTile)) {
                    return true;
                }
            }
            return false;
        }
    }
} 