module Engine {
    export class ClassicState2DDrawer implements State2DDrawer {
        draw(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState, state: State2D): void {
            var helper = new States.ClassicGLStateHelper();
            helper.startFrame(gl, canvas);
            state.drawFrame2D(gl, canvas, frameManager, frameTimeInfo, cam);
        }
    }
} 