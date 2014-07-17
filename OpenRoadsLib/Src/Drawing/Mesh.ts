/// <reference path="../WGL/Renderable.ts" />
module Drawing {
    export class Mesh extends WGL.Renderable {
        public Texture: WGL.Texture;

        public ProjectionMatrix: TSM.mat4;
        public ModelMatrix: TSM.mat4;
        public ViewMatrix: TSM.mat4;
        public Scale: number;

        private uSampler: WGL.ShaderUniform;
        private uProjectionMatrix: WGL.ShaderUniform;
        private uModelMatrix: WGL.ShaderUniform;
        private uViewMatrix: WGL.ShaderUniform;
        private uScale: WGL.ShaderUniform;

        constructor(gl: WebGLRenderingContext, managers: Managers.ManagerSet, vertices: Vertices.Vertex3DC[], shader: WGL.Shader = null) {
            this.Scale = 1.0;
            this.ModelMatrix = TSM.mat4.identity.copy();
            this.ViewMatrix = TSM.mat4.identity.copy();
            this.ProjectionMatrix = TSM.mat4.perspective(80.0, 320.0 / 200.0, 0.1, 1000.0);
            this.Texture = managers.Textures.getTexture(gl, 'WHITE').Texture;

            shader = shader || managers.Shaders.getShader(gl, managers.Shaders.Shaders.Color3D);
            var vertDesc = Vertices.Vertex3DC.getDescriptor(gl);

            var state = new WGL.GLState(gl);
            state.EnableBlend = false;
            state.EnableDepthTest = true;

            var buffer = new WGL.Buffer(gl);
            buffer.loadData(vertDesc.buildArray(vertices));

            this.uModelMatrix = shader.getUniform("uModelMatrix");
            this.uViewMatrix = shader.getUniform("uViewMatrix");
            this.uProjectionMatrix = shader.getUniform("uProjectionMatrix");
            this.uScale = shader.getUniform("uScale");
            this.uSampler = shader.getUniform("uSampler");

            super(gl, state, vertDesc, shader, buffer);
        }

        public preDraw(gl: WebGLRenderingContext, shader: WGL.Shader) {
            if (this.uProjectionMatrix !== null) {
                this.uProjectionMatrix.setMat4(this.ProjectionMatrix);
            }
            if (this.uModelMatrix !== null) {
                this.uModelMatrix.setMat4(this.ModelMatrix);
            }
            if (this.uViewMatrix !== null) {
                this.uViewMatrix.setMat4(this.ViewMatrix);
            }
            if (this.uSampler !== null && this.Texture !== null) {
                this.Texture.attachToUniform(this.uSampler);
            }
            if (this.uScale !== null) {
                this.uScale.set1f(this.Scale);
            }
        }

        public postDraw(gl: WebGLRenderingContext, shader: WGL.Shader) {
            if (this.uSampler !== null && this.Texture !== null) {
                this.Texture.detachFromUniform();
            }
        }
    }
}  