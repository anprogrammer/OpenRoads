module Controls {
    export interface ControlSource {
        update(): void;

        getTurnAmount(): number;
        getAccelAmount(): number;
        getJump(): boolean;

        getLeft(): boolean;
        getRight(): boolean;
        getUp(): boolean;
        getDown(): boolean;

        getEnter(): boolean;
        getExit(): boolean;
    }
}