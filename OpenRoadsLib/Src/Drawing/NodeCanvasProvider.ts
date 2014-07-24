module Drawing {
    var canvas: any = null;
    if (typeof document === 'undefined' && typeof require !== 'undefined') {
        canvas = require('./Node/node_modules/node-canvas');
    }

    export class NodeCanvasProvider {
        public getCanvas(): HTMLCanvasElement {
            return new canvas(1, 1);
        }
    }
}