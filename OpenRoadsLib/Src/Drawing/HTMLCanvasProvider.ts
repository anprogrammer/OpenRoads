module Drawing {
    export class HTMLCanvasProvider implements CanvasProvider {
        public getCanvas(): HTMLCanvasElement {
            return document.createElement('canvas');
        }
    }
} 