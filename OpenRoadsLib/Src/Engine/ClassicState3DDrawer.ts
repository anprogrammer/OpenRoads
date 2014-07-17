module Engine {
    export class ClassicState3DDrawer implements State3DDrawer {
        draw(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState, state: State3D): void {
            var helper = new States.ClassicGLStateHelper();
            helper.startFrame(gl, canvas);
            state.drawFrame3D(gl, canvas, frameManager, frameTimeInfo, cam);
        }
    }
}  