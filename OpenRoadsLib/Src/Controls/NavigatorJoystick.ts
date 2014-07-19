module Controls {
    export declare class Gamepad {
        public buttons: { pressed: boolean }[];
        public axes: number[];
    }

    export declare class GamepadProvider {
        public getGamepads(): Gamepad[];
    }

    export class NavigatorJoystick implements Joystick {
        private provider: GamepadProvider;
        private gamepad: Gamepad = null;

        constructor(provider: GamepadProvider) {
            this.provider = provider;
        }

        public update(): void {
            var pads = this.provider.getGamepads ? this.provider.getGamepads() : [];
            if (pads.length > 0 && pads[0]) {
                this.gamepad = pads[0];
            } else {
                this.gamepad = null;
            }
        }

        public getButton(n: number): boolean {
            return this.gamepad !== null && n < this.gamepad.buttons.length ? this.gamepad.buttons[n].pressed : false;
        }

        public getAxis(n: number): number {
            return this.gamepad !== null && n < this.gamepad.axes.length ? this.gamepad.axes[n] : 0;
        }

        getTurnChannels(): number[]{
            return [0, 2];
        }

        getLeftButtons(): number[]{
            return [4, 14];
        }

        getRightButtons(): number[]{
            return [5, 15];
        }

        getAccelChannels(): number[]{
            return [1, 3];
        }

        getFasterButtons(): number[]{
            return [7, 12];
        }

        getSlowerButtons(): number[]{
            return [6, 13];
        }

        getJumpButtons(): number[] {
            return [0];
        }

        getEnterButtons(): number[]{
            return [0, 9];
        }

        getExitButtons(): number[]{
            return [1, 8];
        }
    }
}