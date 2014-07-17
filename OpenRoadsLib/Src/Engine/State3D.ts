module Engine {
    export interface State3DDrawer {
        draw(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState, state: State3D): void;
    }

    export class State3D implements GameState {
        private drawer: State3DDrawer;
        private managers: Managers.ManagerSet;

        constructor(managers: Managers.ManagerSet) {
            this.managers = managers;
        }

        load(gl: WebGLRenderingContext): void {
            this.drawer = this.managers.Graphics.getState3DDrawer(gl, this.managers);
        }

        unload(): void {
        }

        updatePhysics(frameManager: FrameManager, frameTimeInfo: FrameTimeInfo): void {
        }

        drawFrame(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState): void {
            this.drawer.draw(gl, canvas, frameManager, frameTimeInfo, cam, this);
        }

        drawFrame3D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState): void {
            throw "NOT IMPLEMENTED";
        }
    }
} 