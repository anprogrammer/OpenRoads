module Game {
    function sFloor(n: number) {
        var s = n >= 0 ? 1 : -1;
        return Math.floor(n * s) * s;
    }

    export class StateManager {
        private level: Levels.Level = null;
        private controller: Controller = null;

        private current: Ship;
        private expected: Ship;

        public didWin: boolean = false;

        constructor(managers: Managers.ManagerSet, level: Levels.Level, controller: Controller) {
            this.level = level;
            this.controller = controller;

            this.resetStateVars();
        }

        private resetStateVars(): void {
            this.current = new Ship({
                xPosition: 0x8000 / 0x80,
                yPosition: 0x2800 / 0x80,
                zPosition: 3.0,

                slideAmount: 0,
                slidingAccel: 0,
                xMovementBase: 0,
                yVelocity: 0,
                zVelocity: 0,

                offsetAtWhichNotInsideTile: 0,

                isOnGround: true,
                isOnDecelPad: false,
                isOnSlidingTile: false,
                isGoingUp: false,

                fuelRemaining: 0x7530,
                oxygenRemaining: 0x7530,

                jumpedFromYPosition: 0,

                state: ShipState.Alive,

                hasRunJumpOMaster: false,
                jumpOMasterInUse: false,
                jumpOMasterVelocityDelta: 0
            });

            this.expected = this.current.clone();
        }

        public getLevel() {
            return this.level;
        }

        public runFrame(eventBus: Events.EventBus): GameSnapshot {
            var controls = this.controller.update(this.current);
            this.current.update(this.level, this.expected, controls, eventBus);


           
            if (this.current.getZPosition() >= this.level.getLength() - 0.5 && this.level.isInsideTunnel(this.current.getXPosition(), this.current.getYPosition(), this.current.getZPosition())) {
                this.didWin = true;
            }

            var result = new GameSnapshot();
            result.Position = new TSM.vec3([this.current.getXPosition(), this.current.getYPosition(), this.current.getZPosition()]);
            result.Velocity = new TSM.vec3([0.0, 0.0, this.current.getZVelocity() + this.current.getJumpOMasterVelocityDelta()]);
            result.CraftState = this.current.getState();
            result.FuelPercent = this.current.getFuelRemaining() / 0x7530;
            result.OxygenPercent = this.current.getOxygenRemaining() / 0x7530;
            result.JumpOMasterInUse = this.current.getJumpOMasterInUse();
            result.JumpOMasterVelocityDelta = this.current.getJumpOMasterVelocityDelta();
            return result;
        }
    }
} 