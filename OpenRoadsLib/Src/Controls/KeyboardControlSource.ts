module Controls {
    export class KeyboardControlSource implements ControlSource {
        private kbd: Engine.KeyboardManager;
        constructor(kbd: Engine.KeyboardManager) {
            this.kbd = kbd;
        }

        public update(): void { }

        public getTurnAmount(): number {
            if (this.getLeft()) {
                return -1;
            } else if (this.getRight()) {
                return 1;
            } else {
                return 0;
            }
        }

        public getAccelAmount(): number {
            if (this.getUp()) {
                return 1;
            } else if (this.getDown()) {
                return -1;
            } else {
                return 0;
            }
        }

        public getJump(): boolean {
            return this.kbd.isDown(32);
        }

        public getLeft(): boolean {
            return this.kbd.isDown(37) || this.kbd.isDown(65);
        }

        public getRight(): boolean {
            return this.kbd.isDown(39) || this.kbd.isDown(68);
        }
        public getUp(): boolean {
            return this.kbd.isDown(38) || this.kbd.isDown(87);
        }

        public getDown(): boolean {
            return this.kbd.isDown(40) || this.kbd.isDown(83);
        }

        public getEnter(): boolean {
            return this.kbd.isDown(32) || this.kbd.isDown(13);
        }

        public getExit(): boolean {
            return this.kbd.isDown(27);
        }

        public getSwitchMonitor(): boolean {
            return this.kbd.isDown(123);
        }

        public getResetOrientation(): boolean {
            return this.kbd.isDown(82);
        }
    }
} 