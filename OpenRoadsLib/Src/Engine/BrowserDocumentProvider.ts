module Engine {
    export class BrowserDocumentProvider implements DocumentProvider {
        getSize(): TSM.vec2 {
            return new TSM.vec2([document.body.clientWidth, document.body.clientHeight])
        }

        setResizeCb(cb: (size: TSM.vec2) => void): void {
            window.onresize = () => {
                cb(this.getSize());
            };
        }

        requestAnimationFrame(cb: () => void): void {
            requestAnimationFrame(cb);
        }
    }
}