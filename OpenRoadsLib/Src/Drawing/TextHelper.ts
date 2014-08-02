module Drawing {
    export class TextHelper {
        private managers: Managers.ManagerSet;
        constructor(managers: Managers.ManagerSet) {
            this.managers = managers;
        }

        getSpriteFromText(gl: WebGLRenderingContext, managers: Managers.ManagerSet, text: string, font: string, height: number, force2D: boolean = false): Drawing.Sprite {
            var cvs = managers.Canvas.getCanvas();
            var ctx = cvs.getContext('2d');
            cvs.width = 600;
            cvs.height = 600;
            ctx.font = font;
            var size = ctx.measureText(text);
            cvs.width = size.width + 1;
            cvs.height = height;
            ctx.fillStyle = '#FFFFFF';
            ctx.textBaseline = 'middle';
            ctx.font = font;
            ctx.fillText(text, 0.5, cvs.height / 2 + 0.5);

            var tex = new WGL.Texture(gl);
            tex.setFilters(gl.NEAREST, gl.NEAREST);
            tex.loadData(cvs);

            var tf = new TextureFragment(tex, 0, 0, cvs.width, cvs.height);

            return force2D ? managers.Graphics.get2DSprite(gl, managers, tf) : managers.Graphics.get3DSprite(gl, managers, tf);
        }
    }
} 