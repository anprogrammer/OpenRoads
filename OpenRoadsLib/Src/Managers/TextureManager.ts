module Managers {
    export class TextureManager {
        private managers: ManagerSet;
        private streamManager: StreamManager;
        private textures: { [s: string]: Drawing.TextureFragment[][] } = {};
        private images: { [s: string]: Images.ImageFragment[][] } = {};

        constructor(managers: Managers.ManagerSet) {
            this.managers = managers;
            this.streamManager = managers.Streams;
        }

        public getImage(filename: string): Images.ImageFragment {
            return this.getImages(filename)[0];
        }

        public getImages(filename: string): Images.ImageFragment[] {
            filename = filename.toUpperCase();
            if (!(filename in this.images)) {
                var images: Images.ImageFragment[] = null;

                var stream = this.streamManager.getStream(filename);
                if (filename.split('.')[1].toUpperCase() == 'LZS') {
                    var imgLoader = new Images.ImageSetLoader(this.managers);
                    images = imgLoader.load(stream);
                } else {
                    var datLoader = new Images.DatLoader(this.managers);
                    images = datLoader.load(stream);
                }
                this.images[filename] = [images];
            }
            return this.images[filename][0];
        }

        public getTexture(gl: WebGLRenderingContext, filename: string): Drawing.TextureFragment {
            return this.getTextures(gl, filename)[0];
        }

        public getTextures(gl: WebGLRenderingContext, filename: string): Drawing.TextureFragment[]{
            filename = filename.toUpperCase();
            if (!(filename in this.textures)) {
                this.textures[filename] = [this.imageFragmentsToTextureFragments(gl, this.getImages(filename))];
            }
            return this.textures[filename][0];
        }

        public getAnim(gl: WebGLRenderingContext, filename: string): Drawing.TextureFragment[][]{
            filename = filename.toUpperCase();
            if (!(filename in this.textures)) {
                var stream = this.streamManager.getStream(filename);
                var loader = new Images.AnimLoader(this.managers);
                var anim = loader.load(stream);
                this.textures[filename] = anim.map((images) => this.imageFragmentsToTextureFragments(gl, images));
            }
            return this.textures[filename];
        }

        public setImages(filename: string, imgs: Images.ImageFragment[]): void {
            this.images[filename] = [imgs];
        }

        private imageFragmentsToTextureFragments(gl: WebGLRenderingContext, imgs: Images.ImageFragment[]): Drawing.TextureFragment[]{
            return imgs.map((img) => {
                var tex = new WGL.Texture(gl);
                tex.loadData(img.Canvas);
                tex.setFilters(gl.NEAREST, gl.NEAREST);
                return new Drawing.TextureFragment(tex, img.XOffset, img.YOffset, img.Canvas.width, img.Canvas.height);
            });
        }
    }
} 