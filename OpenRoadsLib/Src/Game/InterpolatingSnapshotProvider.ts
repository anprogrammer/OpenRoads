module Game {
    export class InterpolatingSnapshoptProvider {
        private first: GameSnapshot = null;
        private firstTime: number;
        private second: GameSnapshot = null;
        private secondTime: number;

        private tempState = new GameSnapshot();

        reset(): void {
            this.first = null;
            this.second = null;
            this.tempState.Position = new TSM.vec3();
            this.tempState.Velocity = new TSM.vec3();
        }

        pushSnapshot(s: GameSnapshot): void {
            this.second = this.first;
            this.secondTime = this.firstTime;

            this.first = s;
            this.firstTime = Date.now();
        }

        getSnapshot(): GameSnapshot {
            if (this.second === null) {
                return this.first;
            }

            var timeSince = Date.now() - this.firstTime;
            var percent = Math.max(0, Math.min(1.0, timeSince / (this.firstTime - this.secondTime)));

            var first = this.first;
            var second = this.second;
            var temp = this.tempState;
            temp.CraftState = first.CraftState;
            temp.FuelPercent = first.FuelPercent;
            temp.JumpOMasterInUse = first.JumpOMasterInUse;
            temp.JumpOMasterVelocityDelta = first.JumpOMasterVelocityDelta;
            temp.OxygenPercent = first.OxygenPercent;
            temp.Position = first.Position.copy().subtract(second.Position).scale(percent).add(second.Position);
            temp.Velocity = first.Velocity.copy().subtract(second.Velocity).scale(percent).add(second.Velocity);

            return temp;
        }
    }
} 