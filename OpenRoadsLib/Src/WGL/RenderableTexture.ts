module WGL {
    export class RenderableTexture {
        public Framebuffer: Framebuffer;
        public Texture: Texture;

        constructor(fb: Framebuffer, tex: Texture) {
            this.Framebuffer = fb;
            this.Texture = tex;
        }

        public static Create(gl: WebGLRenderingContext, width: number, height: number): RenderableTexture {
            var fb = new Framebuffer(gl);
            fb.bind();

            var tex = new Texture(gl);
            tex.createEmpty(width, height);
            tex.setFilters(gl.LINEAR, gl.LINEAR);
            tex.generateMipmap();

            var rb = new Renderbuffer(gl);
            rb.setSize(width, height);

            fb.setTexture(tex);
            fb.setRenderbuffer(rb);

            rb.unbind();
            tex.unbind();
            fb.unbind();

            return new RenderableTexture(fb, tex);
        }

        public bindForDrawing(): void {
            this.Framebuffer.bind();
        }

        public unbindForDrawing(): void {
            this.Framebuffer.unbind();
        }
    }
} 