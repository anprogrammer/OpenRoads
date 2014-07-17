module WGL {
    export class Buffer {
        private gl: WebGLRenderingContext;
        private buffer: WebGLBuffer;
        private bufferType: number;
        private size: number;

        constructor(gl: WebGLRenderingContext, bufferType: number = -1) {
            if (bufferType === -1) {
                bufferType = gl.ARRAY_BUFFER;
            }
            this.gl = gl;
            this.buffer = gl.createBuffer();
            this.bufferType = bufferType;
            this.size = -1;
        }

        public bind(): void {
            this.gl.bindBuffer(this.bufferType, this.buffer);
        }

        public loadData(data: Float32Array, usage: number = -1) {
            if (usage === -1) {
                usage = this.gl.STATIC_DRAW;
            }
            this.bind();
            this.gl.bufferData(this.bufferType, data, usage);
            this.size = data.length;
        }

        public getNumElements(): number {
            return this.size;
        }
    }
} 