module Engine {
    export class NodeDocumentProvider implements DocumentProvider {
        private doc: any;
        private cvs: HTMLCanvasElement;

        constructor(doc: any, cvs: HTMLCanvasElement) {
            this.doc = doc;
            this.cvs = cvs;
        }

        getSize(): TSM.vec2 {
            return new TSM.vec2([this.cvs.width, this.cvs.height]);
        }

        setResizeCb(cb: (size: TSM.vec2) => void): void {
            this.cvs.onresize = function (evt: any) {
                cb(new TSM.vec2([evt.width, evt.height]));
            };
        }

        requestAnimationFrame(cb: () => void): void {
            this.doc.requestAnimationFrame(cb);
        }
    }
} 