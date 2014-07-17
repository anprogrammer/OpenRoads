module TestRuns {
    export function TestAnims() {
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
        var f = 'Data/SETMENU.LZS';
        loadStream(f, function (bsIntro) {
            loadStream(f, function (bsAnim) {
                var parts = new Images.ImageSetLoader(managers).load(bsIntro);
                var anim = new Images.ImageSetLoader(managers).load(bsAnim);
                var canvas = document.createElement('canvas');
                canvas.width = 320;
                canvas.height = 200;
                document.body.appendChild(canvas);

                var i = 0;
                var ctx: CanvasRenderingContext2D = canvas.getContext('2d');

                function drawFrame() {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    document.title = 'IMG: ' + i;
                    ctx.drawImage(parts[i].Canvas, parts[i].XOffset, parts[i].YOffset);
                    requestAnimationFrame(drawFrame);
                }
                requestAnimationFrame(drawFrame);
                setInterval(function () {
                    i = (i + 1) % parts.length;
                }, 1000);
            });
        });
    };
}