module WGL {
    export class Renderbuffer {
        private gl: WebGLRenderingContext;
        private buffer: WebGLRenderbuffer;


        constructor(gl: WebGLRenderingContext) {
            this.buffer = gl.createRenderbuffer();
            this.gl = gl;
        }

        public bind(): void {
            this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.buffer);
        }

        public unbind(): void {
            this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
        }

        public setSize(width: number, height: number): void {
            var gl = this.gl;
            this.bind();
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        }

        public getGLRenderbuffer(): WebGLRenderbuffer {
            return this.buffer;
        }
    }
}   