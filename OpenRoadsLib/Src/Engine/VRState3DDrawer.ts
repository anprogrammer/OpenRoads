module Engine {
    export class VRState3DDrawer implements State3DDrawer {
        private managers: Managers.ManagerSet;

        constructor(managers: Managers.ManagerSet) {
            this.managers = managers;
        }

        private static initialized: boolean = false;

        draw(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState, state: State3D): void {
            var helper = new States.VRGLStateHelper(this.managers.VR);
            helper.startFrame(gl);

            var me = this;
            function getCam(eyeNum: number): Engine.CameraState {
                var base = me.managers.VR.getHeadCameraState(eyeNum);
                return base;
            }

            helper.startEye(gl, 0);
            var camLeft = getCam(0);
            state.drawFrame3D(gl, canvas, frameManager, frameTimeInfo, camLeft);
            helper.endEye(gl, 0);

            helper.startEye(gl, 1);
            var camRight = getCam(1);
            state.drawFrame3D(gl, canvas, frameManager, frameTimeInfo, camRight);
            helper.endEye(gl, 1);
        }
    }
} 