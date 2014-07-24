module States {
    export class MainMenu extends Engine.State2D implements Engine.GameState {
        private myManagers: Managers.ManagerSet;
        private background: Drawing.Sprite;
        private title: Drawing.Sprite;
        private titleRight: Drawing.Sprite;
        private menu: Drawing.Sprite[];
        private menuPos: number = 0;
        private menuAlpha: number = 0;

        private watchers: Controls.ConditionWatcher[] = [];

        constructor(managers: Managers.ManagerSet) {
            super(managers);
            this.myManagers = managers;
        }

        load(gl: WebGLRenderingContext): void {
            super.load(gl);

            var managers = this.myManagers;
            var introParts = managers.Textures.getTextures(gl, "INTRO.LZS");
            var intro = introParts.map((tf) => new Drawing.Sprite(gl, managers, tf));
            this.background = intro[0];
            this.title = new Drawing.Sprite(gl, managers, introParts[1]);
            this.menu = managers.Textures.getTextures(gl, "MAINMENU.LZS").map((tf) => new Drawing.Sprite(gl, managers, tf));

            var controls = managers.Controls;
            this.watchers.push(new Controls.ConditionWatcher(() => controls.getUp(), () => this.updateMenu(-1)));
            this.watchers.push(new Controls.ConditionWatcher(() => controls.getDown(), () => this.updateMenu(1)));
            this.watchers.push(new Controls.ConditionWatcher(() => controls.getEnter(), () => this.enterMenu()));
            //TODO: Way to exit NodeJS app

            this.myManagers.Audio.playSong(1);
        }

        unload(): void {
        }

        private updateMenu(dir: number) {
            this.menuPos = Math.max(0, Math.min(2, this.menuPos + dir));
        }

        private enterMenu() {
            if (this.menuAlpha < 1.0) {
                return;
            }
            switch (this.menuPos) {
                case 0: //Start
                    var goState = new GoMenu(this.myManagers);
                    this.myManagers.Frames.addState(new Fade2D(this.myManagers, 0.0, this, false));
                    this.myManagers.Frames.addState(new Fade2D(this.myManagers, 1.0, goState, false));
                    this.myManagers.Frames.addState(goState);
                    this.myManagers.Frames.addState(new Fade2D(this.myManagers, 0.0, goState, true));
                    this.myManagers.Frames.addState(new Fade2D(this.myManagers, 1.0, this, false));
                    break;
                case 1: //Config
                    var configState = new ControlsMenu(this.myManagers);
                    this.myManagers.Frames.addState(new Fade2D(this.myManagers, 0.0, this, false));
                    this.myManagers.Frames.addState(new Fade2D(this.myManagers, 1.0, configState, false));
                    this.myManagers.Frames.addState(configState);
                    this.myManagers.Frames.addState(new Fade2D(this.myManagers, 0.0, configState, true));
                    this.myManagers.Frames.addState(new Fade2D(this.myManagers, 1.0, this, false));
                    break; //TODO
                case 2: //Help
                    var helpState = new Help(this.myManagers);
                    this.myManagers.Frames.addState(new Fade2D(this.myManagers, 0.0, this, false));
                    this.myManagers.Frames.addState(new Fade2D(this.myManagers, 1.0, helpState, false));
                    this.myManagers.Frames.addState(helpState);
                    this.myManagers.Frames.addState(new Fade2D(this.myManagers, 0.0, helpState, true));
                    this.myManagers.Frames.addState(new Fade2D(this.myManagers, 1.0, this, false));
                    break; //TODO
            }
        }

        updatePhysics(frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void {
            for (var i = 0; i < this.watchers.length; i++) {
                this.watchers[i].update(frameTimeInfo);
            }
            this.menuAlpha += frameTimeInfo.getPhysicsStep();
        }

        drawFrame2D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void {
            this.background.draw();
            this.title.draw();

            this.menu[this.menuPos].Alpha = Math.min(1.0, this.menuAlpha);
            this.menu[this.menuPos].draw();
        }
    }
}  