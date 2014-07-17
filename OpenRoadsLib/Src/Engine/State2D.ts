module Engine {
    export interface State2DDrawer {
        draw(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState, state: State2D) : void;
    }

    export class State2D implements GameState {
        private drawer: State2DDrawer;
        private managers: Managers.ManagerSet;

        constructor(managers: Managers.ManagerSet) {
            this.managers = managers;
        }

        load(gl: WebGLRenderingContext): void {
            this.drawer = this.managers.Graphics.getState2DDrawer(gl, this.managers);
        }

        unload(): void {
        }

        updatePhysics(frameManager: FrameManager, frameTimeInfo: FrameTimeInfo): void {
        }

        drawFrame(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState): void {
            this.drawer.draw(gl, canvas, frameManager, frameTimeInfo, cam, this);
        }

        drawFrame2D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState): void {
            throw "drawFrame2D NOT IMPLEMENTED";
        }
    }
} 