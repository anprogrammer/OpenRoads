module Game {
    function sFloor(n: number) {
        var s = n >= 0 ? 1 : -1;
        return Math.floor(n * s) * s;
    }

    export enum ShipState {
        Alive,
        Exploded,
        OutOfFuel,
        OutOfOxygen
    }

    export interface Position {
        getXPosition(): number;
        getYPosition(): number;
        getZPosition(): number;
    }

    export interface ShipProperties {
        xPosition: number;
        yPosition: number;
        zPosition: number;
        slideAmount: number;
        slidingAccel: number;
        xMovementBase: number;
        yVelocity: number;
        zVelocity: number;

        fuelRemaining: number;
        oxygenRemaining: number;

        offsetAtWhichNotInsideTile: number;
        isOnGround: boolean;
        isGoingUp: boolean;
        hasRunJumpOMaster: boolean;
        jumpOMasterVelocityDelta: number;
        jumpOMasterInUse: boolean;

        jumpedFromYPosition: number;

        state: ShipState;
    };
    export class Ship implements Position {
        private fp = new FPMath();

        private xPosition: number;
        private yPosition: number;
        private zPosition: number;

        private slideAmount: number;
        private slidingAccel: number;
        private xMovementBase: number;
        private yVelocity: number;
        private zVelocity: number;

        private jumpedFromYPosition: number;

        private fuelRemaining: number;
        private oxygenRemaining: number;

        private offsetAtWhichNotInsideTile: number;

        private isOnGround: boolean;
        private isGoingUp: boolean;
        private hasRunJumpOMaster: boolean;
        private jumpOMasterVelocityDelta: number;
        private jumpOMasterInUse: boolean;

        private state: ShipState;


        constructor(params: ShipProperties) {
            this.load(params);
        }

        private load(params: ShipProperties): void {
            this.xPosition = params.xPosition;
            this.yPosition = params.yPosition;
            this.zPosition = params.zPosition;

            this.slideAmount = params.slideAmount;
            this.slidingAccel = params.slidingAccel;
            this.xMovementBase = params.xMovementBase;

            this.yVelocity = params.yVelocity;
            this.zVelocity = params.zVelocity;

            this.isOnGround = params.isOnGround;
            this.isGoingUp = params.isGoingUp;
            this.hasRunJumpOMaster = params.hasRunJumpOMaster;
            this.jumpOMasterVelocityDelta = params.jumpOMasterVelocityDelta;
            this.jumpOMasterInUse = params.jumpOMasterInUse;

            this.jumpedFromYPosition = params.jumpedFromYPosition;

            this.fuelRemaining = params.fuelRemaining;
            this.oxygenRemaining = params.oxygenRemaining;

            this.offsetAtWhichNotInsideTile = params.offsetAtWhichNotInsideTile;

            this.state = params.state;
        }

        public getXPosition(): number {
            return this.xPosition;
        }

        public getYPosition(): number {
            return this.yPosition;
        }

        public getZPosition(): number {
            return this.zPosition;
        }

        public getZVelocity(): number {
            return this.zVelocity;
        }

        public getJumpOMasterVelocityDelta(): number {
            return this.jumpOMasterVelocityDelta;
        }

        public getJumpOMasterInUse(): boolean {
            return this.jumpOMasterInUse;
        }

        public getState(): ShipState {
            return this.state;
        }

        public getFuelRemaining(): number {
            return this.fuelRemaining;
        }

        public getOxygenRemaining(): number {
            return this.oxygenRemaining;
        }

        public clone(other: Ship = null): Ship {
            if (other === null) {
                return new Ship(<any>this);
            } else {
                other.load(<any>this);
                return other;
            }
        }

        public update(level: Levels.Level, expected: Ship, controls: ControllerState, eventBus: Events.EventBus): void {
            this.sanitizeParameters();
            var canControl = this.state === ShipState.Alive;

            var cell = level.getCell(this.getXPosition(), this.getYPosition(), this.getZPosition());
            var isAboveNothing = cell.isEmpty();
            var touchEffect = this.getTouchEffect(cell);

            var isOnSlidingTile = touchEffect === Levels.TouchEffect.Slide;
            var isOnDecelPad = touchEffect === Levels.TouchEffect.Decelerate;

            this.applyTouchEffect(touchEffect, eventBus);
            this.updateYVelocity(expected, level, eventBus);
            this.updateZVelocity(canControl, controls.AccelInput);
            this.updateXVelocity(canControl, controls.TurnInput, isOnSlidingTile, isAboveNothing, this.isGoingUp);
            this.updateJump(canControl, isAboveNothing, controls.JumpInput, level);
            this.updateJumpOMaster(controls, level);
            this.updateGravity(level.getGravityAcceleration());

            this.clone(expected);
            expected.attemptMotion(isOnDecelPad);
            expected.sanitizeParameters();
            this.moveTo(expected, level);
            this.sanitizeParameters();
            expected.sanitizeParameters();
            this.handleBumps(expected, level, eventBus);
            this.handleCollision(expected, eventBus);
            this.handleSlideCollision(expected);
            this.handleBounce(expected, level);
            this.handleOxygenAndFuel(level);
        }

        private getTouchEffect(cell: Levels.Cell): Levels.TouchEffect {
            var touchEffect: Levels.TouchEffect = Levels.TouchEffect.None;
            if (this.isOnGround) {
                var y = this.yPosition;
                if (Math.floor(y) == 0x2800 / 0x80 && cell.Tile != null) {
                    touchEffect = cell.Tile.Effect;
                } else if (Math.floor(y) > 0x2800 / 0x80 && cell.Cube != null && cell.Cube.Height == y) {
                    touchEffect = cell.Cube.Effect;
                }
            }
            return touchEffect;
        }

        private applyTouchEffect(effect: Levels.TouchEffect, eventBus: Events.EventBus) {
            switch (effect) {
                case Levels.TouchEffect.Accelerate:
                    this.zVelocity += 0x12F / 0x10000;
                    break;
                case Levels.TouchEffect.Decelerate:
                    this.zVelocity -= 0x12F / 0x10000;
                    break;
                case Levels.TouchEffect.Kill:
                    this.state = ShipState.Exploded;
                    if (this.state !== ShipState.Exploded) {
                        eventBus.fire(new ShipEvents.ShipExplodedEvent());
                    }
                    break;
                case Levels.TouchEffect.RefillOxygen:
                    if (this.state === ShipState.Alive) {
                        if (this.fuelRemaining < 0x6978 || this.oxygenRemaining < 0x6978) {
                            eventBus.fire(new ShipEvents.ShipRefilledEvent());
                        }

                        this.fuelRemaining = 0x7530;
                        this.oxygenRemaining = 0x7530;
                    }
                    break;
            }
            this.clampGlobalZVelocity();
        }

        public updateYVelocity(expected: Ship, level: Levels.Level, eventBus: Events.EventBus): void {
            if (this.isDifferentHeight(expected)) {
                if (this.slideAmount == 0 || this.offsetAtWhichNotInsideTile >= 2) {
                    var yvel = Math.abs(this.yVelocity);
                    if (yvel > (level.Gravity * 0x104 / 8 / 0x80)) {
                        if (this.yVelocity < 0) {
                            eventBus.fire(new ShipEvents.ShipBouncedEvent());
                        }
                        this.yVelocity = -0.5 * this.yVelocity;
                    } else {
                        this.yVelocity = 0;
                    }
                } else {
                    this.yVelocity = 0;
                }
            }
        }

        public updateZVelocity(canControl: boolean, zAccelInput: number): void {
            this.zVelocity += (canControl ? zAccelInput : 0) * 0x4B / 0x10000;
            this.clampGlobalZVelocity();
        }

        private updateXVelocity(canControl: boolean, turnInput: number, isOnSlidingTile: boolean, isAboveNothing: boolean, isGoingUp: boolean): void {
            if (!isOnSlidingTile) {
                var canControl1 = (isGoingUp || isAboveNothing) && this.xMovementBase === 0 && this.yVelocity > 0 && (this.yPosition - this.jumpedFromYPosition) < 30;
                var canControl2 = !isGoingUp && !isAboveNothing;
                if (canControl1 || canControl2) {
                    this.xMovementBase = (canControl ? turnInput * 0x1D / 0x80 : 0);
                }
            }
        }

        private updateJump(canControl: boolean, isAboveNothing: boolean, jumpInput: boolean, level: Levels.Level): void {
            if (!this.isGoingUp && !isAboveNothing && jumpInput && level.Gravity < 0x14 && canControl) {
                this.yVelocity = 0x480 / 0x80;
                this.isGoingUp = true;
                this.jumpedFromYPosition = this.yPosition;
            }
        }

        private updateJumpOMaster(controls: ControllerState, level: Levels.Level): void {
            if (this.isGoingUp && !this.hasRunJumpOMaster && this.getYPosition() >= 110) {
                this.runJumpOMaster(controls, level);
                this.hasRunJumpOMaster = true;
            }
        }

        private updateGravity(gravityAcceleration: number): void {
            if (this.getYPosition() >= 0x28) {
                this.yVelocity += gravityAcceleration;
                this.yVelocity = sFloor(this.yVelocity * 0x80) / 0x80;
            } else if (this.yVelocity > -105 / 0x80) {
                this.yVelocity = -105 / 0x80;
            }
        }

        private attemptMotion(onDecelPad: boolean): void {
            var isDead = this.state === ShipState.Exploded;
            var motionVel = this.zVelocity;
            if (!onDecelPad) {
                motionVel += 0x618 / 0x10000
            }

            var xMotion = sFloor(this.xMovementBase * 0x80) * sFloor(motionVel * 0x10000) / 0x10000 + this.slideAmount;
            if (!isDead) {
                this.xPosition += xMotion;
                this.yPosition += this.yVelocity;
                this.zPosition += this.zVelocity;
            }
        }

        private moveTo(dest: Ship, level: Levels.Level) {
            if (this.xPosition === dest.xPosition &&
                this.yPosition === dest.yPosition &&
                this.zPosition === dest.zPosition) {
                return;
            }

            var fake = this.clone();

            var iter = 1;
            for (iter = 1; iter <= 5; iter++) {
                this.clone(fake);
                fake.interp(dest, iter / 5);
                if (level.isInsideTile(fake.xPosition, fake.yPosition, fake.zPosition)) {
                    break;
                }
            }

            iter--; //We care about the last iter we were *NOT* inside a tile
            this.interp(dest, iter / 5);

            var zGran = 0x1000 / 0x10000;


            while (zGran != 0) {
                this.clone(fake);
                fake.zPosition += zGran;
                if (dest.zPosition - this.zPosition >= zGran && !level.isInsideTile(fake.xPosition, fake.yPosition, fake.zPosition)) {
                    this.zPosition = fake.zPosition;
                } else {
                    zGran /= 0x10;
                    zGran = Math.floor(zGran * 0x10000) / 0x10000;
                }
            }

            this.zPosition = this.fp.round32(this.zPosition);

            var xGran = dest.xPosition > this.xPosition ? (0x7D / 0x80) : (-0x7D / 0x80);
            while (Math.abs(xGran) > 0) {
                this.clone(fake);
                fake.xPosition += xGran;
                if (Math.abs(dest.xPosition - this.xPosition) >= Math.abs(xGran) && !level.isInsideTile(fake.xPosition, fake.yPosition, fake.zPosition)) {
                    this.xPosition = fake.xPosition;
                } else {
                    xGran = sFloor(xGran / 5.0 * 0x80) / 0x80;
                }
            }

            this.xPosition = this.fp.round16(this.xPosition);

            var yGran = dest.yPosition > this.yPosition ? (0x7D / 0x80) : (-0x7D / 0x80);
            while (Math.abs(yGran) > 0) {
                this.clone(fake);
                fake.yPosition += yGran;
                if (Math.abs(dest.yPosition - this.yPosition) >= Math.abs(yGran) && !level.isInsideTile(fake.xPosition, fake.yPosition, fake.zPosition)) {
                    this.yPosition = fake.yPosition;
                } else {
                    yGran = sFloor(yGran / 5.0 * 0x80) / 0x80;
                }
            }

            this.yPosition = this.fp.round16(this.yPosition);
        }

        private handleBumps(expected: Ship, level: Levels.Level, eventBus: Events.EventBus) {
            var movedShip = this.clone();
            movedShip.zPosition = expected.zPosition;
            if (this.zPosition != expected.zPosition && level.isInsideTile(movedShip.xPosition, movedShip.yPosition, movedShip.zPosition)) {
                var bumpOff = 0x3a0 / 0x80;

                this.clone(movedShip);
                movedShip.xPosition = this.xPosition - bumpOff;
                movedShip.zPosition = expected.zPosition;
                if (!level.isInsideTile(movedShip.xPosition, movedShip.yPosition, movedShip.zPosition)) {
                    this.xPosition = movedShip.xPosition;
                    expected.zPosition = this.zPosition;
                    eventBus.fire(new ShipEvents.ShipBumpedWallEvent());
                } else {
                    movedShip.xPosition = this.xPosition + bumpOff;
                    if (!level.isInsideTile(movedShip.xPosition, movedShip.yPosition, movedShip.zPosition)) {
                        this.xPosition = movedShip.xPosition;
                        expected.zPosition = this.zPosition;
                        eventBus.fire(new ShipEvents.ShipBumpedWallEvent());
                    }
                }
            }
        }

        private handleCollision(expected: Ship, eventBus: Events.EventBus): void {
            if (Math.abs(this.zPosition - expected.zPosition) > 0.01) {
                if (this.zVelocity < 1.0 / 3.0 * 0x2aaa / 0x10000) {
                    this.zVelocity = 0.0;
                    eventBus.fire(new ShipEvents.ShipBumpedWallEvent());
                } else if (this.state !== ShipState.Exploded) {
                    this.state = ShipState.Exploded;
                    eventBus.fire(new ShipEvents.ShipExplodedEvent());
                }
            }
        }

        private handleSlideCollision(expected: Ship): void {
            if (Math.abs(this.xPosition - expected.xPosition) > 0.01) {
                this.xMovementBase = 0.0;
                if (this.slideAmount !== 0.0) {
                    expected.xPosition = this.xPosition;
                    this.slideAmount = 0.0;
                }
                this.zVelocity -= 0x97 / 0x10000;
                this.clampGlobalZVelocity();
            }
        }

        private handleBounce(expected: Ship, level: Levels.Level): void {
            this.isOnGround = false;
            if (this.yVelocity < 0 && expected.yPosition !== this.yPosition) {
                this.zVelocity += this.jumpOMasterVelocityDelta;
                this.jumpOMasterVelocityDelta = 0.0;
                this.hasRunJumpOMaster = false;
                this.jumpOMasterInUse = false;

                this.isGoingUp = false;
                this.isOnGround = true;
                this.slidingAccel = 0;

                var movedShip = this.clone();
                for (var i: number = 1; i <= 0xE; i++) {
                    this.clone(movedShip);
                    movedShip.xPosition += i;
                    movedShip.yPosition -= 1.0 / 0x80;

                    if (!level.isInsideTile(movedShip.xPosition, movedShip.yPosition, movedShip.zPosition)) {
                        this.slidingAccel++;
                        this.offsetAtWhichNotInsideTile = i;
                        break;
                    }
                }

                for (var i: number = 1; i <= 0xE; i++) {
                    this.clone(movedShip);
                    movedShip.xPosition -= i;
                    movedShip.yPosition -= 1.0 / 0x80;
                    if (!level.isInsideTile(movedShip.xPosition, movedShip.yPosition, movedShip.zPosition)) {
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
        }

        private handleOxygenAndFuel(level: Levels.Level): void {
            this.oxygenRemaining -= 0x7530 / (0x24 * level.Oxygen);
            if (this.oxygenRemaining <= 0) {
                this.oxygenRemaining = 0;
                this.state = ShipState.OutOfOxygen;
            }

            this.fuelRemaining -= this.zVelocity * 0x7530 / level.Fuel;
            if (this.fuelRemaining <= 0) {
                this.fuelRemaining = 0;
                this.state = ShipState.OutOfFuel;
            }
        }

        private interp(dest: Ship, percent: number): void {
            this.xPosition = this.fp.round16((dest.xPosition - this.xPosition) * percent + this.xPosition);
            this.yPosition = this.fp.round16((dest.yPosition - this.yPosition) * percent + this.yPosition);
            this.zPosition = this.fp.round32((dest.zPosition - this.zPosition) * percent + this.zPosition);
        }

        private runJumpOMaster(controls: ControllerState, level: Levels.Level): void {
            if (this.willLandOnTile(controls, this, level)) {
                return;
            }

            var zVelocity = this.zVelocity;
            var xMov = this.xMovementBase;
            var i: number;
            for (i = 1; i <= 6; i++) {
                this.xMovementBase = this.fp.round16(xMov + xMov * i / 10);
                if (this.willLandOnTile(controls, this, level)) {
                    break;
                }

                this.xMovementBase = this.fp.round16(xMov - xMov * i / 10);
                if (this.willLandOnTile(controls, this, level)) {
                    break;
                }

                this.xMovementBase = xMov;

                var zv2 = this.fp.round32(zVelocity + zVelocity * i / 10);
                this.zVelocity = this.clampZVelocity(zv2);
                if (this.zVelocity == zv2) {
                    if (this.willLandOnTile(controls, this, level)) {
                        break;
                    }
                }

                zv2 = this.fp.round32(zVelocity - zVelocity * i / 10);
                this.zVelocity = this.clampZVelocity(zv2);
                if (this.zVelocity == zv2) {
                    if (this.willLandOnTile(controls, this, level)) {
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

        private isOnNothing(level: Levels.Level, xPosition: number, zPosition: number) {
            var cell = level.getCell(xPosition, 0, zPosition);
            return cell.isEmpty() || (cell.Tile != null && cell.Tile.Effect == Levels.TouchEffect.Kill);
        }

        private willLandOnTile(controls: ControllerState, ship: Ship, level: Levels.Level): boolean {
            var xPos: number = ship.xPosition,
                yPos: number = ship.yPosition,
                zPos: number = ship.zPosition,
                xVelocity: number = ship.xMovementBase,
                yVelocity: number = ship.yVelocity,
                zVelocity: number = ship.zVelocity;

            while (true) {
                var currentX = xPos;
                var currentSlideAmount = this.slideAmount;
                var currentZ = zPos;

                yVelocity += level.getGravityAcceleration();
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
                    return !this.isOnNothing(level, currentX, currentZ) && !this.isOnNothing(level, xPos, zPos);
                }
            }
        }

        private clampZVelocity(z: number): number {
            return Math.min(Math.max(0.0, z), 0x2AAA / 0x10000);
        }

        private clampGlobalZVelocity(): void {
            this.zVelocity = this.clampZVelocity(this.zVelocity);
        }

        public isDifferentHeight(other: Ship): boolean {
            return Math.abs(other.yPosition - this.yPosition) > 0.01;
        }

        public sanitizeParameters(): void {
            this.xPosition = Math.round(this.xPosition * 0x80) / 0x80;
            this.yPosition = Math.round(this.yPosition * 0x80) / 0x80;
            this.zPosition = Math.round(this.zPosition * 0x10000) / 0x10000;
        }
    }
} 