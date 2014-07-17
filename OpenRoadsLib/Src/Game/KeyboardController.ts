module Game {
    export class KeyboardController implements Controller {
        private static TilePositionToDemoPosition: number = 0x10000 / 0x666;

        private kbd: Engine.KeyboardManager;
        constructor(kbd: Engine.KeyboardManager) {
            this.kbd = kbd;
        }

        public update(ship: Position): ControllerState {
            var turn: number = 0, accel: number = 0, jump: boolean = false;
            if (this.kbd.isDown(37)) {
                turn = -1;
            } else if (this.kbd.isDown(39)) {
                turn = 1;
            }

            if (this.kbd.isDown(38)) {
                accel = 1.0;
            } else if (this.kbd.isDown(40)) {
                accel = -1.0;
            }

            if (this.kbd.isDown(32)) {
                jump = true;
            }
            return new ControllerState(turn, accel, jump);
        }
    }
}  