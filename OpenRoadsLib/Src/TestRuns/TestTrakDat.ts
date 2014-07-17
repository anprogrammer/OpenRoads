module TestRuns {
    export function TestTrekDat() {

        var manager = new Managers.StreamManager(new Stores.AJAXFileProvider()), shaderManager = new Managers.ShaderManager(manager);
        var managers = new Managers.ManagerSet(manager, shaderManager);
        managers.Sounds = new Managers.SoundManager(managers);
        managers.Textures = new Managers.TextureManager(managers);

        manager.loadMultiple(["Data/TREKDAT.LZS"]).done(() => {
            var stream = manager.getStream("Data/TREKDAT.LZS");
            var reader = new Data.BinaryReader(stream);


            var cvs = <HTMLCanvasElement>document.getElementById('cvs');
            cvs.width = 320;
            cvs.height = 200;
            cvs.style.width = '640px';
            cvs.style.height = '400px';
            cvs.style.display = 'block';

            var ctx = cvs.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 320, 200);
            ctx.fillStyle = '#FF0000';

            var idx = 0;
            while (!reader.eof()) {
                idx++;
                var loadBuffEnd = reader.getUint16();
                var bytesToRead = reader.getUint16();
                var loadOffset = loadBuffEnd - bytesToRead;

                var reader2 = new Data.BinaryReader(new Data.CompressedByteStream(reader));
                var arr: number[] = [];
                for (var i = 0; i < loadOffset; i++) {
                    arr.push(0);
                }

                for (var i = 0; i < bytesToRead; i++) {
                    arr.push(reader2.getUint8());
                }

                var srcPtr = loadOffset;
                var dstPtr = 0;
                var dx = 0x410;
                for (var i = 0; i < 0x138 * 2; i++) {
                    arr[dstPtr] = arr[srcPtr];
                    dstPtr++;
                    srcPtr++;
                }

                while (dx > 0) {
                    arr[dstPtr] = arr[srcPtr]; dstPtr++; srcPtr++;
                    arr[dstPtr] = arr[srcPtr]; dstPtr++; srcPtr++;
                    arr[dstPtr] = arr[srcPtr]; dstPtr++; srcPtr++;

                    while (true) {
                        var bt = arr[srcPtr];
                        arr[dstPtr] = bt;
                        srcPtr++; dstPtr++;

                        if (bt == 0xFF) break;

                        arr[dstPtr] = arr[srcPtr]; dstPtr++; srcPtr++;
                        arr[dstPtr] = 0; dstPtr++;
                    }

                    dx--;
                }

                stream.setPosition(Math.ceil(stream.getPosition() / 8) * 8);

                function drawShape(startIdx: number) {
                    var stream = new Data.ArrayBitStream(arr);
                    stream.setPosition(startIdx * 8);

                    var reader = new Data.BinaryReader(stream);

                    var color = reader.getUint8();
                    var ptr = 10240 + reader.getUint16();
                    console.log('X: ' + (ptr % 320), 'Y: ' + Math.floor(ptr / 320));
                    var xs: string[] = [];
                    while (true) {
                        var v = reader.getUint8();
                        if (v == 0xFF) {
                            break;
                        }

                        var ptr2 = ptr - v;

                        var ct = reader.getUint8();
                        reader.getUint8();

                        ctx.fillRect(ptr2 % 320, ptr2 / 320, ct, 1);
                        xs.push((ptr2 % 320) + '-' + ct);
                        ptr += 320;
                    }

                    console.log(xs);
                }


                var i = 0;
                var inp = document.createElement('input');
                inp.value = '0';
                inp.style.display = 'block';
                inp.style.position = 'absolute';
                inp.style.right = '0px';
                document.body.appendChild(inp);
                inp.onchange = function () {
                    var ibx = parseInt(inp.value);

                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, 320, 200);
                    var ib = 0;
                    for (var i = 0; i < 10; i++) {
                        var colors = ['#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#00FFFF', '#FFFF00', '#FFFFFF', '#FFAA00'];
                            var color = colors[(i) % colors.length];
                            console.log('ShapeBase: ' + ib + ', ShapeNum: ' + i + ', Color: ' + color);
                            var idx = 48 * i + ib * 2 + ibx * 2;
                            ctx.fillStyle = color;
                            drawShape(arr[idx + 0] + (arr[idx + 1] << 8));
                        }
                    
                    i++;
                };

                var btn = document.createElement('input');
                btn.type = 'button';
                btn.value = 'Cycle';
                btn.style.display = 'block';
                btn.style.position = 'absolute';
                btn.style.right = '200px';
                document.body.appendChild(btn);

                var ivl: number = null;
                btn.onclick = function () {
                    if (ivl) {
                        clearInterval(ivl);
                        ivl = null;
                    } else {
                        ivl = setInterval(function () {
                            inp.onchange(null);
                            inp.value = '' + (parseInt(inp.value) + 1);
                        }, 1000);
                    }
                };

                inp.value = '0';
                inp.onchange(null);
                return;
            }

        });
    }
} 