module WGL {
    export class Texture {
        private static textureUnitAvailable: boolean[] = [true, true, true, true];

        private texture: WebGLTexture;
        private gl: WebGLRenderingContext;
        private boundTo: number = -1;

        public Width: number;
        public Height: number;


        constructor(gl: WebGLRenderingContext) {
            this.texture = gl.createTexture();
            this.gl = gl;
            this.setFilters(gl.NEAREST, gl.NEAREST);
        }

        public bind(): void {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        }

        public unbind(): void {
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        }

        public loadData(image: HTMLCanvasElement): void {
            this.Width = image.width;
            this.Height = image.height;

            var gl = this.gl;
            this.bind();
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        }

        public createEmpty(width: number, height: number): void {
            this.Width = width;
            this.Height = height;
            var gl = this.gl;
            this.bind();

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }

        public setFilters(minFilter: number, magFilter: number): void {
            var gl = this.gl;
            this.bind();
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        public generateMipmap(): void {
            var gl = this.gl;
            this.bind();
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        public attachToUniform(uniform: ShaderUniform): void {
            for (var i = 0; i < Texture.textureUnitAvailable.length; i++) {
                if (Texture.textureUnitAvailable[i]) {
                    this.attachToUniformExplicit(uniform, i);
                    return;
                }
            }

            throw "All texture units in use";
        }

        private attachToUniformExplicit(uniform: ShaderUniform, activeTextureNum: number) {
            var gl = this.gl;

            if (!Texture.textureUnitAvailable[activeTextureNum]) {
                throw "Texture unit " + activeTextureNum + "already in use!";
            }
            this.boundTo = activeTextureNum;
            Texture.textureUnitAvailable[activeTextureNum] = false;

            gl.activeTexture(activeTextureNum + gl.TEXTURE0);
            this.bind();
            uniform.set1i(activeTextureNum);
        }

        public detachFromUniform() {
            if (this.boundTo == -1) {
                throw "Texture not currently bound";
            }

            Texture.textureUnitAvailable[this.boundTo] = true;
            this.boundTo = -1;
        }

        public getGLTexture(): WebGLTexture {
            return this.texture;
        }
    }
} 