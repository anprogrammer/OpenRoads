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

        constructor(document: DocumentProvider, canvas: HTMLCanvasElement, managers: Managers.ManagerSet, gs: GameState, clock: Clock) {
            this.document = document;
            this.canvas = canvas;
            this.ctx = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            this.addState(gs);

            this.clock = clock;
            this.document.setResizeCb((sz) => this.maintainCanvasSize(sz));
            
            this.maintainCanvasSize(this.document.getSize());
            this.managers = managers;
            document.requestAnimationFrame(() => this.onFrame());
        }

        public getCanvas(): HTMLCanvasElement {
            return this.canvas;
        }

        public addState(gs: GameState) {
            this.states.push(gs);
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
            var time = this.clock.nextFrame();
            var physStep = time.getPhysicsStep();
            this.physicsTime += time.getFrameTime();

            this.managers.Audio.setGain(this.managers.Settings.getMuted() ? 0.0 : this.managers.Settings.getVolume());

            while (this.physicsTime >= physStep && this.states[this.states.length - 1] === gs) {
                gs.updatePhysics(this, time);
                this.physicsTime -= physStep;
            }

            if (this.states[this.states.length - 1] === gs) {
                gs.drawFrame(this.ctx, this.canvas, this, time, new CameraState(new TSM.vec3(), new TSM.quat(), new TSM.vec3(), new TSM.mat4()));
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
            this.states[this.states.length - 1].unload();
            this.states.pop();
        }
    }
} 