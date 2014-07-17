module Engine {
    export class CameraState {
        constructor(headPosition: TSM.vec3, headOrientation: TSM.quat, eyeOffset: TSM.vec3, projectionMatrix: TSM.mat4) {
            this.HeadPosition = headPosition;
            this.HeadOrientation = headOrientation;
            this.EyeOffset = eyeOffset;
            this.ProjectionMatrix = projectionMatrix;
        }

        public HeadPosition: TSM.vec3;
        public HeadOrientation: TSM.quat;
        public EyeOffset: TSM.vec3;
        public ProjectionMatrix: TSM.mat4;
    }
} 