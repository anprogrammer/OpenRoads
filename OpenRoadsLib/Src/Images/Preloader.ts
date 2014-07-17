module Images {
    export class Preloader {
        public preloadData(gl: WebGLRenderingContext, managers: Managers.ManagerSet): void {
            this.compress(managers, 'OXY_DISP.DAT');
            this.compress(managers, 'FUL_DISP.DAT');
            this.compress(managers, 'SPEED.DAT');
            this.compress(managers, 'PROGRESS_INDICATOR');

            managers.Sounds.getMultiEffect('SFX.SND');
            ['CARS.LZS', 'DASHBRD.LZS', 'GOMENU.LZS', 'HELPMENU.LZS', 'INTRO.LZS', 'MAINMENU.LZS', 'SETMENU.LZS',
                'WORLD0.LZS', 'WORLD1.LZS', 'WORLD2.LZS', 'WORLD3.LZS', 'WORLD4.LZS', 'WORLD5.LZS', 'WORLD6.LZS', 'WORLD7.LZS', 'WORLD8.LZS', 'WORLD9.LZS']
                .map((fname) => managers.Textures.getTexture(gl, fname));
        }

        private compress(managers: Managers.ManagerSet, name: string) {
            var parts = managers.Textures.getImages(name);
            var combinedParts: ImageFragment[] = parts.map((part, idx) => this.compressPart(managers, parts, idx));
            managers.Textures.setImages(name, combinedParts);
        }

        private compressPart(managers: Managers.ManagerSet, parts: ImageFragment[], upTo: number): ImageFragment {
            var minX = Infinity, maxX = -Infinity;
            var minY = Infinity, maxY = -Infinity;
            for (var i = 0; i <= upTo; i++) {
                var p = parts[i];
                minX = Math.min(p.XOffset, minX);
                maxX = Math.max(p.XOffset + p.Canvas.width, maxX);
                minY = Math.min(p.YOffset, minY);
                maxY = Math.max(p.YOffset + p.Canvas.height, maxY);
            }

            var cvs = managers.Canvas.getCanvas();
            cvs.width = maxX - minX;
            cvs.height = maxY - minY;

            var ctx = cvs.getContext('2d');
            for (var i = 0; i <= upTo; i++) {
                var p = parts[i];
                ctx.drawImage(p.Canvas, p.XOffset - minX, p.YOffset - minY);
            }

            return new ImageFragment(cvs, parts[0].Palette, minX, minY);
        }
    }
}