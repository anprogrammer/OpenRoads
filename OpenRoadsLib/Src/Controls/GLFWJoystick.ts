module Controls {
    export class GLFWJoystick implements Joystick {
        private glfw: GLFW.GLFW;
        private buttons: boolean[];
        private axis: number[];

        constructor(glfw: GLFW.GLFW) {
            this.glfw = glfw;
        }

        update(): void {
            this.buttons = this.glfw.getJoystickButtons().split(',').map(function (b) {
                return b === "1";
            });

            this.axis = this.glfw.getJoystickAxes().split(',').map(function (b) {
                return parseFloat(b);
            });
        }

        getButton(n: number): boolean {
            return n < this.buttons.length ? this.buttons[n] : false;
        }

        getAxis(n: number): number {
            return n < this.axis.length ? this.axis[n] : 0.0;
        }

        getTurnChannels(): number[] {
            return [0, 4];
        }
        getLeftButtons(): number[] {
            return [4, 13];
        }
        getRightButtons(): number[] {
            return [5, 11];
        }

        getAccelChannels(): number[] {
            return [1, 2, 3];
        }
        getFasterButtons(): number[] {
            return [10];
        }
        getSlowerButtons(): number[] {
            return [12];
        }

        getJumpButtons(): number[] {
            return [0];
        }
        getEnterButtons(): number[] {
            return [0, 7];
        }

        getExitButtons(): number[] {
            return [1, 6];
        }

        getResetOrientationButtons(): number[] {
            return [2];
        }
    }
} 