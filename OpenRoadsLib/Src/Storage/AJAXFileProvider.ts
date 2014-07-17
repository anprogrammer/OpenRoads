module Stores {
    export class AJAXFileProvider implements FileProvider {
        public load(filename: string, cb: (data: Uint8Array) => void): void {
            var oReq = new XMLHttpRequest();
            oReq.open("GET", filename, true);
            oReq.responseType = "arraybuffer";
            oReq.onload = (oEvent) => {
                var arrayBuffer = oReq.response;
                var result = new Uint8Array(arrayBuffer);
                cb(result);
            };
            oReq.send(null);
        }
    };
} 