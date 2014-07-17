module States {
    export class GameState extends Engine.State3D implements Engine.GameState {
        private myManagers: Managers.ManagerSet;
        private background: Drawing.Sprite;
        private frame: number;
        private levelNum: number;
        private controller: Game.Controller;
        private game: Game.StateManager;
        private mesh: Drawing.Mesh;
        private dash: Game.Dashboard;
        private carSprite: Game.CarSprite;
        private timeBeforeFade: number = 1.0;

        private roadCompleted: Drawing.Sprite;

        constructor(managers: Managers.ManagerSet, levelNum: number, controller: Game.Controller) {
            super(managers);
            this.myManagers = managers;
            this.frame = 0;
            this.levelNum = levelNum;
            this.controller = controller;
        }

        load(gl: WebGLRenderingContext): void {
            super.load(gl);

            var managers = this.myManagers;
            this.background = managers.Graphics.get3DSprite(gl, managers, managers.Textures.getTexture(gl, "WORLD" + Math.floor(Math.max(0, (this.levelNum - 1)) / 3) + ".LZS"));
            this.dash = new Game.Dashboard(gl, managers);
            var ll = new Levels.MultiLevelLoader(managers.Streams.getStream("ROADS.LZS"));
            var level = ll.Levels[this.levelNum];

            this.game = new Game.StateManager(managers, level, this.controller);
            var meshBuilder = new Levels.MeshBuilder();
            this.mesh = managers.Graphics.getMesh(gl, managers, meshBuilder.buildMesh(level));
            this.carSprite = new Game.CarSprite(gl, managers);
            this.roadCompleted = new Drawing.TextHelper(managers).getSpriteFromText(gl, managers, "Road Completed", "16pt Arial", 24);
            this.roadCompleted.Position.x = 320 / 2 - this.roadCompleted.Size.x / 2;
            this.roadCompleted.Position.y = 200 / 2 - this.roadCompleted.Size.y / 2;
        }

        unload(): void {
        }

        updatePhysics(frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void {
            var fps = frameTimeInfo.getFPS();
            this.frame++;
            this.game.runFrame();
            if (this.game.currentZPosition >= this.game.level.length() || this.myManagers.Keyboard.isDown(27)) {
                this.myManagers.Frames.popState();
                this.myManagers.Frames.addState(new Fade(this.myManagers, 1.0, this, false));

                if (this.game.didWin) {
                    this.myManagers.Settings.incrementWonLevelCount(this.levelNum);
                }
            }
            this.dash.update(this.game);
            this.carSprite.update(this.game);

            if (this.carSprite.hasAnimationFinished() || this.game.currentYPosition < -10) {
                this.timeBeforeFade = 0;
            } else if (this.game.craftState === 4 || this.game.craftState === 5) {
                this.timeBeforeFade -= frameTimeInfo.getPhysicsStep();
            }

            if (this.timeBeforeFade <= 0) {
                var gameState = new GameState(this.myManagers, this.levelNum, this.controller);
                frameManager.popState();
                this.myManagers.Frames.addState(gameState);
                this.myManagers.Frames.addState(new Fade(this.myManagers, 0.0, gameState, true));
                this.myManagers.Frames.addState(new Fade(this.myManagers, 1.0, this, false));
            }
        }

        drawFrame3D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo, cam: Engine.CameraState): void {
            var isVR = this.myManagers.VR !== null;
            var scaleXY = 6.5 / 46.0; //Assume each tile is about as wide as an a-wing.  Don't judge me.
            var scaleZ = 26.0 / 46.0;
            if (this.myManagers.VR === null) {
                scaleZ = scaleXY = 1.0;
            }

            var scaleVec = new TSM.vec3([scaleXY, scaleXY, scaleZ]);
            this.background.ModelMatrix.setIdentity();
            if (this.myManagers.VR !== null) {
                this.background.Size.x = 1280.0;
                this.background.Size.y = 800;
                this.background.ModelMatrix.translate(new TSM.vec3([-450, 200.0, -1200.0]));
            }

            cam.HeadOrientation.inverse();

            this.background.ViewMatrix.setIdentity();
            this.background.ViewMatrix.multiply(cam.HeadOrientation.toMat4());

            this.background.ProjectionMatrix = cam.ProjectionMatrix;
            this.background.draw();
            gl.clear(gl.DEPTH_BUFFER_BIT);

            var headPos = cam.HeadPosition.copy();
            headPos.add(new TSM.vec3([0.0, 130.0, -(this.game.currentZPosition - (isVR ? 1 : 3)) * 46.0]).multiply(scaleVec));
            this.mesh.ViewMatrix.setIdentity();
            this.mesh.ViewMatrix.multiply(cam.HeadOrientation.toMat4());
            this.mesh.ViewMatrix.translate(headPos.scale(-1.0));
            this.mesh.ViewMatrix.scale(scaleVec);
            this.mesh.ViewMatrix.translate(cam.EyeOffset.divide(scaleVec));

            this.mesh.ProjectionMatrix = cam.ProjectionMatrix;
            this.mesh.draw();
            this.carSprite.draw(this.mesh.ViewMatrix, cam);

            this.dash.draw(gl, cam, scaleVec);

            if (this.game.didWin) {
                this.roadCompleted.draw();
            }
        }
    }
} 