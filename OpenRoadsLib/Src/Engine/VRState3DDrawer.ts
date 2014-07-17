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
                //
                //var vwTransform = new TSM.mat4().setIdentity();
                //vwTransform.multiply(base.ViewTransform);
                //vwTransform.scale(new TSM.vec3([scale, scale, scale]));
                //
                //var eyeTransform = new TSM.mat4().setIdentity();
                //eyeTransform.multiply(base.EyeTransform);
                //eyeTransform.translate(new TSM.vec3([46.0 / scale, 0.0, 0.0]));
                //eyeTransform.multiply(base.EyeTransform);

                //cam.rotate(-Math.PI / 2.5, new TSM.vec3([1.0, 0.0, 0.0]));
                //cam.translate(new TSM.vec3([0.0, -180.0, 0.0]));
                //cam.translate(offset.scale(1.0 / scale));
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