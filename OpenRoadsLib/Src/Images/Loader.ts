module Images {
    export class ImageFragment {
        public Canvas: HTMLCanvasElement;
        public Palette: Data.Color[];
        public XOffset: number;
        public YOffset: number;

        constructor(c: HTMLCanvasElement, palette: Data.Color[], x: number, y: number) {
            this.Canvas = c;
            this.Palette = palette;
            this.XOffset = x;
            this.YOffset = y;
        }
    }

    class PixelMap {
        public XOffset: number;
        public YOffset: number;
        public Width: number;
        public Height: number;
        public Data: number[];

        constructor(x: number, y: number, w: number, h: number, data: number[]) {
            this.XOffset = x;
            this.YOffset = y;
            this.Width = w;
            this.Height = h;
            this.Data = data;
        }
    }

    export class AnimLoader {
        private managers: Managers.ManagerSet;
        constructor(managers: Managers.ManagerSet) {
            this.managers = managers;
        }

        load(stream: Data.RandomAccessBitStream): ImageFragment[][]{
            var helper = new LoaderHelper(this.managers);

            var colorMap: Data.Color[] = null;
            var pixelMap: PixelMap = null;
            
            var reader = new Data.BinaryReader(stream);
            var expectedAnim = reader.getFixedLengthString(4);
            if (expectedAnim != "ANIM") {
                throw "Unexpected Ident: " + expectedAnim;
            }

            var numFrames = reader.getUint16(); //Not sure what I'm skipping
            //First we read a CMAP (always)
            var ident = reader.getFixedLengthString(4);
            if (ident !== "CMAP") {
                throw "Unexpected ident: " + ident;
            }

            colorMap = helper.loadColorMap(reader);

            var remainingInFrame = 0;
            var frame: ImageFragment[] = [];
            var frames: ImageFragment[][] = [frame];
            var pc = 0;

            for (var frameIdx = 0; frameIdx < numFrames; frameIdx++) {
                var numParts = reader.getUint16();
                for (var partIdx = 0; partIdx < numParts; partIdx++) {
                    var ident = reader.getFixedLengthString(4);
                    if (ident !== "PICT") {
                        throw "Unexpected ident: " + ident;
                    }
                    pixelMap = helper.loadPixelMap(reader);
                    stream.setPosition(Math.ceil(stream.getPosition() / 8) * 8);
                    frame.push(helper.assembleImage(false, colorMap, pixelMap));
                }
                if (frame.length > 0) {
                    frame = [];
                    frames.push(frame);
                }
            }

            return frames;
        }
    }

    export class DirectImageLoader {
        private managers: Managers.ManagerSet;
        constructor(managers: Managers.ManagerSet) {
            this.managers = managers;
        }

        loadFromStream(stream: Data.RandomAccessBitStream, streamPos: number, palette: Data.Color[], count: number, xOff: number, yOff: number, width: number, height: number): ImageFragment[] {
            stream.setPosition(streamPos);
            var reader = new Data.BinaryReader(stream);

            var fragments: ImageFragment[] = [];
            for (var i = 0; i < count; i++) {
                var data: number[] = [];
                for (var j = 0; j < width * height; j++) {
                    data.push(reader.getUint8());
                }

                var pm = new PixelMap(xOff, yOff, width, height, data);
                var helper = new LoaderHelper(this.managers);
                fragments.push(helper.assembleImage(true, palette, pm));
            }

            return fragments;
        }
    }

    export class ImageSetLoader {
        private managers: Managers.ManagerSet;
        constructor(managers: Managers.ManagerSet) {
            this.managers = managers;
        }

        load(stream: Data.RandomAccessBitStream): ImageFragment[] {
            var helper = new LoaderHelper(this.managers);
            var colorMap: Data.Color[] = null;
            var pixelMap: PixelMap = null;
            var results: ImageFragment[] = [];

            var reader = new Data.BinaryReader(stream);

            while (!stream.eof()) {
                var ident = reader.getFixedLengthString(4);
                if (ident == "CMAP") {
                    colorMap = helper.loadColorMap(reader);
                } else if (ident == "PICT") {
                    pixelMap = helper.loadPixelMap(reader);
                    stream.setPosition(Math.ceil(stream.getPosition() / 8) * 8);

                    if (colorMap != null && pixelMap != null) {
                        results.push(helper.assembleImage(false, colorMap, pixelMap));
                    }
                } else {
                    throw "Unexpected ident: " + ident;
                }
            }

            return results;
        }
    }

    export class DatLoader {
        private managers: Managers.ManagerSet;
        constructor(managers: Managers.ManagerSet) {
            this.managers = managers;
        }

        load(stream: Data.RandomAccessBitStream): ImageFragment[] {
            var results: ImageFragment[] = [];
            var helper = new LoaderHelper(this.managers);
            var colorMap: Data.Color[] = [null, new Data.Color(97, 0, 93), new Data.Color(113, 0, 101)];
            var reader = new Data.BinaryReader(stream);

            reader.getUint16(); //Skip
            var offset = reader.getUint16() == 0x2C ? 0x22 : 0xA;
            stream.setPosition(offset * 2 * 8);
            while (!reader.eof()) {
                var position = reader.getUint16();
                var w = reader.getUint8(), h = reader.getUint8();
                var pixels: number[] = [];
                for (var i = 0; i < w * h; i++) {
                    pixels.push(reader.getUint8());
                }

                results.push(helper.assembleImage(false, colorMap, new PixelMap(position % 320, Math.floor(position / 320), w, h, pixels)));
            }
            return results;
        }
    }

    class LoaderHelper {
        private managers: Managers.ManagerSet;
        constructor(managers: Managers.ManagerSet) {
            this.managers = managers;
        }

        loadColorMap(reader: Data.BinaryReader): Data.Color[] {
            var colors: Data.Color[] = [];
            var colorCount: number = reader.getUint8();
            for (var i = 0; i < colorCount; i++) {
                colors.push(new Data.Color(reader.getUint8() * 4, reader.getUint8() * 4, reader.getUint8() * 4));
            }

            reader.getBits(16 * colorCount); //Skip these.  Not sure :-\

            return colors;
        }

        loadPixelMap(reader: Data.BinaryReader): PixelMap {
            var offset = reader.getUint16();
            var h: number = reader.getUint16(),
                w: number = reader.getUint16();

            if (h == 0) {
                h = 1;
            }

            var stream2 = new Data.BinaryReader(new Data.CompressedByteStream(reader));
            var data: number[] = [];
            var pixelCount: number = w * h;

            for (var i = 0; i < pixelCount; i++) {
                data.push(stream2.getUint8());
            }

            return new PixelMap(offset%320, offset / 320, w, h, data);
        }

        assembleImage(noTransparentPixels: boolean, colorMap: Data.Color[], pixelMap: PixelMap): ImageFragment {
            var w = pixelMap.Width, h = pixelMap.Height;

            var canvas = this.managers.Canvas.getCanvas();
            canvas.width = w;
            canvas.height = h;

            var ctx: CanvasRenderingContext2D = canvas.getContext('2d');
            var data = ctx.getImageData(0, 0, w, h);

            var pixelCount = w * h;
            for (var i = 0; i < pixelCount; i++) {
                var pi = pixelMap.Data[i];
                var px = colorMap[pi];
                if (px && pi > 0) {
                    data.data[i * 4 + 0] = px.R;
                    data.data[i * 4 + 1] = px.G;
                    data.data[i * 4 + 2] = px.B;
                }
                data.data[i * 4 + 3] = noTransparentPixels || (pi != 0) ? 255 : 0;
            }

            ctx.putImageData(data, 0, 0);
            return new ImageFragment(canvas, colorMap, pixelMap.XOffset, pixelMap.YOffset);
        }
    }
} 