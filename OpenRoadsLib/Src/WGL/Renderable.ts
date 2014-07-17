module WGL {
    export class GLState {
        constructor(gl: WebGLRenderingContext) {
            this.BlendSrc = gl.SRC_ALPHA;
            this.BlendDst = gl.ONE_MINUS_SRC_ALPHA;
        }
        public EnableBlend: boolean = false;
        public EnableDepthTest: boolean = false;
        public BlendSrc: number = 0
        public BlendDst: number = 0;
    }

    export class Renderable {
        private gl: WebGLRenderingContext;
        public State: GLState;
        private vertex: VertexDescriptor;
        private shader: Shader;
        private buffer: Buffer;

        constructor(gl: WebGLRenderingContext, glState: GLState, vertexDescriptor: VertexDescriptor, shader: Shader, buffer: Buffer) {
            this.gl = gl;
            this.State = glState;
            this.vertex = vertexDescriptor;
            this.shader = shader;
            this.buffer = buffer;
        }


        public configureState(state: GLState): void {
            var gl = this.gl;
            if (state.EnableBlend) {
                gl.enable(gl.BLEND);
            } else {
                gl.disable(gl.BLEND);
            }
            gl.blendFunc(state.BlendSrc, state.BlendDst);

            if (state.EnableDepthTest) {
                gl.enable(gl.DEPTH_TEST);
            } else {
                gl.disable(gl.DEPTH_TEST);
            }
        }

        public preDraw(gl: WebGLRenderingContext, shader: Shader) {
        }

        public postDraw(gl: WebGLRenderingContext, shader: Shader) {
        }

        public draw(): void {
            this.buffer.bind();
            this.shader.use();
            this.vertex.enableAndConfigureVertexAttributes(this.shader);
            this.configureState(this.State);
            this.preDraw(this.gl, this.shader);
            this.vertex.drawContiguous(this.gl, this.buffer);
            this.postDraw(this.gl, this.shader);
            this.vertex.disableVertexAttributes(this.shader);
        }
    }
} 