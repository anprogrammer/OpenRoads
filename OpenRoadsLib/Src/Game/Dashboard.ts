module Game {
    export class Dashboard {
        private dash: Drawing.Sprite;
        private oxyGauge: Drawing.Sprite[];
        private fuelGauge: Drawing.Sprite[];
        private speedGauge: Drawing.Sprite[];
        private progressGauge: Drawing.Sprite[];

        private fuelEmpty: Drawing.Sprite;
        private oxyEmpty: Drawing.Sprite;

        private numberSet: Drawing.Sprite[];
        private jumpMasterOn: Drawing.Sprite;

        private oxyAmt: number = 0.0;
        private fuelAmt: number = 0.0;
        private speedAmt: number = 0.0;

        private gravity: number = 0.0;
        private jumpMasterInUse: boolean = false;
        private craftState: number = 0;
        private frame: number = 0;

        private zPosition: number = 0.0;
        private zLevelLength: number = 0.0;

        private back: Drawing.Sprite;
        constructor(gl: WebGLRenderingContext, managers: Managers.ManagerSet) {
            var loadGauge = (filename: string) => {
                return managers.Textures.getTextures(gl, filename).map(t => managers.Graphics.get3DSprite(gl, managers, t));
            };
            this.dash = managers.Graphics.get3DSprite(gl, managers, managers.Textures.getTexture(gl, "DASHBRD.LZS"));
            this.oxyGauge = loadGauge("OXY_DISP.DAT");
            this.fuelGauge = loadGauge("FUL_DISP.DAT");
            this.speedGauge = loadGauge("SPEED.DAT");
            this.progressGauge = loadGauge("PROGRESS_INDICATOR");
            this.oxyEmpty = loadGauge("O2_RED")[0];
            this.fuelEmpty = loadGauge("FUEL_RED")[0];

            this.numberSet = loadGauge("NUMBERS");
            this.jumpMasterOn = loadGauge("JUMPMASTER")[1];

            var blackTex = new WGL.Texture(gl);
            var cvs = managers.Canvas.getCanvas();
            cvs.width = 32;
            cvs.height = 32;


            var ctx = cvs.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, cvs.width, cvs.height);
            
            blackTex.loadData(cvs);
            blackTex.setFilters(gl.NEAREST, gl.NEAREST);

            var blackFrag = new Drawing.TextureFragment(blackTex, 0, 138, 320, 200 - 138);
            this.back = managers.Graphics.get3DSprite(gl, managers, blackFrag);
        }

        update(state: StateManager) {
            this.oxyAmt = state.oxygenRemaining / 0x7530;
            this.fuelAmt = state.fuelRemaining / 0x7530;
            this.speedAmt = (state.zVelocity + state.jumpOMasterVelocityDelta) / (0x2AAA / 0x10000);
            this.gravity = state.level.Gravity;
            this.jumpMasterInUse = state.jumpOMasterInUse;
            this.zPosition = state.currentZPosition;
            this.zLevelLength = state.level.getLength();
            this.craftState = state.craftState;

            this.frame++;
        }

        draw(gl: WebGLRenderingContext, cam: Engine.CameraState, scaleVec: TSM.vec3): void {
            var view = new TSM.mat4().setIdentity();
            view.multiply(cam.HeadOrientation.toMat4());
            view.translate(cam.HeadPosition.copy().scale(-1.0));
            view.scale(scaleVec);
            view.translate(cam.EyeOffset.copy().divide(scaleVec));

            var model = new TSM.mat4().setIdentity();
            model.setIdentity().translate(new TSM.vec3([0.0, -50.0, -25.0]));
            model.rotate(-Math.PI / 9.0, new TSM.vec3([1.0, 0.0, 0.0]));
            model.scale(new TSM.vec3([0.25, 0.25, 0.25]));

            var configAndDrawSprite = (s: Drawing.Sprite) => {

                s.ViewMatrix = view;
                s.ModelMatrix = model;
                s.ProjectionMatrix = cam.ProjectionMatrix;
                s.draw();
            };

            configAndDrawSprite(this.back);
            configAndDrawSprite(this.dash);
            var drawGauge = (gs: Drawing.Sprite[], amt: number) => {
                configAndDrawSprite(gs[Math.floor(Math.min(1.0, amt) * (gs.length - 1))]);
            };

            drawGauge(this.oxyGauge, this.oxyAmt);
            drawGauge(this.fuelGauge, this.fuelAmt);
            drawGauge(this.speedGauge, this.speedAmt);
            if (this.zLevelLength > 0) {
                drawGauge(this.progressGauge, this.zPosition / this.zLevelLength);
            }

            if (this.jumpMasterInUse) {
                configAndDrawSprite(this.jumpMasterOn);
            }

            if (this.craftState === 5 && this.frame%4 < 2) {
                configAndDrawSprite(this.oxyEmpty);
            }

            if (this.craftState === 4 && this.frame % 4 < 2) {
                configAndDrawSprite(this.fuelEmpty);
            }

            var grav = this.gravity - 3, gravHigh = Math.floor(grav / 10), gravLow = grav%10;
            if (gravHigh > 0) {
                this.numberSet[gravHigh].Position.x = 96.0;
                this.numberSet[gravHigh].Position.y = 156.0;
                configAndDrawSprite(this.numberSet[gravHigh]);
            }
            if (gravLow > 0) {
                this.numberSet[gravLow].Position.x = 101.0;
                this.numberSet[gravLow].Position.y = 156.0;
                configAndDrawSprite(this.numberSet[gravLow]);
            }
        }
    }
}