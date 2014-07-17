module Engine {
    export class KeyWatcher {
        private enabled: boolean = false;
        private repeating: boolean = true;
        private heldTime: number = 0;
        private repeatRate: number;
        private repeatWait: number;
        private keyCode: number;
        private cb: Function;
        private kbd: KeyboardManager;



        constructor(kbd: KeyboardManager, keyCode: number, cb: Function) {
            this.kbd = kbd;
            this.keyCode = keyCode;
            this.repeatWait = 0.5;
            this.repeatRate = 0.1;
            this.cb = cb;
        }

        public update(time: Engine.FrameTimeInfo) {
            if (this.kbd.isDown(this.keyCode)) {
                if (!this.enabled) {
                    this.enabled = true;
                    this.repeating = false;
                    this.heldTime = 0;
                    this.cb();
                } else {
                    this.heldTime += time.getPhysicsStep();
                    var interval = this.repeating ? this.repeatRate : this.repeatWait;

                    if (this.heldTime >= interval) {
                        this.heldTime -= interval;
                        this.cb();
                        this.repeating = true;
                    }
                }
            } else {
                this.enabled = false;
            }
        }
    }

    export class KeyboardManager {
        private keys: boolean[] = [];

        constructor(element: HTMLElement) {
            for (var i = 0; i < 256; i++) {
                this.keys.push(false);
            }

            element.onkeydown = (evt) => this.onDown(evt);
            element.onkeyup = (evt) => this.onUp(evt);
        }

        public isDown(n: number): boolean {
            return this.keys[n];
        }

        private onDown(evt: KeyboardEvent) {
            this.keys[evt.keyCode] = true;
        }

        private onUp(evt: KeyboardEvent) {
            this.keys[evt.keyCode] = false;
        }
    }
} 