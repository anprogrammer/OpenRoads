module Managers {
    export class ShaderManager {
        private shaders: { [s: string]: WGL.Shader } = {};
        public Shaders = {
            Basic2D: 'basic_2d.',
            TitleEffect2D: 'title_2d.',
            Color3D: 'color_3d.',
            TexturedPerspective: 'texture_p3d.',
            Sprite3D: 'sprite_3d.'
        };

        private streamManager: StreamManager;
        constructor(streamManager: StreamManager) {
            this.streamManager = streamManager;
        }

        public getShader(gl: WebGLRenderingContext, shaderName: string) {
            if (!(shaderName in this.shaders)) {
                this.shaders[shaderName] = new WGL.Shader(gl, this.streamManager.getText(shaderName + 'vs'), this.streamManager.getText(shaderName + 'fs'));
            }
            return this.shaders[shaderName];
        }
    }
} 