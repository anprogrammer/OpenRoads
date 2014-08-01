module VR {
    declare class ChildProcess {
        unref(): void;
    }
    declare class ChildProcessStatic {
        spawn(cmd: string, args: string[], opts: any): ChildProcess;
    }

    declare class Process {
        exit(): void;
        argv: string[];
    }

    declare class FS {
        openSync(name: string, mode: string): void;
    }

    declare var process: Process;

    export class NodeVRProvider implements VRProvider {
        private glfw: GLFW.GLFW;
        private managers: Managers.ManagerSet;
        private window: HTMLCanvasElement;
        private childProcess: ChildProcessStatic;
        private fs: FS;

        constructor(glfw: GLFW.GLFW, managers: Managers.ManagerSet, window: HTMLCanvasElement) {
            this.glfw = glfw;
            this.managers = managers;
            this.window = window;
            this.childProcess = require('child_process');
            this.fs = require('fs');
        }

        public enable(disableVsync: boolean): boolean {
            return this.glfw.enableHMD(disableVsync);
        }

        public getTargetResolution(): TSM.vec2 {
            return new TSM.vec2(this.glfw.getHMDTargetSize());
        }

        public getTargetFboId(gl: WebGLRenderingContext): number {
            return this.glfw.getHMDFboId(gl);
        }

        public getHeadCameraState(eyeNum: number): Engine.CameraState {
            return new Engine.CameraState(this.getHeadPosition(eyeNum), this.getHeadOrientation(eyeNum), this.getEyeViewAdjust(eyeNum), this.getEyeProjectionMatrix(eyeNum));
        }

        public getEyeViewport(eyeNum: number): TSM.vec4 {
            return new TSM.vec4(this.glfw.getEyeViewport(eyeNum));
        }

        public startEye(eyeNum: number): void {
            this.glfw.startVREye(eyeNum);
        }

        //Went away with Oculus SDK 0.4 but may come back...
        public endEye(eyeNum: number): void {
        }

        public isVRSafetyWarningVisible(): boolean {
            return this.glfw.isVRSafetyWarningVisible();
        }

        public exit() {
            process.exit();
        }

        public resetOrientation() {
            this.glfw.resetVROrientation();
        }

        handlePlatformKeys(controls: Controls.ControlSource): void {
            if (controls.getSwitchMonitor()) {
                var monSetting = this.managers.Settings.MonitorIdx;
                monSetting.setValue((monSetting.getValue() + 1) % this.glfw.getMonitorCount());
                this.glfw.destroyWindow(this.window);

                var out = this.fs.openSync('./out.log', 'a');
                var err = this.fs.openSync('./out.log', 'a');

                var proc = this.childProcess.spawn(process.argv[0], process.argv.slice(1), { detached: true, stdio: ['ignore', out, err] });
                proc.unref();

                process.exit();
            }
        }

        private getEyeViewAdjust(n: number): TSM.vec3 {
            return new TSM.vec3(this.glfw.getEyeViewAdjust(n));
        }

        private getEyeProjectionMatrix(n: number): TSM.mat4 {
            return new TSM.mat4(this.glfw.getProjectionMatrix(n));
        }

        private getHeadPosition(n: number): TSM.vec3 {
            return new TSM.vec3(this.glfw.getHeadPosition(n));
            //var stick = this.getJoystickValues();
            //return new TSM.vec3([stick[4] * 6, stick[2] * 6, stick[3] * 6]);
        }

        private getHeadOrientation(n: number): TSM.quat {
            return new TSM.quat(this.glfw.getHeadOrientation(n));
            //var stick = this.getJoystickValues();
            //return TSM.quat.fromAxis(new TSM.vec3([0.0, 1.0, 0.0]), stick[0] * 0.5)
            //    .multiply(TSM.quat.fromAxis(new TSM.vec3([1.0, 0.0, 0.0]), stick[1] * 1.5));
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