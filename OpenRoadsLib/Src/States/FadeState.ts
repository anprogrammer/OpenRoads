/* INTRO TODO:
* Music
* Demo level sequence
*/
module States {
    export class Fade extends Engine.State2D implements Engine.GameState {
        private myManagers: Managers.ManagerSet;
        private position: number;
        private direction: number;
        private drawState: Engine.State2D;
        private back: Drawing.Sprite;
        private firstFrame: boolean;

        //TODO:  We need to make this accept a State2D only, create a new fade for 3D stuff.
        constructor(managers: Managers.ManagerSet, start: number, drawState: any, runPhysicsFirst: boolean) {
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

        drawFrame2D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo, cam: Engine.CameraState): void {
            if (this.drawState.drawFrame2D) {
                this.drawState.drawFrame2D(gl, canvas, frameManager, frameTimeInfo, cam);
            }
            this.back.draw();
        }
    }
} 