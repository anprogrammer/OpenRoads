module VR {
    export declare class GLFW {
        enableHMD(): boolean;
        getHMDTargetSize(): number[];
        getHMDFboId(gl: WebGLRenderingContext): number;
        getEyeViewAdjust(n: number): number[];
        getEyeViewport(n: number): number[];
        getHeadPosition(n: number): number[];
        getHeadOrientation(n: number): number[];
        getProjectionMatrix(n: number): number[];
        getJoystickAxes(): string;
        getJoystickButtons(): string;
        startVREye(n: number): void;
        endVREye(n: number): void;
    }

    export class NodeVRProvider implements VRProvider {
        private glfw: GLFW;
        constructor(glfw: GLFW) {
            this.glfw = glfw;
        }

        public enable(): boolean {
            return this.glfw.enableHMD();
        }

        public getTargetResolution(): TSM.vec2 {
            return new TSM.vec2(this.glfw.getHMDTargetSize());
        }

        public getTargetFboId(gl: WebGLRenderingContext): number {
            return this.glfw.getHMDFboId(gl);
        }

        public getHeadCameraState(eyeNum: number): Engine.CameraState {
            var headPosition: TSM.vec3 = new TSM.vec3();
            var vs = this.getJoystickValues();
            var offset = new TSM.vec3([-vs[0], -vs[2], -vs[1]]).scale(0.5);
            headPosition.add(offset);

            var ry = TSM.quat.fromAxis(new TSM.vec3([0.0, 1.0, 0.0]), vs[4]);
            var rx = TSM.quat.fromAxis(new TSM.vec3([1.0, 0.0, 0.0]), vs[3]);
            var rz = new TSM.quat().setIdentity();
            var rotation = rx.multiply(ry).multiply(rz);

            return new Engine.CameraState(this.getHeadPosition(eyeNum).add(headPosition), this.getHeadOrientation(eyeNum).multiply(rotation), this.getEyeViewAdjust(eyeNum), this.getEyeProjectionMatrix(eyeNum));
        }

        public getEyeViewport(eyeNum: number): TSM.vec4 {
            return new TSM.vec4(this.glfw.getEyeViewport(eyeNum));
        }

        public startEye(eyeNum: number): void {
            this.glfw.startVREye(eyeNum);
        }

        public endEye(eyeNum: number): void {
            this.glfw.endVREye(eyeNum);
        }

        private getEyeViewAdjust(n: number): TSM.vec3 {
            var upIdx = 12, rightIdx = 13, downIdx = 14, leftIdx = 15;
            return new TSM.vec3(this.glfw.getEyeViewAdjust(n));
        }

        private getEyeProjectionMatrix(n: number): TSM.mat4 {
            return new TSM.mat4(this.glfw.getProjectionMatrix(n));
        }

        private getHeadPosition(n: number): TSM.vec3 {
            return new TSM.vec3(this.glfw.getHeadPosition(n));
        }

        private getHeadOrientation(n: number): TSM.quat {
            return new TSM.quat(this.glfw.getHeadOrientation(n));
        }

        private getJoystickValues(): number[]{
            var s = this.glfw.getJoystickAxes();
            return s.split(',').map(function (v) {
                return parseFloat(v);
            });
        }

        private getJoystickButtons(): boolean[] {
            var s = this.glfw.getJoystickButtons();
            return s.split(',').map(function (v) {
                return parseFloat(v) > 0;
            });
        }
    }
} 