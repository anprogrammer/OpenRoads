module Engine {
    export class VRState2DDrawer implements State2DDrawer {
        private managers: Managers.ManagerSet;

        constructor(managers: Managers.ManagerSet) {
            this.managers = managers;
        }

        private static initialized: boolean = false;
        private static target: WGL.RenderableTexture = null;
        private static screenMesh: Drawing.Mesh = null;
        private ensureObjects(gl: WebGLRenderingContext): void {
            if (VRState2DDrawer.initialized) {
                return;
            }
            VRState2DDrawer.target = WGL.RenderableTexture.Create(gl, 1024, 1024);
            VRState2DDrawer.initialized = true;

            var color = new TSM.vec3([1.0, 1.0, 1.0]);
            var w = 5.0;
            var h = w * 200.0 / 320.0;
            var z = 0.0;

            var verts = [
                new Vertices.Vertex3DC(new TSM.vec3([-w, -h, z]), color, new TSM.vec2([0.0, 0.0])),
                new Vertices.Vertex3DC(new TSM.vec3([w, -h, z]), color, new TSM.vec2([1.0, 0.0])),
                new Vertices.Vertex3DC(new TSM.vec3([w, h, z]), color, new TSM.vec2([1.0, 1.0])),

                new Vertices.Vertex3DC(new TSM.vec3([w, h, z]), color, new TSM.vec2([1.0, 1.0])),
                new Vertices.Vertex3DC(new TSM.vec3([-w, h, z]), color, new TSM.vec2([0.0, 1.0])),
                new Vertices.Vertex3DC(new TSM.vec3([-w, -h, z]), color, new TSM.vec2([0.0, 0.0]))
            ];

            VRState2DDrawer.screenMesh = this.managers.Graphics.getMesh(gl, this.managers, verts);
            VRState2DDrawer.screenMesh.Texture = VRState2DDrawer.target.Texture;


            VRState2DDrawer.screenMesh.ModelMatrix.translate(new TSM.vec3([0.0, 0.0, -12.0]));
        }

        draw(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState, state: State2D): void {
            this.ensureObjects(gl);

            var helper = new States.VRGLStateHelper(this.managers.VR);
            VRState2DDrawer.target.bindForDrawing();
            gl.viewport(0, 0, 1024, 1024);
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            state.drawFrame2D(gl, canvas, frameManager, frameTimeInfo, cam);

            helper.startFrame(gl);
            VRState2DDrawer.target.Texture.generateMipmap();

            var me = this;
            function runPass(eyeNum: number) {
                var base = me.managers.VR.getHeadCameraState(eyeNum);
                VRState2DDrawer.screenMesh.ViewMatrix.setIdentity();
                VRState2DDrawer.screenMesh.ViewMatrix.multiply(base.HeadOrientation.inverse().toMat4());
                VRState2DDrawer.screenMesh.ViewMatrix.translate(base.HeadPosition.scale(-1));
                VRState2DDrawer.screenMesh.ViewMatrix.translate(base.EyeOffset);
               
                VRState2DDrawer.screenMesh.ProjectionMatrix = base.ProjectionMatrix;
                VRState2DDrawer.screenMesh.draw();
            }

            helper.startEye(gl, 0);
            runPass(0);
            helper.endEye(gl, 0);

            helper.startEye(gl, 1);
            runPass(1);
            helper.endEye(gl, 1);
        }
    }
}