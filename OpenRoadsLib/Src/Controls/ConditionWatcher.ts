module Controls {
    export class ConditionWatcher {
        private enabled: boolean = false;
        private repeating: boolean = true;
        private heldTime: number = 0;
        private repeatRate: number;
        private repeatWait: number;
        private keyCode: number;
        private condition: () => boolean;
        private cb: Function;

        constructor(cond: () => boolean, cb: Function) {
            this.repeatWait = 0.5;
            this.repeatRate = 0.1;
            this.condition = cond;
            this.cb = cb;
        }

        public update(time: Engine.FrameTimeInfo) {
            if (this.condition()) {
                if (!this.enabled) {
                    this.enabled = true;
                    this.repeating = false;
                    this.heldTime = 0;
                    this.cb();
                } else {
                    this.heldTime += time.getPhysicsStep();
                    var interval = this.repeating ? this.repeatRate : this.repeatWait;

                    if (this.heldTime >= interval) {
                        this.heldTime -= interval;
                        this.cb();
                        this.repeating = true;
                    }
                }
            } else {
                this.enabled = false;
            }
        }
    }

}