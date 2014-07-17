module TestRuns {
    export class TestPhysics {
        private cvs: HTMLCanvasElement;
        private ctx: CanvasRenderingContext2D;
        private manager: Managers.StreamManager;
        private level: Levels.Level;
        private game: Game.StateManager;
        private frame: number = 0;

        constructor() {
            var manager = new Managers.StreamManager(new Stores.AJAXFileProvider());
            this.manager = manager;
            manager.loadMultiple(["Data/DEMO.REC", "Data/ROADS.LZS"]).done(() => {
                var cvs = <HTMLCanvasElement>document.getElementById('cvs');
                this.cvs = cvs;
                cvs.style.display = 'block';
                cvs.width = 40 * 20;
                cvs.height = 7 * 30;
                cvs.style.width = 40 * 20 + 'px';
                cvs.style.height = 7 * 30 + 'px';
                this.ctx = cvs.getContext('2d');
                this.start();
            });
        }

        private start(): void {
            var ll = new Levels.MultiLevelLoader(this.manager.getStream('Data/ROADS.LZS'));
            var rec = this.manager.getRawArray('Data/DEMO.REC');

            this.level = ll.Levels[0];
            this.game = new Game.StateManager(null, this.level, new Game.DemoController(rec));

            for (var i = 0; i < 30 * 55; i++) {
                //this.game.runFrame();
            }

            //var ctl = <HTMLTextAreaElement>document.getElementById('log');
            //ctl.value = this.game.Log;

            var rf = () => {
                this.onFrame();
                requestAnimationFrame(rf);
            };
            requestAnimationFrame(rf);
        }

        private onFrame(): void {
            if (this.frame % 2 == 0) {
                this.game.runFrame();
            }
            this.frame++;
            var ctx = this.ctx;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, this.cvs.width, this.cvs.height);
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, this.cvs.width, this.cvs.height);

            var TSX = 40;
            var TSY = 30;

            ctx.translate(-TSX * this.game.currentZPosition + TSX, 0.0);
            var l = this.level;
            for (var i = 0; i < l.getLength(); i++) {
                for (var j = 0; j < 7; j++) {
                    var c = l.Cells[j][i];
                    if (c.Tile != null) {
                        ctx.fillStyle = c.Tile.Colors.Top.toCss()
                        ctx.fillRect(i * TSX, j * TSY, TSX, TSY);
                    }

                    if (c.Cube != null) {
                        ctx.fillStyle = c.Cube.Colors.Top.toCss()
                        var P = 5;
                        ctx.fillRect(i * TSX + P, j * TSY + P, TSX - P * 2, TSY - P * 2);
                        ctx.strokeStyle = '#FF0000';
                        ctx.strokeRect(i * TSX + P, j * TSY + P, TSX - P * 2, TSY - P * 2);
                    }
                }
            }

            ctx.strokeStyle = '#7777FF';
            ctx.lineWidth = 3.0;
            ctx.beginPath();
            ctx.arc(TSX * this.game.currentZPosition, TSY * (this.game.currentXPosition - 95) / 0x2E, this.game.currentYPosition * TSY / 120.0 * 0.75, 0, 2 * Math.PI);
            ctx.stroke(); 
            ctx.lineWidth = 1.0;

            ctx.strokeStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(TSX * this.game.currentZPosition, TSY * (this.game.currentXPosition - 95) / 0x2E, 0.75 * TSY, 0, 2 * Math.PI);
            ctx.stroke(); 

            ctx.strokeStyle = '#00FF00';
            ctx.beginPath();
            var cx = TSX * this.game.currentZPosition, cy = TSY * (this.game.currentXPosition - 95) / 0x2E;
            ctx.moveTo(cx, cy - 5);
            ctx.lineTo(cx, cy + 5);

            ctx.moveTo(cx - 5, cy);
            ctx.lineTo(cx + 5, cy);
            ctx.stroke();

            ctx.strokeStyle = '#0000FF';
            cx = TSX * this.game.lastJumpZ, cy = TSY * (this.game.currentXPosition - 95) / 0x2E;
            ctx.moveTo(cx, cy - 5);
            ctx.lineTo(cx, cy + 5);

            ctx.moveTo(cx - 5, cy);
            ctx.lineTo(cx + 5, cy);
            ctx.stroke();
        }
    }
} 
