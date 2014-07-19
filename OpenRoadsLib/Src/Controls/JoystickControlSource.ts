module Controls {
    export class JoystickControlSource implements ControlSource {
        private deadZone = 0.3;
        private joystick: Joystick;

        constructor(stick: Joystick) {
            this.joystick = stick;
        }

        private channelWithDeadZone(n: number): number {
            var v = this.joystick.getAxis(n);
            if (Math.abs(v) < this.deadZone) {
                return 0.0;
            } else {
                return v;
            }
        }

        private buttonAsChannel(n: number, v: number) {
            return this.joystick.getButton(n) ? v : 0.0;
        }

        private largest(ns: number[]) {
            var v = 0.0;
            for (var i = 0; i < ns.length; i++) {
                if (Math.abs(ns[i]) > Math.abs(v)) {
                    v = ns[i];
                }
            }

            return v;
        }

        private getValuesFromChannelsAndButtons(channels: number[], buttonsNeg: number[], buttonsPos: number[]) {
            var values: number[] = [];
            for (var i = 0; i < channels.length; i++) {
                values.push(this.channelWithDeadZone(channels[i]));
            }
            for (var i = 0; i < buttonsNeg.length; i++) {
                values.push(this.buttonAsChannel(buttonsNeg[i], -1));
            }
            for (var i = 0; i < buttonsPos.length; i++) {
                values.push(this.buttonAsChannel(buttonsPos[i], 1));
            }
            return this.largest(values);
        }

        public update(): void {
            this.joystick.update();
        }

        public getTurnAmount(): number {
            return this.getValuesFromChannelsAndButtons(this.joystick.getTurnChannels(), this.joystick.getLeftButtons(), this.joystick.getRightButtons());
        }

        public getAccelAmount(): number {
            return -this.getValuesFromChannelsAndButtons(this.joystick.getAccelChannels(), this.joystick.getFasterButtons(), this.joystick.getSlowerButtons());
        }

        public getJump(): boolean {
            return this.getValuesFromChannelsAndButtons([], [], this.joystick.getJumpButtons()) > 0.5;
        }

        public getLeft(): boolean {
            return this.getTurnAmount() < -0.5;
        }

        public getRight(): boolean {
            return this.getTurnAmount() > 0.5;
        }

        public getUp(): boolean {
            return this.getAccelAmount() > 0.5;
        }

        public getDown(): boolean {
            return this.getAccelAmount() < -0.5;
        }

        public getEnter(): boolean {
            return this.getValuesFromChannelsAndButtons([], [], this.joystick.getEnterButtons()) > 0.5;
        }

        public getExit(): boolean {
            return this.getValuesFromChannelsAndButtons([], [], this.joystick.getExitButtons()) > 0.5;
        }
    }
}