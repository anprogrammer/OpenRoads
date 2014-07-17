module Shaders {
    export interface ShaderProvider {
        get2DSprite(gl: WebGLRenderingContext, managers: Managers.ManagerSet, texture: Drawing.TextureFragment): Drawing.Sprite;
        get3DSprite(gl: WebGLRenderingContext, managers: Managers.ManagerSet, texture: Drawing.TextureFragment): Drawing.Sprite;
        getMesh(gl: WebGLRenderingContext, managers: Managers.ManagerSet, vertices: Vertices.Vertex3DC[]): Drawing.Mesh;
        getState2DDrawer(gl: WebGLRenderingContext, managers: Managers.ManagerSet): Engine.State2DDrawer;
        getState3DDrawer(gl: WebGLRenderingContext, managers: Managers.ManagerSet): Engine.State3DDrawer;
    }
}