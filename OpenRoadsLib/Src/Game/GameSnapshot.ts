module Game {
    export class GameSnapshot {
        public Position: TSM.vec3;
        public Velocity: TSM.vec3;
        public CraftState: ShipState;
        public OxygenPercent: number;
        public FuelPercent: number;
        public JumpOMasterInUse: boolean;
        public JumpOMasterVelocityDelta: number;
    }
} 