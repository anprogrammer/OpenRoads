module Game {
    export class DemoController implements Controller {
        private static TilePositionToDemoPosition: number = 0x10000 / 0x666;

        private demo: Uint8Array;
        constructor(demo: Uint8Array) {
            this.demo = demo;
        }

        public update(ship: Position): ControllerState {
            var idx = Math.floor(ship.getZPosition() * DemoController.TilePositionToDemoPosition);
            if (idx >= this.demo.length)
                return new ControllerState(0, 0, false);
            var val = this.demo[idx];

            return new ControllerState(((val >> 2) & 3) - 1, (val & 3) - 1, ((val >> 4) & 1) > 0);
        }
    }
} 