declare module GLFW {
    export class GLFW {
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
        isVRSafetyWarningVisible(): boolean;
        resetVROrientation(): void;
    }
}