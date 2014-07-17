/// <reference path="../WGL/Renderable.ts" />
module Drawing {
    export class Sprite extends WGL.Renderable {
        public Texture: WGL.Texture;
        public Position: TSM.vec3;
        public Size: TSM.vec2;
        public ULow: TSM.vec2;
        public UHigh: TSM.vec2;
        public VLow: TSM.vec2;
        public VHigh: TSM.vec2;
        public Alpha: number;
        public Brightness: number;

        public ProjectionMatrix: TSM.mat4;
        public ModelMatrix: TSM.mat4;
        public ViewMatrix: TSM.mat4;

        private uSampler: WGL.ShaderUniform;
        private uPos: WGL.ShaderUniform;
        private uSize: WGL.ShaderUniform;
        private uAlpha: WGL.ShaderUniform;
        private uBrightness: WGL.ShaderUniform;
        private uULow: WGL.ShaderUniform;
        private uVLow: WGL.ShaderUniform;
        private uUHigh: WGL.ShaderUniform;
        private uVHigh: WGL.ShaderUniform;

        private uProjectionMatrix: WGL.ShaderUniform;
        private uModelMatrix: WGL.ShaderUniform;
        private uViewMatrix: WGL.ShaderUniform;
       
        constructor(gl: WebGLRenderingContext, managers: Managers.ManagerSet, texture: TextureFragment, shader: WGL.Shader = null) {
            this.ModelMatrix = TSM.mat4.identity.copy();
            this.ViewMatrix = TSM.mat4.identity.copy();
            this.ProjectionMatrix = TSM.mat4.perspective(80.0, 320.0 / 200.0, 0.1, 1000.0);

            this.Texture = texture.Texture;
            this.Position = new TSM.vec3([texture.XOffset, texture.YOffset, 0.0]);
            this.Size = new TSM.vec2([texture.Width, texture.Height]);
            this.Alpha = 1.0;
            this.Brightness = 1.0;
            this.ULow = new TSM.vec2([0.0, 0.0]);
            this.UHigh = new TSM.vec2([1.0, 0.0]);
            this.VLow = new TSM.vec2([0.0, 0.0]);
            this.VHigh = new TSM.vec2([0.0, 1.0]);

            shader = shader || managers.Shaders.getShader(gl, managers.Shaders.Shaders.Basic2D);
            var vertDesc = Vertices.Vertex2D.getDescriptor(gl);
            var vertices = [
                new Vertices.Vertex2D(0.0, 0.0),
                new Vertices.Vertex2D(1.0, 0.0),
                new Vertices.Vertex2D(1.0, 1.0),
                new Vertices.Vertex2D(1.0, 1.0),
                new Vertices.Vertex2D(0.0, 1.0),
                new Vertices.Vertex2D(0.0, 0.0)
            ];

            var state = new WGL.GLState(gl);
            state.EnableBlend = true;

            var buffer = new WGL.Buffer(gl);
            buffer.loadData(vertDesc.buildArray(vertices));

            this.uSampler = shader.getUniform("uSampler");
            this.uPos = shader.getUniform("uPos");
            this.uSize = shader.getUniform("uSize");
            this.uAlpha = shader.getUniform("uAlpha");
            this.uBrightness = shader.getUniform("uBrightness");
            this.uULow = shader.getUniform("uLow");
            this.uVLow = shader.getUniform("vLow");
            this.uUHigh = shader.getUniform("uHigh");
            this.uVHigh = shader.getUniform("vHigh"); 

            this.uModelMatrix = shader.getUniform("uModelMatrix");
            this.uViewMatrix = shader.getUniform("uViewMatrix");
            this.uProjectionMatrix = shader.getUniform("uProjectionMatrix");

            super(gl, state, vertDesc, shader, buffer);
        }

        public preDraw(gl: WebGLRenderingContext, shader: WGL.Shader) {
            this.Texture.attachToUniform(this.uSampler);
            this.uPos.setVec3(this.Position);
            this.uSize.setVec2(this.Size);
            this.uBrightness.set1f(this.Brightness);
            this.uAlpha.set1f(this.Alpha);
            this.uULow.setVec2(this.ULow);
            this.uVLow.setVec2(this.VLow);
            this.uUHigh.setVec2(this.UHigh);
            this.uVHigh.setVec2(this.VHigh);

            if (this.uProjectionMatrix !== null) {
                this.uProjectionMatrix.setMat4(this.ProjectionMatrix);
            }
            if (this.uModelMatrix !== null) {
                this.uModelMatrix.setMat4(this.ModelMatrix);
            }
            if (this.uViewMatrix !== null) {
                this.uViewMatrix.setMat4(this.ViewMatrix);
            }
        }

        public postDraw(gl: WebGLRenderingContext, shader: WGL.Shader) {
            this.Texture.detachFromUniform();
        }
    }
} 