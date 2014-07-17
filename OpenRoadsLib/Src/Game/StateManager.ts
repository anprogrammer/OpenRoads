module Game {
    function sFloor(n: number) {
        var s = n >= 0 ? 1 : -1;
        return Math.floor(n * s) * s;
    }

    export class StateManager {
        private sounds: Sounds.SoundEffect[];
        public level: Levels.Level = null;
        private controller: Controller = null;

        //Game-state, should be refactored
        public currentXPosition: number;
        public currentYPosition: number;
        public currentZPosition: number;

        public gravityAcceleration: number;
        private slideAmount: number;
        private slidingAccel: number;
        private xMovementBase: number;
        public yVelocity: number;
        public zVelocity: number;

        public fuelRemaining: number;
        public oxygenRemaining: number;

        private expectedXPosition: number;
        private expectedYPosition: number;
        private expectedZPosition: number;

        public craftState: number;
        public isDead: boolean;

        private isOnGround: boolean;
        private isOnDecelPad: boolean;
        private isOnSlidingTile: boolean;
        private isGoingUp: boolean = false;

        private hasRunJumpOMaster: boolean = false;
        public jumpOMasterInUse: boolean = false;
        public jumpOMasterVelocityDelta: number = 0.0;

        private offsetAtWhichNotInsideTile: number;
        private jumpedFromYPosition: number;

        public didWin: boolean = false;

        public Log: string = '';

        public lastJumpZ = 0.0;

        constructor(managers: Managers.ManagerSet, level: Levels.Level, controller: Controller) {
            this.level = level;
            this.controller = controller;
            this.sounds = managers.Sounds.getMultiEffect('SFX.SND');

            this.resetStateVars();
        }

        private resetStateVars(): void {
            this.gravityAcceleration = -Math.floor(this.level.Gravity * 0x1680 / 0x190) / 0x80
            this.currentZPosition = 3.0;
            this.currentXPosition = 0x8000/0x80;
            this.currentYPosition = 0x2800/0x80;

            this.slideAmount = 0;
            this.xMovementBase = 0;
            this.yVelocity = 0;
            this.zVelocity = 0;

            this.fuelRemaining = 0x7530;
            this.oxygenRemaining = 0x7530;

            this.craftState = 0;
            this.isDead = false;

            this.isOnGround = true;
            this.isOnDecelPad = false;
            this.isOnSlidingTile = false;
            this.isGoingUp = false;

            this.offsetAtWhichNotInsideTile = 0;
            this.jumpedFromYPosition = 0;
        }

        private currentPosToPosition(): Position {
            return { getXPosition: () => this.currentXPosition, getYPosition: () => this.currentYPosition, getZPosition: () => this.currentZPosition };
        }

        private getPos(x: number, y: number, z: number): Position {
            return { getXPosition: () => x, getYPosition: () => y, getZPosition: () => z };
        }

        private sanitizeFP32(n: number): number {
            return Math.floor(n * 0x10000) / 0x10000;
        }

        private sanitizeFP16(n: number): number {
            return Math.floor(n * 0x80) / 0x80;
        }

        private sanitizeVars(): void {
            this.currentXPosition = Math.floor(this.currentXPosition * 0x80) / 0x80;
            this.currentYPosition = Math.floor(this.currentYPosition * 0x80) / 0x80;
            this.currentZPosition = Math.floor(this.currentZPosition * 0x10000) / 0x10000;

            this.expectedXPosition = Math.floor(this.expectedXPosition * 0x80) / 0x80;
            this.expectedYPosition = Math.floor(this.expectedYPosition * 0x80) / 0x80;
            this.expectedZPosition = Math.floor(this.expectedZPosition * 0x10000) / 0x10000;
        }
        public runFrame(): void {
            var controls = this.controller.update(this.currentPosToPosition());
            this.sanitizeVars();

            var canControl = this.craftState !== 4 && this.craftState !== 5;
            
            //LOC 2308
            this.logBP2308(controls); //DEAD
            /*
            if (this.currentZPosition >= 0x40 + 0x63a5 / 0x10000) {
                debugger;
            }*/
            var cell = this.level.getCell(this.currentPosToPosition());
            var isAboveNothing = cell.isEmpty();
            var touchEffect: Levels.TouchEffect = Levels.TouchEffect.None;

            this.isOnSlidingTile = false;
            this.isOnDecelPad = false;

            if (this.isOnGround) {
                var y = this.currentYPosition;
                if (Math.floor(y) == 0x2800/0x80 && cell.Tile != null) {
                    touchEffect = cell.Tile.Effect;
                } else if (Math.floor(y) > 0x2800/0x80 && cell.Cube != null && cell.Cube.Height == y) {
                    touchEffect = cell.Cube.Effect;
                }
                this.logBP2369(controls, touchEffect);
                this.applyTouchEffect(touchEffect);
                this.isOnSlidingTile = touchEffect === Levels.TouchEffect.Slide;
                this.isOnDecelPad = touchEffect === Levels.TouchEffect.Decelerate;
            }

            if (this.currentZPosition >= this.level.getLength()) {
                //TODO: Game ending.  Are we in a tunnel?
            }

            //LOC 2405
            if (Math.abs(this.expectedYPosition - this.currentYPosition) > 0.01) {
                if (this.slideAmount == 0 || this.offsetAtWhichNotInsideTile >= 2) {
                    var yvel = Math.abs(this.yVelocity);
                    if (yvel > (this.level.Gravity * 0x104 / 8 / 0x80)) {
                        if (this.yVelocity < 0) {
                            this.sounds[1].play();
                        }
                        this.yVelocity = -0.5 * this.yVelocity;
                    } else {
                        this.yVelocity = 0;
                    }
                } else {
                    this.yVelocity = 0;
                }
            }

            //LOC 249E
            this.zVelocity += (canControl ? controls.AccelInput : 0) * 0x4B / 0x10000;
            this.clampGlobalZVelocity();

            //LOC 250F
            if (!this.isOnSlidingTile) {
                var canControl1 = (this.isGoingUp || isAboveNothing) && this.xMovementBase === 0 && this.yVelocity > 0 && (this.currentYPosition - this.jumpedFromYPosition) < 30;
                var canControl2 = !this.isGoingUp && !isAboveNothing;
                if (canControl1 || canControl2) {
                    this.xMovementBase = (canControl ? controls.TurnInput * 0x1D / 0x80 : 0);
                }
            }

            //LOC 2554
            if (!this.isGoingUp && !isAboveNothing && controls.JumpInput && this.level.Gravity < 0x14 && canControl) {
                this.yVelocity = 0x480 / 0x80;
                this.isGoingUp = true;
                this.jumpedFromYPosition = this.currentYPosition;
                this.lastJumpZ = this.currentZPosition;
            }

            //LOC 2590
            //Something to do with the craft hitting max-height.
            if (this.isGoingUp && !this.hasRunJumpOMaster && this.currentYPosition >= 110) {
                this.runJumpOMaster(controls);
                this.hasRunJumpOMaster = true;
            }

            //LOC 25C9
            if (this.currentYPosition >= 0x28) {
                this.yVelocity += this.gravityAcceleration;
                this.yVelocity = sFloor(this.yVelocity * 0x80) / 0x80;
            } else if (this.yVelocity > -105 / 0x80) {
                this.yVelocity = -105 / 0x80;
            }

            //LOC 2619
            this.expectedZPosition = this.isDead ? this.currentZPosition : this.currentZPosition + this.zVelocity;
            var motionVel = this.zVelocity;
            if (!this.isOnDecelPad) {
                motionVel += 0x618 / 0x10000
            }
            var xMotion = sFloor(this.xMovementBase * 0x80) * sFloor(motionVel * 0x10000) / 0x10000 + this.slideAmount; //SHould we divide by some factor or is that just to account for 16vs8-bit Fixed-precision?  1A2:266B under loc 264C
            this.expectedXPosition = this.isDead ? this.currentXPosition : this.currentXPosition + xMotion;
            this.expectedYPosition = this.isDead ? this.currentYPosition : this.currentYPosition + this.yVelocity;

            //LOC 2699
            var minX = 0x2F80 / 0x80, maxX = 0xD080 / 0x80;
            var currentX = this.currentXPosition, newX = this.expectedXPosition;
            if ((currentX < minX && newX > maxX) || (newX < minX && currentX > maxX)) {
                this.expectedXPosition = currentX;
            }

            //LOC 26BE
            this.sanitizeVars();
            this.logBP26C7(controls); //CAFE
            this.moveShipAndConstraint();
            this.sanitizeVars();
            this.logBP26CD(controls); //FEED

            if (this.currentZPosition != this.expectedZPosition && this.isInsideTile(this.currentXPosition, this.currentYPosition, this.expectedZPosition)) {
                var bumpOff = 0x3a0 / 0x80;
                if (!this.isInsideTile(this.currentXPosition - bumpOff, this.currentYPosition, this.expectedZPosition)) {
                    this.currentXPosition -= bumpOff;
                    this.expectedZPosition = this.currentZPosition;
                    this.sounds[2].play();
                } else if (!this.isInsideTile(this.currentXPosition + bumpOff, this.currentYPosition, this.expectedZPosition)) {
                    this.currentXPosition += bumpOff;
                    this.expectedZPosition = this.currentZPosition;
                    this.sounds[2].play();
                }
            }

            //LOC 2787
            if (Math.abs(this.currentZPosition - this.expectedZPosition) > 0.01) {
                if (this.zVelocity < 1.0 / 3.0 * 0x2aaa / 0x10000) {
                    this.zVelocity = 0.0;
                    this.sounds[2].play();
                } else if (!this.isDead) {
                    this.isDead = true;
                    this.craftState = 1; //Exploded
                    this.sounds[0].play();
                }
            }

            //LOC 2820
            if (Math.abs(this.currentXPosition - this.expectedXPosition) > 0.01) {
                this.xMovementBase = 0.0;
                if (this.slideAmount !== 0.0) {
                    this.expectedXPosition = this.currentXPosition;
                    this.slideAmount = 0.0;
                }
                this.zVelocity -= 0x97 / 0x10000;
                this.clampGlobalZVelocity();
            }

            //LOC 28BB
            this.isOnGround = false;
            if (this.yVelocity < 0 && this.expectedYPosition != this.currentYPosition) {
                this.zVelocity += this.jumpOMasterVelocityDelta;
                this.jumpOMasterVelocityDelta = 0.0;
                this.hasRunJumpOMaster = false;
                this.jumpOMasterInUse = false;

                this.isGoingUp = false;
                this.isOnGround = true;
                this.slidingAccel = 0;

                for (var i: number = 1; i <= 0xE; i++) {
                    if (!this.isInsideTile(this.currentXPosition + i, this.currentYPosition - 1.0 / 0x80, this.currentZPosition)) {
                        this.slidingAccel++;
                        this.offsetAtWhichNotInsideTile = i;
                        break;
                    }
                }

                for (var i: number = 1; i <= 0xE; i++) {
                    if (!this.isInsideTile(this.currentXPosition - i, this.currentYPosition - 1.0 / 0x80, this.currentZPosition)) {
                        this.slidingAccel--;
                        this.offsetAtWhichNotInsideTile = i;
                        break;
                    }
                }

                if (this.slidingAccel != 0) {
                    this.slideAmount += 0x11 * this.slidingAccel / 0x80;
                } else {
                    this.slideAmount = 0;
                }
            }

            //LOC 2A23 -- Deplete Oxygen
            this.oxygenRemaining -= 0x7530 / (0x24 * this.level.Oxygen);
            if (this.oxygenRemaining <= 0) {
                this.oxygenRemaining = 0;
                this.craftState = 5;
            }

            //LOC 2A4E -- Deplete fuel
            this.fuelRemaining -= this.zVelocity * 0x7530 / this.level.Fuel;
            if (this.fuelRemaining <= 0) {
                this.fuelRemaining = 0;
                this.craftState = 4;
            }

            if (this.currentZPosition >= this.level.getLength() - 0.5 && this.isInsideTunnel(this.currentXPosition, this.currentYPosition, this.currentZPosition)) {
                this.didWin = true;
            }
        }

        private applyTouchEffect(effect: Levels.TouchEffect) {
            switch (effect) {
                case Levels.TouchEffect.Accelerate:
                    this.zVelocity += 0x12F / 0x10000;
                    break;
                case Levels.TouchEffect.Decelerate:
                    this.zVelocity -= 0x12F / 0x10000;
                    break;
                case Levels.TouchEffect.Kill:
                    this.isDead = true;
                    break;
                case Levels.TouchEffect.RefillOxygen:
                    if (this.craftState === 0) {
                        if (this.fuelRemaining < 0x6978 || this.oxygenRemaining < 0x6978) {
                            this.sounds[4].play();
                        }

                        this.fuelRemaining = 0x7530;
                        this.oxygenRemaining = 0x7530;
                    }
                    break;
            }
            this.clampGlobalZVelocity();
        }

        private clampGlobalZVelocity(): void {
            this.zVelocity = this.clampZVelocity(this.zVelocity);
        }

        private clampZVelocity(z: number): number {
            return Math.min(Math.max(0.0, z), 0x2AAA / 0x10000);
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

        private isInsideTile(xPos: number, yPos: number, zPos: number): boolean {
            var leftTile = this.level.getCell(this.getPos(xPos - 14, yPos, zPos));
            var rightTile = this.level.getCell(this.getPos(xPos + 14, yPos, zPos));

            if (!leftTile.isEmpty() || !rightTile.isEmpty()) {
                if (yPos < 80 && yPos > 0x1e80/0x80) {
                    return true;
                }

                if (yPos < 0x2180 / 0x80) {
                    return false;
                }

                var centerTile = this.level.getCell(this.getPos(xPos, yPos, zPos));
                var distanceFromCenter = 23 - (xPos - 49) % 46;
                var var_A = -46;
                if (distanceFromCenter < 0) {
                    distanceFromCenter = 1 - distanceFromCenter;
                    var_A = -var_A;
                }

                if (this.isInsideTileY(yPos, distanceFromCenter, centerTile)) {
                    return true;
                }

                centerTile = this.level.getCell(this.getPos(xPos + var_A, yPos, zPos));
                if (this.isInsideTileY(yPos, 47 - distanceFromCenter, centerTile)) {
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

        private isInsideTunnel(xPos: number, yPos: number, zPos: number): boolean {
            var leftTile = this.level.getCell(this.getPos(xPos - 14, yPos, zPos));
            var rightTile = this.level.getCell(this.getPos(xPos + 14, yPos, zPos));

            if (!leftTile.isEmpty() || !rightTile.isEmpty()) {
                var centerTile = this.level.getCell(this.getPos(xPos, yPos, zPos));
                var distanceFromCenter = 23 - (xPos - 49) % 46;
                var var_A = -46;
                if (distanceFromCenter < 0) {
                    distanceFromCenter = 1 - distanceFromCenter;
                    var_A = -var_A;
                }

                if (this.isInsideTunnelY(yPos, distanceFromCenter, centerTile)) {
                    return true;
                }

                centerTile = this.level.getCell(this.getPos(xPos + var_A, yPos, zPos));
                if (this.isInsideTunnelY(yPos, 47 - distanceFromCenter, centerTile)) {
                    return true;
                }
            }
            return false;
        }

        private moveShipAndConstraint(): void {
            if (this.currentXPosition == this.expectedXPosition &&
                this.currentYPosition == this.expectedYPosition &&
                this.currentZPosition == this.expectedZPosition) {
                return;
            }

            var iter = 1;
            var interp16 = (a: number, b: number) => this.sanitizeFP16((b - a) * iter / 5 + a);
            var interp32 = (a: number, b: number) => this.sanitizeFP32((b - a) * iter / 5 + a);
            for (iter = 1; iter <= 5; iter++) {
                if (this.isInsideTile(interp16(this.currentXPosition, this.expectedXPosition), interp16(this.currentYPosition, this.expectedYPosition), interp32(this.currentZPosition, this.expectedZPosition))) {
                    break;
                }
            }

            iter--; //We care about the list iter we were *NOT* inside a tile
            this.currentXPosition = interp16(this.currentXPosition, this.expectedXPosition);
            this.currentYPosition = interp16(this.currentYPosition, this.expectedYPosition);
            this.currentZPosition = interp32(this.currentZPosition, this.expectedZPosition);

            var zGran = 0x1000 / 0x10000;

            while (zGran != 0) {
                //LOC 18F2
                if (this.expectedZPosition - this.currentZPosition >= zGran && !this.isInsideTile(this.currentXPosition, this.currentYPosition, this.currentZPosition + zGran)) {
                    this.currentZPosition += zGran;
                } else {
                    zGran /= 0x10;
                    zGran = Math.floor(zGran * 0x10000) / 0x10000;
                }
            }

            this.currentZPosition = this.sanitizeFP32(this.currentZPosition);

            var xGran = this.expectedXPosition > this.currentXPosition ? (0x7D / 0x80) : (-0x7D / 0x80);
            while (Math.abs(xGran) > 0) {
                if (Math.abs(this.expectedXPosition - this.currentXPosition) >= Math.abs(xGran) && !this.isInsideTile(this.currentXPosition + xGran, this.currentYPosition, this.currentZPosition)) {
                    this.currentXPosition += xGran;
                } else {
                    xGran = sFloor(xGran / 5.0 * 0x80) / 0x80;
                }
            }

            this.currentXPosition = this.sanitizeFP16(this.currentXPosition);

            var yGran = this.expectedYPosition > this.currentYPosition ? (0x7D / 0x80) : (-0x7D / 0x80);
            while (Math.abs(yGran) > 0) {
                if (Math.abs(this.expectedYPosition - this.currentYPosition) >= Math.abs(yGran) && !this.isInsideTile(this.currentXPosition, this.currentYPosition + yGran, this.currentZPosition)) {
                    this.currentYPosition += yGran;
                } else {
                    yGran = sFloor(yGran / 5.0 * 0x80) / 0x80;
                }
            }

            this.currentYPosition = this.sanitizeFP16(this.currentYPosition);
        }

        private runJumpOMaster(controls: ControllerState): void {
            if (this.willLandOnTile(controls, this.currentXPosition, this.currentYPosition, this.currentZPosition, this.xMovementBase, this.yVelocity, this.zVelocity)) {
                return;
            }

            var zVelocity = this.zVelocity;
            var xMov = this.xMovementBase;
            var i: number;
            for (i = 1; i <= 6; i++) {
                this.xMovementBase = this.sanitizeFP16(xMov + xMov * i / 10);
                if (this.willLandOnTile(controls, this.currentXPosition, this.currentYPosition, this.currentZPosition, this.xMovementBase, this.yVelocity, this.zVelocity)) {
                    break;
                }

                this.xMovementBase = this.sanitizeFP16(xMov - xMov * i / 10);
                if (this.willLandOnTile(controls, this.currentXPosition, this.currentYPosition, this.currentZPosition, this.xMovementBase, this.yVelocity, this.zVelocity)) {
                    break;
                }

                this.xMovementBase = xMov;

                var zv2 = this.sanitizeFP32(zVelocity + zVelocity * i / 10);
                this.zVelocity = this.clampZVelocity(zv2);
                if (this.zVelocity == zv2) {
                    if (this.willLandOnTile(controls, this.currentXPosition, this.currentYPosition, this.currentZPosition, this.xMovementBase, this.yVelocity, this.zVelocity)) {
                        break;
                    }
                }

                zv2 =this.sanitizeFP32(zVelocity - zVelocity * i / 10);
                this.zVelocity = this.clampZVelocity(zv2);
                if (this.zVelocity == zv2) {
                    if (this.willLandOnTile(controls, this.currentXPosition, this.currentYPosition, this.currentZPosition, this.xMovementBase, this.yVelocity, this.zVelocity)) {
                        break;
                    }
                }

                this.zVelocity = zVelocity;
            }

            this.jumpOMasterVelocityDelta = zVelocity - this.zVelocity;
            if (i <= 6) {
                this.jumpOMasterInUse = true;
            }
        }

        private isOnNothing(xPosition: number, zPosition: number) {
            var cell = this.level.getCell(this.getPos(xPosition, 0, zPosition));
            return cell.isEmpty() || (cell.Tile != null && cell.Tile.Effect == Levels.TouchEffect.Kill);
        }

        private willLandOnTile(controls: ControllerState, xPos: number, yPos: number, zPos: number, xVelocity: number, yVelocity: number, zVelocity: number): boolean {
            while (true) {
                var currentX = xPos;
                var currentSlideAmount = this.slideAmount;
                var currentZ = zPos;

                yVelocity += this.gravityAcceleration;
                zPos += zVelocity;

                var xRate = zVelocity + 0x618 / 0x10000;
                var xMov = xVelocity * xRate * 128 + currentSlideAmount;
                xPos += xMov;
                if (xPos < 0x2F80 / 0x80 || xPos > 0xD080 / 0x80) {
                    return false;
                }

                yPos += yVelocity;
                zVelocity = this.clampZVelocity(zVelocity + controls.AccelInput * 0x4B / 0x10000);

                if (yPos <= 0x2800 / 0x80) {
                    return !this.isOnNothing(currentX, currentZ) && !this.isOnNothing(xPos, zPos);
                }
            }
        }

        private logBP2308(controls: ControllerState) {
            this.logString('BP2308_IDENT=dead');
            this.logLongList(controls);
        }

        private logBP2369(controls: ControllerState, te: Levels.TouchEffect) {
            this.logString('BP2369_IDENT=beef');
        }

        private logBP26C7(controls: ControllerState) {
            this.logString('BP26C7_IDENT=cafe');
            this.logLongList(controls);
        }


        private logBP26CD(controls: ControllerState) {
            this.logString('BP26CD_IDENT=feed');
            this.logLongList(controls);
        }


        private logLongList(controls: ControllerState) {
            this.logInt('InAccel', controls.AccelInput);
            this.logInt('InTurn', controls.TurnInput);
            this.logInt('InJump', controls.JumpInput ? 1 : 0);
            this.logFP16('CurrentX', this.currentXPosition);
            this.logFP16('CurrentY', this.currentYPosition);
            this.logFP32('CurrentZHigh', 'CurrentZLow', this.currentZPosition);
            this.logFP16('XMovementBase', this.xMovementBase); //Should this be FP 16?
            this.logFP16('YVelocity', this.yVelocity);
            this.logFP32LH('ZVelocity', this.zVelocity);
            this.logFP16('ExpectedX', this.expectedXPosition);
            this.logFP16('ExpectedY', this.expectedYPosition);
            this.logFP32('ExpectedZHigh', 'ExpectedZLow', this.expectedZPosition);
        }


        private toHexBytes(n: number): string {
            return n.toString(16).toLowerCase();
        }

        private logFP16(name: string, n: number) {
            n = Math.floor(n * 0x80);
            if (n < 0) {
                n = 0x10000 + n;
            }
            this.logString(name.toUpperCase() + '=' + this.toHexBytes(n));
        }

        private logFP32(nameHigh: string, nameLow: string, n: number) {
            var high = Math.floor(n), low = Math.floor((n - high) * 0x10000);
            this.logString(nameHigh.toUpperCase() + '=' + this.toHexBytes(high));
            this.logString(nameLow.toUpperCase() + '=' + this.toHexBytes(low));
        }

        private logFP32LH(name: string, n: number) {
            n = Math.floor(n * 0x10000);
            this.logString(name.toUpperCase() + '=' + this.toHexBytes(n));
        }

        private logInt(name: string, n: number) {
            if (n < 0) {
                n = 0xffff;
            }
            this.logString(name.toUpperCase() + '=' + this.toHexBytes(n));
        }

        private logString(s: string): void { //TODO: Implement
            this.Log += s + '\n';
        }
    }
} 