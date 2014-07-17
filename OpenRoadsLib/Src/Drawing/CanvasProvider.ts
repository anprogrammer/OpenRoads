module Drawing {
    export interface CanvasProvider {
        getCanvas(): HTMLCanvasElement;
    };
}