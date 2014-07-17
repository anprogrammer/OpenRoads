module Drawing {
    export class TextureFragment {
        public Texture: WGL.Texture;
        public XOffset: number;
        public YOffset: number;
        public Width: number;
        public Height: number;

        constructor(tex: WGL.Texture, x: number, y: number, w: number, h: number) {
            this.Texture = tex;
            this.XOffset = x;
            this.YOffset = y;
            this.Width = w;
            this.Height = h;
        }
    }
} 