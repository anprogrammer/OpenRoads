module Game {
    export class ControllerState {
        constructor(turn: number, accel: number, jump: boolean) {
            if (turn >= -1 && turn <= 1) {
                this.TurnInput = turn;
            } else {
                throw "Invalid TurnInput";
            }

            if (accel >= -1 && accel <= 1) {
                this.AccelInput = accel;
            } else {
                throw "Invalid accel";
            }

            this.JumpInput = jump;
        }

        public TurnInput: number;
        public AccelInput: number;
        public JumpInput: boolean;
    }

    export interface Controller {
        update(ship: Position): ControllerState;
    }
} 