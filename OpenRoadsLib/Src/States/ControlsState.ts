module States {
    export class ControlsMenu extends Engine.State2D implements Engine.GameState {
        private myManagers: Managers.ManagerSet;
        private menu: Drawing.Sprite[];
        private watchers: Controls.ConditionWatcher[] = [];
        private settings: UI.SettingUI[] = [];
        private settingsCanvas: HTMLCanvasElement;
        private settingsContext: CanvasRenderingContext2D;
        private settingsTexture: WGL.Texture;
        private settingsSprite: Drawing.Sprite;
        private selectedIdx: number = 0;

        constructor(managers: Managers.ManagerSet) {
            super(managers);
            this.myManagers = managers;
        }

        load(gl: WebGLRenderingContext): void {
            super.load(gl);
            var managers = this.myManagers;          
            var vr = this.myManagers.VR !== null;
              
            this.menu = managers.Textures.getTextures(gl, "SETMENU.LZS").map((tf) => new Drawing.Sprite(gl, managers, tf));

            var settings = managers.Settings;
            this.settings.push(new UI.NumberSetting('Music Volume', 0.0, 2.0, settings.MusicVolume));
            this.settings.push(new UI.NumberSetting('Effects Volume', 0.0, 2.0, settings.EffectVolume));

            this.settings.push(new UI.BooleanSetting(vr ? 'Smooth Mode (Requires Restart)' : 'Smooth Mode(Requires Refresh)', settings.UseInterpolation));

            if (vr) {
                this.settings.push(new UI.BooleanSetting('VSync (Requires Restart)', settings.EnableVSync));

                this.settings.push(new UI.NumberSetting('Menu Size', 0.25, 2.0, settings.MenuSize));
                this.settings.push(new UI.NumberSetting('Menu Distance', 0.25, 4.0, settings.MenuDistance));

                this.settings.push(new UI.NumberSetting('World Size', 0.1, 100.0, settings.WorldScale));
                this.settings.push(new UI.BooleanSetting('Show HUD', settings.ShowHud));
                this.settings.push(new UI.NumberSetting('Hud Size', 0.125, 0.5, settings.HudScale));
                this.settings.push(new UI.NumberSetting('Hud Height', 40.0, 60.0, settings.HudHeight));
                this.settings.push(new UI.NumberSetting('Hud Distance', 20.0, 40.0, settings.HudDist));
                this.settings.push(new UI.NumberSetting('View Height', 0.0, 250.0, settings.EyeHeight));
                this.settings.push(new UI.NumberSetting('View Distance', 0.5, 10.0, settings.VRDistanceFromShip));
                this.settings.push(new UI.NumberSetting('Background Size', 640.0, 7680.0, settings.BackgroundScale));
            }

            this.settingsCanvas = managers.Canvas.getCanvas();
            this.settingsCanvas.width = 640;
            this.settingsCanvas.height = 400;
            this.settingsContext = this.settingsCanvas.getContext('2d');
            this.settingsTexture = new WGL.Texture(gl);
            this.settingsTexture.loadData(this.settingsCanvas);
            this.settingsSprite = this.myManagers.Graphics.get2DSprite(gl, managers, new Drawing.TextureFragment(this.settingsTexture, 0, 0, 320, 200));

            var controls = managers.Controls;
            this.watchers.push(new Controls.ConditionWatcher(() => controls.getUp(), () => this.updateMenu(-1)));
            this.watchers.push(new Controls.ConditionWatcher(() => controls.getDown(), () => this.updateMenu(1)));
            this.watchers.push(new Controls.ConditionWatcher(() => controls.getExit(), () => this.exitMenu()));
            this.myManagers.Audio.playSong(1);
        }

        unload(): void {
        }

        private updateMenu(dir: number) {
            this.selectedIdx = this.selectedIdx + dir;
            this.selectedIdx = Math.min(this.settings.length - 1, Math.max(0, this.selectedIdx));
        }

        private exitMenu(): void {
            this.myManagers.Frames.popState();
        }

        updatePhysics(frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void {
            for (var i = 0; i < this.watchers.length; i++) {
                this.watchers[i].update(frameTimeInfo);
            }

            var cvs = this.settingsCanvas;
            var ctx = this.settingsContext;
            ctx.fillStyle = '#000000';
            ctx.globalAlpha = 0.5;
            ctx.clearRect(0, 0, cvs.width, cvs.height);
            ctx.fillRect(0, 0, cvs.width, cvs.height);

            ctx.globalAlpha = 1.0;

            var P = 4;

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '16pt Arial bold';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('Settings', cvs.width / 2, P);

            var yPos = 50;
            for (var i = 0; i < this.settings.length; i++) {
                var setting = UI.SettingAction.None;
                var selected = this.selectedIdx === i;
                if (selected) {
                    if (this.myManagers.Controls.getLeft()) {
                        setting = UI.SettingAction.Decrease;
                    } else if (this.myManagers.Controls.getRight()) {
                        setting = UI.SettingAction.Increase;
                    }
                }
                this.settings[i].drawAndUpdate(cvs, ctx, frameTimeInfo, yPos, selected, setting);
                yPos += 15;
            }

            this.settingsTexture.loadData(this.settingsCanvas);
        }

        drawFrame2D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void {
            this.menu[0].draw();
            this.settingsSprite.draw();
        }
    }
}  