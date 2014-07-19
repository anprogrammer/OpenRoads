module States {
    export class Help extends Engine.State2D  implements Engine.GameState {
        private myManagers: Managers.ManagerSet;
        private frames: Drawing.Sprite[];
        private watchers: Controls.ConditionWatcher[] = [];
        private frameNum: number = 0;
        private fadeDir: number = 0;

        constructor(managers: Managers.ManagerSet) {
            super(managers);
            this.myManagers = managers;
        }

        load(gl: WebGLRenderingContext): void {
            super.load(gl);
            var managers = this.myManagers;
            this.frames = managers.Textures.getTextures(gl, "HELPMENU.LZS").map((tf) => new Drawing.Sprite(gl, managers, tf));

            var controls = this.myManagers.Controls;
            this.watchers.push(new Controls.ConditionWatcher(() => controls.getExit(), () => this.exit()));
            this.watchers.push(new Controls.ConditionWatcher(() => controls.getEnter(), () => this.next()));
        }

        unload(): void {
        }

        private exit(): void {
            this.myManagers.Frames.popState();
        }

        private next(): void {
            if (this.frameNum === this.frames.length - 1) {
                this.myManagers.Frames.popState();
            } else {
                this.fadeDir = -1.0;
            }
        }

        updatePhysics(frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void {
            for (var i = 0; i < this.watchers.length; i++) {
                this.watchers[i].update(frameTimeInfo);
            }
            this.frames[this.frameNum].Brightness += this.fadeDir * frameTimeInfo.getPhysicsStep();
            if (this.frames[this.frameNum].Brightness <= 0.0) {
                this.frames[this.frameNum].Brightness = 0.0;
                this.frameNum++;
                this.frames[this.frameNum].Brightness = 0.0;
                this.fadeDir = 1.0;
            } else if (this.frames[this.frameNum].Brightness >= 1.0) {
                this.frames[this.frameNum].Brightness = 1.0;
                this.fadeDir = 0.0;
            }
        }

        drawFrame2D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void {
            this.frames[this.frameNum].draw();
        }
    }
}  