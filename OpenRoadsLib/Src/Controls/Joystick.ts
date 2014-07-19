module Controls {
    export interface Joystick {
        update(): void;
        getButton(n: number): boolean;
        getAxis(n: number): number;

        getTurnChannels(): number[];
        getLeftButtons(): number[];
        getRightButtons(): number[];

        getAccelChannels(): number[];
        getFasterButtons(): number[];
        getSlowerButtons(): number[];

        getJumpButtons(): number[];
        getEnterButtons(): number[];
        getExitButtons(): number[];
    }
} 