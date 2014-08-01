module Engine {
    export interface GameState {
        load(gl: WebGLRenderingContext): void;
        unload(): void;
        updatePhysics(frameManager: FrameManager, frameTimeInfo: FrameTimeInfo): void;
        drawFrame(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState): void;
    }

    export class FrameManager {
        private clock: Clock;
        private physicsTime: number = 0;
        private canvas: HTMLCanvasElement;
        private ctx: WebGLRenderingContext;
        private states: GameState[] = [];
        private fps: number = 0;
        private timeLast: number = Date.now();
        private lastWidth: number = 0;
        private lastHeight: number = 0;
        private document: DocumentProvider;
        private managers: Managers.ManagerSet;
        private frame: number = 0;
        private hasRunPhysics: boolean = false;
        private lastEffectsVolume: number = -1;
        private lastMusicVolume: number = -1;

        constructor(documentProvider: DocumentProvider, canvas: HTMLCanvasElement, managers: Managers.ManagerSet, gs: GameState, clock: Clock) {
            this.document = documentProvider;
            this.canvas = canvas;
            this.ctx = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            var preloader = new Images.Preloader();
            preloader.preloadData(this.ctx, managers);

            this.addState(gs);

            this.clock = clock;
            this.document.setResizeCb((sz) => this.maintainCanvasSize(sz));
            
            this.maintainCanvasSize(this.document.getSize());
            this.managers = managers;
            documentProvider.requestAnimationFrame(() => this.onFrame());
        }

        public getCanvas(): HTMLCanvasElement {
            return this.canvas;
        }

        public addState(gs: GameState) {
            this.states.push(gs);
            this.hasRunPhysics = false;
            gs.load(this.ctx);
        }

        private maintainCanvasSize(sz: TSM.vec2): void {
            if (sz !== null) {
                this.canvas.width = sz.x;
                this.canvas.height = sz.y;
            }

            var bw = this.canvas.width, bh = this.canvas.height;
            if (bw !== this.lastWidth || bh !== this.lastHeight) {
                this.canvas.width = bw;
                this.canvas.height = bh;
                this.lastWidth = bw;
                this.lastHeight = bh;
            }
        }

        private onFrame(): void {
            var gs = this.states[this.states.length - 1];

            this.managers.Controls.update();
            var time = this.clock.nextFrame();
            var physStep = time.getPhysicsStep();
            this.physicsTime += time.getFrameTime();

            if (this.managers.Controls.getResetOrientation() && this.managers.VR !== null) {
                this.managers.VR.resetOrientation();
            }

            if (this.managers.VR !== null) {
                this.managers.VR.handlePlatformKeys(this.managers.Controls);
            }

            var effectsVol = this.managers.Settings.EffectVolume.getValue();
            var musicVol = this.managers.Settings.MusicVolume.getValue();
            if (this.lastEffectsVolume !== effectsVol || this.lastMusicVolume !== musicVol) {
                this.managers.Audio.setEffectsGain(0.2 * effectsVol);
                this.managers.Audio.setMusicGain(0.2 * musicVol);
                this.lastEffectsVolume = effectsVol;
                this.lastMusicVolume = musicVol;
            }
            this.frame++;

            if (this.physicsTime >= physStep * 3) {
                this.physicsTime = physStep;
            }

            if (this.physicsTime < physStep && !this.hasRunPhysics) {
                this.physicsTime = physStep;
            }
            this.hasRunPhysics = true;

            while (this.physicsTime >= physStep && this.states[this.states.length - 1] === gs) {
                gs.updatePhysics(this, time);
                this.physicsTime -= physStep;
            }

            if (this.states[this.states.length - 1] === gs) {
                gs.drawFrame(this.ctx, this.canvas, this, time, new CameraState(new TSM.vec3(), new TSM.quat(), new TSM.vec3(), new TSM.mat4()));
            }

            this.fps++;
            var n = Date.now();
            if (n - this.timeLast > 1000.0) {
                console.log('FPS: ' + this.fps);
                this.fps = 0;
                this.timeLast = n;
            }
            this.document.requestAnimationFrame(() => this.onFrame());
        }

        public popState(): void {
            this.hasRunPhysics = false;
            this.states[this.states.length - 1].unload();
            this.states.pop();
        }
    }
} 