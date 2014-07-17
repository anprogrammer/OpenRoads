module Shaders {
    export class VRShaderProvider implements ShaderProvider {
        get2DSprite(gl: WebGLRenderingContext, managers: Managers.ManagerSet, texture: Drawing.TextureFragment): Drawing.Sprite {
            return new Drawing.Sprite(gl, managers, texture);
        }

        get3DSprite(gl: WebGLRenderingContext, managers: Managers.ManagerSet, texture: Drawing.TextureFragment): Drawing.Sprite {
            return new Drawing.Sprite(gl, managers, texture, managers.Shaders.getShader(gl, managers.Shaders.Shaders.Sprite3D));
        }

        getMesh(gl: WebGLRenderingContext, managers: Managers.ManagerSet, vertices: Vertices.Vertex3DC[]): Drawing.Mesh {
            return new Drawing.Mesh(gl, managers, vertices, managers.Shaders.getShader(gl, managers.Shaders.Shaders.TexturedPerspective));
        }

        getState2DDrawer(gl: WebGLRenderingContext, managers: Managers.ManagerSet): Engine.ClassicState2DDrawer {
            return new Engine.VRState2DDrawer(managers);
        }

        getState3DDrawer(gl: WebGLRenderingContext, managers: Managers.ManagerSet): Engine.ClassicState3DDrawer {
            return new Engine.VRState3DDrawer(managers);
        }
    }
}  