module Shaders {
    export class ClassicShaderProvider implements ShaderProvider {
        get2DSprite(gl: WebGLRenderingContext, managers: Managers.ManagerSet, texture: Drawing.TextureFragment): Drawing.Sprite {
            return new Drawing.Sprite(gl, managers, texture);
        }

        get3DSprite(gl: WebGLRenderingContext, managers: Managers.ManagerSet, texture: Drawing.TextureFragment): Drawing.Sprite {
            return new Drawing.Sprite(gl, managers, texture);
        }

        getMesh(gl: WebGLRenderingContext, managers: Managers.ManagerSet, vertices: Vertices.Vertex3DC[]): Drawing.Mesh {
            return new Drawing.Mesh(gl, managers, vertices);
        }

        getState2DDrawer(gl: WebGLRenderingContext): Engine.ClassicState2DDrawer {
            return new Engine.ClassicState2DDrawer();
        }

        getState3DDrawer(gl: WebGLRenderingContext): Engine.ClassicState3DDrawer {
            return new Engine.ClassicState3DDrawer();
        }
    }
} 