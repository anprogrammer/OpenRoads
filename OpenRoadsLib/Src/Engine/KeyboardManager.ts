module Engine {
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