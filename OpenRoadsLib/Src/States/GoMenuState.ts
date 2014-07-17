module States {
    export class GoMenu extends Engine.State2D implements Engine.GameState {
        private myManagers: Managers.ManagerSet;
        private background: Drawing.Sprite;
        private dot: Drawing.Sprite;
        private selRect: Drawing.Sprite;
        private selLevel: number;

        private watchers: Engine.KeyWatcher[] = [];

        constructor(managers: Managers.ManagerSet) {
            super(managers);
            this.myManagers = managers;
            this.selLevel = 1;
        }

        load(gl: WebGLRenderingContext): void {
            super.load(gl);
            var managers = this.myManagers;
            var menuParts = managers.Textures.getTextures(gl, "GOMENU.LZS");
            var menu = menuParts.map((tf) => new Drawing.Sprite(gl, managers, tf));
            this.background = menu[0];
            this.dot = menu[1];

            var selCvs = this.myManagers.Canvas.getCanvas();
            selCvs.width = 48;
            selCvs.height = 9;
            
            var ctx = selCvs.getContext('2d');
            ctx.translate(0.5, 0.5);
            ctx.lineWidth = 1.0;
            ctx.strokeStyle = '#B6B6B6';
            ctx.strokeRect(0, 0, selCvs.width - 1, selCvs.height - 1);

            var selTex = new WGL.Texture(gl);
            selTex.loadData(selCvs);
            selTex.setFilters(gl.NEAREST, gl.NEAREST);
            var selFrag = new Drawing.TextureFragment(selTex, 0, 0, selCvs.width, selCvs.height);
            this.selRect = new Drawing.Sprite(gl, managers, selFrag);

            this.watchers.push(new Engine.KeyWatcher(managers.Keyboard, 37, () => this.updateLevel(-15)));
            this.watchers.push(new Engine.KeyWatcher(managers.Keyboard, 38, () => this.updateLevel(-1)));
            this.watchers.push(new Engine.KeyWatcher(managers.Keyboard, 40, () => this.updateLevel(1)));
            this.watchers.push(new Engine.KeyWatcher(managers.Keyboard, 39, () => this.updateLevel(15)));

            this.watchers.push(new Engine.KeyWatcher(managers.Keyboard, 13, () => this.enterLevel()));
            this.watchers.push(new Engine.KeyWatcher(managers.Keyboard, 32, () => this.enterLevel()));
            this.watchers.push(new Engine.KeyWatcher(managers.Keyboard, 27, () => managers.Frames.popState()));

            this.myManagers.Player.loadSong(1);
        }

        unload(): void {
        }

        private updateLevel(dir: number) {
            this.selLevel = Math.max(1.0, Math.min(30.0, this.selLevel + dir));
        }

        private enterLevel() {
            var gameState = new GameState(this.myManagers, this.selLevel, new Game.KeyboardController(this.myManagers.Keyboard));
            this.myManagers.Frames.addState(new Fade2D(this.myManagers, 0.0, this, false));
            this.myManagers.Frames.addState(gameState);
            this.myManagers.Frames.addState(new Fade3D(this.myManagers, 0.0, gameState, true));
            this.myManagers.Frames.addState(new Fade2D(this.myManagers, 1.0, this, false));
            this.myManagers.Player.loadSong(Math.floor(Math.random() * 11) + 2);
        }

        updatePhysics(frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void {
            var kbd = this.myManagers.Keyboard;
            for (var i = 0; i < this.watchers.length; i++) {
                this.watchers[i].update(frameTimeInfo);
            }
        }

        drawFrame2D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void {
            var dotCountForLevel = (n: number): number => {
                return Math.min(7, this.myManagers.Settings.wonLevelCount(n));
            };

            var posForLevel = (n: number): TSM.vec2 => {
                var lx = Math.floor((n - 1) / 15);
                var ly = (n - 1) % 15;

                return new TSM.vec2([62 + lx * 160, 12 + Math.floor(ly / 3) * 39 + (ly % 3) * 9]);
            };

            this.background.draw();

            for (var i = 1; i <= 30; i++) {
                for (var j = 0; j < dotCountForLevel(i); j++) {
                    this.dot.Position.xy = (posForLevel(i).add(new TSM.vec2([50 + 7 * j, 2]))).xy;
                    this.dot.draw();
                }
            }


            var selX = Math.floor((this.selLevel - 1) / 15);
            var selY = (this.selLevel - 1) % 15;

            this.selRect.Position.xy = posForLevel(this.selLevel).xy;
            this.selRect.draw();
        }
    }
}   