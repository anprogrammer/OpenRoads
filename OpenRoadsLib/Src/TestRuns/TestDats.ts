module TestRuns {
    export function TestDats() {
        function loadStream(name: string, cb: (bs: Data.ArrayBitStream) => void) {
            var oReq = new XMLHttpRequest();
            oReq.open("GET", name, true);
            oReq.responseType = "arraybuffer";
            oReq.onload = function (oEvent) {
                var arrayBuffer = oReq.response; // Note: not oReq.responseText
                cb(new Data.ArrayBitStream(<any>(new Uint8Array(arrayBuffer))));
            };
            oReq.send(null);
        }

        var managers: Managers.ManagerSet = null;

        loadStream('Data/WORLD0.LZS', function (backBS) {
            loadStream('Data/DASHBRD.LZS', function (dashBS) {
                loadStream('Data/OXY_DISP.DAT', function (dat1BS) {
                    loadStream('Data/FUL_DISP.DAT', function (dat2BS) {
                        loadStream('Data/SPEED.DAT', function (dat3BS) {
                            var back = new Images.ImageSetLoader(managers).load(backBS)[0];
                            var dash = new Images.ImageSetLoader(managers).load(dashBS)[0];
                            var oxys = [new Images.DatLoader(managers).load(dat1BS), new Images.DatLoader(managers).load(dat2BS), new Images.DatLoader(managers).load(dat3BS)];

                            var canvas = document.createElement('canvas');
                            canvas.width = 320;
                            canvas.height = 200;

                            document.body.appendChild(canvas);

                            var ctx: CanvasRenderingContext2D = canvas.getContext('2d');

                            var i = 0;
                            function drawFrame() {
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                ctx.drawImage(back.Canvas, 0, 0);
                                ctx.drawImage(dash.Canvas, dash.XOffset, dash.YOffset);

                                for (var k = 0; k < oxys.length; k++) {
                                    var oxy = oxys[k];
                                    for (var j = 0; j < (i % oxy.length + 1); j++) {
                                        ctx.drawImage(oxy[j].Canvas, oxy[j].XOffset, oxy[j].YOffset);
                                    }
                                }

                                requestAnimationFrame(drawFrame);
                            }
                            setInterval(function () {
                                i++;
                            }, 500);
                            requestAnimationFrame(drawFrame);
                        });
                    });
                });
            });
        });
    }
} 