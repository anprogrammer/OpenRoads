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
        private resourcesLoaded: boolean = false;
        private gl: WebGLRenderingContext;
        private eventBus: Events.EventBus;


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
            this.gl = gl; //TODO: Nasty hack to hold onto this just to load resources from physics step
        }

        loadResources(gl: WebGLRenderingContext): void {
            var managers = this.myManagers;
            var backgroundName = "WORLD" + Math.floor(Math.max(0, (this.levelNum - 1)) / 3) + ".LZS";
            this.background = managers.Graphics.get3DSprite(gl, managers, managers.Textures.getTexture(gl, backgroundName));
            this.dash = new Game.Dashboard(gl, managers);
            var ll = new Levels.MultiLevelLoader(managers.Streams.getStream("ROADS.LZS"));
            var level = ll.Levels[this.levelNum];

            var sounds = managers.Sounds.getMultiEffect('SFX.SND');
            this.eventBus = new Events.EventBus();
            this.eventBus.register(new Game.ShipEvents.ShipBumpedWallEvent(), (evt) => sounds[2].play());
            this.eventBus.register(new Game.ShipEvents.ShipExplodedEvent(), (evt) => sounds[0].play());
            this.eventBus.register(new Game.ShipEvents.ShipBouncedEvent(), (evt) => sounds[1].play());
            this.eventBus.register(new Game.ShipEvents.ShipRefilledEvent(), (evt) => sounds[4].play());

            this.game = new Game.StateManager(managers, level, this.controller);
            managers.SnapshotProvider.reset();
            managers.SnapshotProvider.pushSnapshot(this.game.runFrame(this.eventBus));

            var meshBuilder = new Levels.MeshBuilder();
            var meshVerts = meshBuilder.buildMesh(level, managers.VR !== null, managers.Textures.getImage(backgroundName));
            this.mesh = managers.Graphics.getMesh(gl, managers, meshVerts);

            this.carSprite = new Game.CarSprite(gl, managers);

            this.roadCompleted = new Drawing.TextHelper(managers).getSpriteFromText(gl, managers, "Road Completed", "16pt Arial", 24);
            this.roadCompleted.Position.x = 320 / 2 - this.roadCompleted.Size.x / 2;
            this.roadCompleted.Position.y = 200 / 2 - this.roadCompleted.Size.y / 2;
        }

        unload(): void {
        }

        updatePhysics(frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void {
            if (!this.resourcesLoaded) {
                this.loadResources(this.gl);
                this.resourcesLoaded = true;
            }
            var fps = frameTimeInfo.getFPS();
            this.frame++;
            var level = this.game.getLevel();
            var snap = this.game.runFrame(this.eventBus);
            this.myManagers.SnapshotProvider.pushSnapshot(snap);
            if ((snap.Position.z >= level.length() && this.game.didWin) || this.myManagers.Controls.getExit()) {
                this.myManagers.Frames.popState();
                this.myManagers.Frames.addState(new Fade3D(this.myManagers, 1.0, this, false));

                if (this.game.didWin) {
                    this.myManagers.Settings.incrementWonLevelCount(this.levelNum);
                }
            }

            this.carSprite.updateAnimation(snap, level);
            this.dash.update(snap, level);

            if (this.carSprite.hasAnimationFinished() || snap.Position.y < -10 || (snap.Position.z >= level.length() && !this.game.didWin)) {
                this.timeBeforeFade = 0;
            } else if (snap.CraftState === Game.ShipState.OutOfFuel || snap.CraftState === Game.ShipState.OutOfOxygen) {
                this.timeBeforeFade -= frameTimeInfo.getPhysicsStep();
            }

            if (this.timeBeforeFade <= 0) {
                var gameState = new GameState(this.myManagers, this.levelNum, this.controller);
                frameManager.popState();
                this.myManagers.Frames.addState(gameState);
                this.myManagers.Frames.addState(new Fade3D(this.myManagers, 0.0, gameState, true));
                this.myManagers.Frames.addState(new Fade3D(this.myManagers, 1.0, this, false));
            }
        }

        drawFrame3D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo, cam: Engine.CameraState): void {
            if (!this.resourcesLoaded) {
                this.loadResources(gl);
                this.resourcesLoaded = true;
            }

            var settings = this.myManagers.Settings;
            var snap = this.myManagers.SnapshotProvider.getSnapshot();
            var level = this.game.getLevel();
            this.carSprite.updatePosition(snap, level);

            var isVR = this.myManagers.VR !== null;
            var scaleXY = 6.5 / 46.0; //Assume each tile is about as wide as an a-wing.  Don't judge me.
            var scaleZ = 26.0 / 46.0;
            if (this.myManagers.VR === null) {
                scaleZ = scaleXY = 1.0;
            }

            var scaleVec = new TSM.vec3([scaleXY, scaleXY, scaleZ]);
            this.background.ModelMatrix.setIdentity();
            if (this.myManagers.VR !== null) {
                this.background.Size.x = settings.BackgroundScale.getValue();
                this.background.Size.y = this.background.Size.x * 1200.0 / 1920.0;
                this.background.ModelMatrix.translate(new TSM.vec3([-this.background.Size.x / 2.0 + 160.0, this.background.Size.y * 2.0 / 3.0 - 182, -1200.0]));
            }

            cam.HeadOrientation.inverse();

            this.background.ViewMatrix.setIdentity();
            this.background.ViewMatrix.multiply(cam.HeadOrientation.toMat4());

            this.background.ProjectionMatrix = cam.ProjectionMatrix;
            this.background.draw();
            gl.clear(gl.DEPTH_BUFFER_BIT);

            var headPos = cam.HeadPosition.copy();

            var worldScale = this.myManagers.VR !== null ? settings.WorldScale.getValue() : 1.0;

            headPos.add(new TSM.vec3([0.0, settings.EyeHeight.getValue() / worldScale, (-(snap.Position.z - (isVR ? settings.VRDistanceFromShip.getValue() : 3)) * 46.0) / worldScale]).multiply(scaleVec));
            this.mesh.ViewMatrix.setIdentity();
            this.mesh.ViewMatrix.scale(new TSM.vec3([1.0 / worldScale, 1.0 / worldScale, 1.0 / worldScale])); //We pre-shrink everything so regardless oif user scale, it all fits into z-buffer
            this.mesh.ViewMatrix.translate(cam.EyeOffset.copy().scale(worldScale));
            this.mesh.ViewMatrix.multiply(cam.HeadOrientation.toMat4());
            this.mesh.ViewMatrix.translate(headPos.scale(-1.0).scale(worldScale));
            this.mesh.ViewMatrix.scale(scaleVec);

            this.mesh.ProjectionMatrix = cam.ProjectionMatrix;
            this.mesh.draw();
            this.carSprite.draw(this.mesh.ViewMatrix, cam);

            if (settings.ShowHud.getValue()) {
                this.dash.draw(gl, cam, scaleVec);
            }

            if (this.game.didWin) {
                this.roadCompleted.ModelMatrix.setIdentity();
                this.roadCompleted.ModelMatrix.translate(new TSM.vec3([0.0, -100.0, -150.0]));
                this.roadCompleted.ViewMatrix.copy(cam.HeadOrientation.toMat4());
                this.roadCompleted.ProjectionMatrix = cam.ProjectionMatrix;
                this.roadCompleted.draw();
            }
        }
    }
} 