module WGL {
    export class Shader {
        private gl: WebGLRenderingContext;
        private program: WebGLProgram;
        private attributes: { [name: string]: VertexAttribute } = {};
        private uniforms: { [name: string]: ShaderUniform } = {};

        constructor(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
            function getShader(src: string, type: number): WebGLShader {
                var shader = gl.createShader(type);

                gl.shaderSource(shader, src);
                gl.compileShader(shader);

                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    console.log(src);
                    console.log(gl.getShaderInfoLog(shader));
                    throw "Shader failed to compile.";
                }

                return shader;
            }

            var vertShader = getShader(vertexSource, gl.VERTEX_SHADER);
            var fragShader = getShader(fragmentSource, gl.FRAGMENT_SHADER);

            var program = gl.createProgram();
            gl.attachShader(program, vertShader);
            gl.attachShader(program, fragShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.log(vertexSource);
                console.log(fragmentSource);
                console.log(gl.getProgramInfoLog(program));
                throw "Shader failed to link.";
            }

            this.gl = gl;
            this.program = program;
        }

        public use(): void {
            this.gl.useProgram(this.program);
        }

        public getVertexAttribute(name: string): VertexAttribute {
            if (!(name in this.attributes)) {
                var gl = this.gl;
                this.use();
                var attrib = gl.getAttribLocation(this.program, name);
                this.attributes[name] = attrib !== -1 ? new VertexAttribute(gl, attrib) : null;
            }
            return this.attributes[name];
        }

        public getUniform(name: string): ShaderUniform {
            if (!(name in this.uniforms)) {
                var gl = this.gl;
                this.use();
                var loc = gl.getUniformLocation(this.program, name);
                this.uniforms[name] = loc !== null ? new ShaderUniform(gl, loc) : null;
            }
            return this.uniforms[name];
        }
    }
} 