module Engine {
    export interface DocumentProvider {
        getSize(): TSM.vec2;
        setResizeCb(cb: (size: TSM.vec2) => void): void;
        requestAnimationFrame(cb: () => void): void;
    }
} 