module TestRuns {
    export function TestLevel() {
        var oReq = new XMLHttpRequest();
        oReq.open("GET", "Data/ROADS.LZS", true);
        oReq.responseType = "arraybuffer";

        oReq.onload = function (oEvent) {
            var arrayBuffer = oReq.response; // Note: not oReq.responseText
            if (arrayBuffer) {
                var byteArray: any = new Uint8Array(arrayBuffer);
                var ll = new Levels.MultiLevelLoader(new Data.ArrayBitStream(byteArray));
                var lToT = new Levels.LevelToTableRenderer();
                var levels = ll.Levels;
                for (var i = 0; i < levels.length; i++) {
                    var l = levels[i];
                    var h = document.createElement('h1');
                    h.innerHTML = l.Name;
                    document.body.appendChild(h);
                    var h2 = document.createElement('h2');
                    h2.innerHTML = 'Gravity: ' + l.Gravity + '\tOxygen: ' + l.Oxygen + '\tFuel: ' + l.Fuel;
                    document.body.appendChild(h2);
                    document.body.appendChild(lToT.convertColors(l));
                    document.body.appendChild(lToT.convert(l));
                }
            }
        };

        oReq.send(null);
    };
}