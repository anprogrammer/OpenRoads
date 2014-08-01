module VR {
    export interface VRProvider {
        enable(disableVsync: boolean): boolean;
        getTargetResolution(): TSM.vec2;
        getTargetFboId(gl: WebGLRenderingContext): number;
        getHeadCameraState(eyeNum: number): Engine.CameraState;
        getEyeViewport(eyeNum: number): TSM.vec4;
        isVRSafetyWarningVisible(): boolean;

        startEye(eyeNum: number): void;
        endEye(eyeNum: number): void;

        resetOrientation(): void;

        handlePlatformKeys(controls: Controls.ControlSource): void;

        exit(): void;
    }
} 