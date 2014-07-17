module TestRuns {
    export function TestCar(): void {
        var manager = new Managers.StreamManager(new Stores.AJAXFileProvider()), shaderManager = new Managers.ShaderManager(manager);
        var managers = new Managers.ManagerSet(manager, shaderManager);
        managers.Sounds = new Managers.SoundManager(managers);
        managers.Textures = new Managers.TextureManager(managers);

        manager.loadMultiple(["Data/CARS.LZS"]).done(() => {
            var cvs = <HTMLCanvasElement>document.getElementById('cvs');
            cvs.style.display = 'block';
            cvs.width = 320;
            cvs.height = 200;
            cvs.style.width = '640px';
            cvs.style.height = '400px';
            cvs.style.position = 'static';
            var isl = new Images.ImageSetLoader(managers);
            var car = isl.load(managers.Streams.getStream('Data/CARS.LZS'))[0];

            var ctx = cvs.getContext('2d');
            var ix = 0;
            var bin = document.createElement('input');
            bin.value = '0';
            document.body.appendChild(bin);
            var top = document.createElement('input');
            top.value = '3';
            document.body.appendChild(top);
            var f = 0;
            function drawFrame() {
                var base = parseInt(bin.value) || 0;
                var num = parseInt(top.value) || 3;
                f++;

                if (f % 2 == 0) {
                    ix = ((ix + 1) % num);
                }

                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, 1000, 1000);
                ctx.translate(160, 100);
                ctx.rotate(Math.PI / 2.0);
                ctx.drawImage(car.Canvas, car.XOffset, (ix + base) * 30, car.Canvas.width, 30, 0, 0, car.Canvas.width, 30);
                requestAnimationFrame(drawFrame);
            }
            requestAnimationFrame(drawFrame);
        });
    }
}