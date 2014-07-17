module States {
    export class ClassicGLStateHelper {
        constructor() {
        }

        public startFrame(gl: WebGLRenderingContext, canvas: HTMLCanvasElement) {
            var bw = canvas.width, bh = canvas.height;
            var w = 320, h = 200, ratio = w / h;
            var cw = Math.min(bw, bh * ratio), ch = cw / ratio;
            var ox = bw / 2 - cw / 2, oy = bh / 2 - ch / 2;
            gl.viewport(Math.floor(ox), Math.floor(oy), Math.floor(cw), Math.floor(ch));
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
    }

    export class VRGLStateHelper {
        private vr: VR.VRProvider;
        constructor(vrProvider: VR.VRProvider) {
            this.vr = vrProvider;
        }

        public startFrame(gl: WebGLRenderingContext) {
            var fb = this.vr.getTargetFboId(gl);
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            var sz = this.vr.getTargetResolution();
            gl.viewport(0, 0, sz.x, sz.y);
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        public startEye(gl: WebGLRenderingContext, eyeNum: number) {
            this.vr.startEye(eyeNum);
            var vp = this.vr.getEyeViewport(eyeNum);
            gl.viewport(vp.x, vp.y, vp.z, vp.w);
        }

        public endEye(gl: WebGLRenderingContext, eyeNum: number) {
            this.vr.endEye(eyeNum);
        }
    }
}