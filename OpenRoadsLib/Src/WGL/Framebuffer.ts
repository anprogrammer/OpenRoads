module WGL {
    export class Framebuffer {
        private gl: WebGLRenderingContext;

        private buffer: WebGLFramebuffer;


        constructor(gl: WebGLRenderingContext) {
            this.buffer = gl.createFramebuffer();
            this.gl = gl;
        }

        public bind(): void {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.buffer);
        }

        public unbind(): void {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        }

        public setTexture(tex: Texture) {
            this.bind();
            tex.bind();

            var gl = this.gl;
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.getGLTexture(), 0);
        }

        public setRenderbuffer(rb: Renderbuffer) {
            this.bind();
            rb.bind();

            var gl = this.gl;
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb.getGLRenderbuffer());
        }
    }
}  