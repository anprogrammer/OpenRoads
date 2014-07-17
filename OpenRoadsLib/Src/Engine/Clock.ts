module Engine {
    export class FrameTimeInfo {
        private frameTime: number;

        public constructor(frameTime: number) {
            this.frameTime = frameTime;
        }

        public getPhysicsStep(): number {
            return 1.0 / 30.0;
        }

        public getFPS(): number {
            return 30.0;
        }

        public getFrameTime(): number {
            return this.frameTime;
        }
    }

    export class Clock {
        private lastTime: number;

        public constructor() {
            this.lastTime = Date.now();
        }

        public nextFrame(): FrameTimeInfo {
            var newTime = Date.now();
            var duration = (newTime - this.lastTime) / 1000.0;
            this.lastTime = newTime;

            return new FrameTimeInfo(duration);
        }
    }
} 