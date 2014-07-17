module States {
    //TODO: Refactor out the common logic between Fade3D and Fade2D
    export class Fade3D extends Engine.State3D implements Engine.GameState {
        private myManagers: Managers.ManagerSet;
        private position: number;
        private direction: number;
        private drawState: Engine.State3D;
        private back: Drawing.Sprite;
        private firstFrame: boolean;

        constructor(managers: Managers.ManagerSet, start: number, drawState: Engine.State3D, runPhysicsFirst: boolean) {
            super(managers);
            this.myManagers = managers;
            this.position = start;
            this.direction = start > 0.5 ? -1.0 : 1.0;
            this.drawState = drawState;
            this.firstFrame = runPhysicsFirst;
        }

        load(gl: WebGLRenderingContext): void {
            super.load(gl);

            var blackTex = new WGL.Texture(gl);
            var cvs = this.myManagers.Canvas.getCanvas();
            cvs.width = 32;
            cvs.height = 32;


            var ctx = cvs.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, cvs.width, cvs.height);

            blackTex.loadData(cvs);
            blackTex.setFilters(gl.NEAREST, gl.NEAREST);

            var blackFrag = new Drawing.TextureFragment(blackTex, 0, 0, 320, 200);
            this.back = new Drawing.Sprite(gl, this.myManagers, blackFrag);
            this.back.Alpha = 1.0 - this.position;
        }

        unload(): void {

        }

        updatePhysics(frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void {
            this.position += this.direction * frameTimeInfo.getPhysicsStep();
            if (this.position <= 0.0 || this.position >= 1.0) {
                frameManager.popState();
            } else {
                this.back.Alpha = 1.0 - this.position;
            }
            if (this.firstFrame) {
                this.drawState.updatePhysics(frameManager, frameTimeInfo);
                this.firstFrame = false;
            }
        }

        drawFrame3D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo, cam: Engine.CameraState): void {
            this.drawState.drawFrame3D(gl, canvas, frameManager, frameTimeInfo, cam);
            this.back.draw();
        }
    }
}  