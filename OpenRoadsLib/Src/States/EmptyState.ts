module States {
    export class EmptyState implements Engine.GameState {
        private managers: Managers.ManagerSet;

        private watchers: Engine.KeyWatcher[] = [];

        constructor(managers: Managers.ManagerSet) {
            this.managers = managers;
        }

        load(gl: WebGLRenderingContext): void {
            var managers = this.managers;
        }

        unload(): void {
        }

        

        updatePhysics(frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void {
        }

        drawFrame(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void {
            var helper = new ClassicGLStateHelper();
            helper.startFrame(gl, canvas);
        }
    }
}  