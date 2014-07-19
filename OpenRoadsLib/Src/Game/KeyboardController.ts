module Game {
    export class ControlSourceController implements Controller {
        private static TilePositionToDemoPosition: number = 0x10000 / 0x666;

        private controlSource: Controls.ControlSource;
        constructor(source: Controls.ControlSource) {
            this.controlSource = source;
        }

        public update(ship: Position): ControllerState {
            return new ControllerState(this.controlSource.getTurnAmount(), this.controlSource.getAccelAmount(), this.controlSource.getJump());
        }
    }
}  