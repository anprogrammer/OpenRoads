module WGL {
    export class VertexAttribute {
        public gl: WebGLRenderingContext;
        public location: number;
        constructor(gl: WebGLRenderingContext, location: number) {
            if (location == -1) {
                throw "Invalid attrib";
            }

            this.gl = gl;
            this.location = location;
        }

        public enable() {
            this.gl.enableVertexAttribArray(this.location);
        }

        public disable() {
            this.gl.disableVertexAttribArray(this.location);
        }

        public attribPointer(size: number, type: number, normalized: boolean, stride: number, offset: number): void {
            this.gl.vertexAttribPointer(this.location, size, type, normalized, stride, offset);
        }
    }
} 