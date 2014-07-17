module ExeData {
    export class ExeDataLoader {
        private managers: Managers.ManagerSet;
        constructor(managers: Managers.ManagerSet) {
            this.managers = managers;
        }

        public load(): void {
            var managers: Managers.ManagerSet = this.managers;

            var src = new ExeReader(managers.Streams.getStream('SKYROADS.EXE'));
            var dst = managers.Textures;

            var dash = dst.getImage('DASHBRD.LZS');

            var loader = new Images.DirectImageLoader(this.managers);
            var pi = 5;
            var palette: Data.Color[] = [new Data.Color(0, 0, 0), dash.Palette[pi]];
            while (palette.length < 255) {
                palette.push(dash.Palette[pi + 1]);
            }

            dst.setImages('NUMBERS', loader.loadFromStream(src, 0x13C * 8, palette, 10, 0, 0, 4, 5));
            dst.setImages('JUMPMASTER', loader.loadFromStream(src, 0x204 * 8, palette, 2, 203, 156, 26, 5));
           
            //Calculate O2 for flash
            dst.setImages('O2_RED', [this.imageByChangingColor(dash, 160, 161, 7, 7, new Data.Color(216, 224, 224), new Data.Color(255, 0, 0))]);
            
            //Calculate Fuel for flashing
            dst.setImages('FUEL_RED', [this.imageByChangingColor(dash, 155, 169, 16, 5, new Data.Color(216, 224, 224), new Data.Color(255, 0, 0))]);

            //Calculate progress indicator
            var progressImgs: Images.ImageFragment[] = [];
            for (var i = 1; i < 29; i++) {
                progressImgs.push(this.imageByChangingColor(dash, 42, 130, i, 20, new Data.Color(72, 0, 68), new Data.Color(113, 0, 101)));
            }

            dst.setImages('PROGRESS_INDICATOR', progressImgs);

            var cvs = managers.Canvas.getCanvas();
            cvs.width = 32;
            cvs.height = 32;
            var ctx = cvs.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 32, 32);
            dst.setImages('WHITE', [new Images.ImageFragment(cvs, [], 0, 0)]);
        }

        private imageByChangingColor(src: Images.ImageFragment, xPos: number, yPos: number, w: number, h: number, colorA: Data.Color, colorB: Data.Color): Images.ImageFragment {
            var ctxSrc = src.Canvas.getContext('2d');
            var dataSrc = ctxSrc.getImageData(xPos - src.XOffset, yPos - src.YOffset, w, h);

            var cvsDst = this.managers.Canvas.getCanvas();
            cvsDst.width = w;
            cvsDst.height = h;

            var ctxDst = cvsDst.getContext('2d');
            var dataDst = ctxDst.getImageData(0, 0, w, h);

            for (var i = 0; i < dataSrc.data.length; i += 4) {
                var color = new Data.Color(dataSrc.data[i + 0], dataSrc.data[i + 1], dataSrc.data[i + 2]);
                var alpha = dataSrc.data[i + 3];
                if (color.equals(colorA)) {
                    color = colorB;
                } else if (color.equals(colorB)) {
                    color = colorA;
                }

                dataDst.data[i + 0] = color.R;
                dataDst.data[i + 1] = color.G;
                dataDst.data[i + 2] = color.B;
                dataDst.data[i + 3] = alpha;
            }

            ctxDst.putImageData(dataDst, 0, 0);

            return new Images.ImageFragment(cvsDst, src.Palette, xPos, yPos);
        }
    }
}