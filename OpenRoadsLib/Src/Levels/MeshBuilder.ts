module Levels {
    export class MeshBuilder {
        public CellLength: number = 46;
        public CellWidth: number = 46;
        buildMesh(level: Level): Vertices.Vertex3DC[]{
            var verts: Vertices.Vertex3DC[] = [];

            var addQuad = (color: Data.Color, p1: TSM.vec3, p2: TSM.vec3, p3: TSM.vec3, p4: TSM.vec3): void => {
                var c = color.toVec3();
                verts.push(new Vertices.Vertex3DC(p1, c));
                verts.push(new Vertices.Vertex3DC(p2, c));
                verts.push(new Vertices.Vertex3DC(p3, c));

                verts.push(new Vertices.Vertex3DC(p3, c));
                verts.push(new Vertices.Vertex3DC(p4, c));
                verts.push(new Vertices.Vertex3DC(p1, c));
            };

            var addCube = (colors: CubeColors, xLeft: number, xRight: number, yBottom: number, yTop: number, zStart: number, zEnd: number, drawFront: boolean, drawLeft: boolean, drawRight: boolean): void => {
                var ltf = new TSM.vec3([xLeft,  yTop,    zStart]);
                var rtf = new TSM.vec3([xRight, yTop,    zStart]);
                var lbf = new TSM.vec3([xLeft,  yBottom, zStart]);
                var rbf = new TSM.vec3([xRight, yBottom, zStart]);               
                var ltb = new TSM.vec3([xLeft, yTop,     zEnd]);
                var rtb = new TSM.vec3([xRight, yTop,    zEnd]);
                var lbb = new TSM.vec3([xLeft, yBottom,  zEnd]);
                var rbb = new TSM.vec3([xRight, yBottom, zEnd]);

                if (drawFront) {
                    addQuad(colors.Front, ltf, rtf, rbf, lbf);
                }

                if (drawLeft) {
                    addQuad(colors.Left, ltf, lbf, lbb, ltb);
                }

                if (drawRight) {
                    addQuad(colors.Right, rtf, rbf, rbb, rtb);
                }
                addQuad(colors.Top, ltf, rtf, rtb, ltb);
            };

            var tunnelHighRadius = 23, tunnelLowRadius = 20, tunnelRadiusYMultiplier = 0.855, tunnelSegs = 23;
            var generateCurve = (r: number, xB: number, yB: number, z: number): TSM.vec3[] => {
                var pts: TSM.vec3[] = [];
                for (var i = 0; i <= tunnelSegs; i++) {
                    var a = i / tunnelSegs * Math.PI;
                    var x = xB + Math.cos(a) * r;
                    var y = yB + Math.sin(a) * r * tunnelRadiusYMultiplier;
                    pts.push(new TSM.vec3([x, y, z]));
                }
                return pts;
            };
            var connectCurves = (colors: Data.Color[], c1: TSM.vec3[], c2: TSM.vec3[]) => {
                var segs = c1.length;
                for (var i = 0; i <segs - 1; i++) {
                    addQuad(colors[Math.floor(i / segs * colors.length)],
                        c1[i + 0], c1[i + 1],
                        c2[i + 1], c2[i + 0]);
                }
            };

            var addTunnel = (t: TunnelProperties, xLeft: number, xRight: number, yBase: number, zStart: number, zEnd: number): void => {
                var center = (xLeft + xRight) / 2.0;
                var frontLow = generateCurve(tunnelLowRadius, center, yBase, zStart);
                var frontHigh = generateCurve(tunnelHighRadius, center, yBase, zStart);
                var backLow = generateCurve(tunnelLowRadius, center, yBase, zEnd);
                var backHigh = generateCurve(tunnelHighRadius, center, yBase, zEnd);
                var center = (xLeft + xRight) / 2;
                var colors = t.TunnelColors;
                connectCurves(colors, frontLow, backLow);
                connectCurves(colors, frontHigh, backHigh);
                connectCurves([colors[0]], frontLow, frontHigh);
            };    

            var addCubeTunnel = (t: TunnelProperties, c: CubeProperties, xLeft: number, xRight: number, yBase: number, zStart: number, zEnd: number, drawLeft: boolean, drawRight: boolean): void => {
                var center = (xLeft + xRight) / 2.0;
                var frontLow = generateCurve(tunnelLowRadius, center, yBase, zStart);
                var backLow = generateCurve(tunnelLowRadius, center, yBase, zEnd);
                var center = (xLeft + xRight) / 2;
                connectCurves([c.Colors.Right, c.Colors.Top, c.Colors.Left], frontLow, backLow);

                frontLow.splice(0, 0, new TSM.vec3([xRight, yBase, zStart]));
                frontLow.push(new TSM.vec3([xLeft, yBase, zStart]));
                connectCurves([c.Colors.Front], frontLow, frontLow.map((v) => new TSM.vec3([v.x, c.Height, v.z])));
                addCube(c.Colors, xLeft, xRight, yBase, c.Height, zStart, zEnd, false, drawLeft, drawRight);
            };   

            function getHeight(c: Cell): number {
                if (c.isEmpty()) {
                    return 0;
                }

                if (c.Cube !== null) {
                    return c.Cube.Height;
                }

                if (c.Tile !== null) {
                    return 80.0;
                }

                return 0;
            }
            
            for (var z = 0; z < level.getLength(); z++) {
                for (var x = 0; x < 7; x++) {
                    var c = level.Cells[x][z];
                    var xLeft = x * this.CellWidth - this.CellWidth * 3.5;
                    var xRight = xLeft + this.CellWidth;
                    var zStart = -z * 46.0;
                    var zEnd = -(z + 1) * 46.0;

                    var h = getHeight(c);
                    var drawLeft = x === 0 || getHeight(level.Cells[x - 1][z]) < h;
                    var drawRight = x === 6 || getHeight(level.Cells[x + 1][z]) < h;
                    var drawFront = z === 0 || getHeight(level.Cells[x][z - 1]) < h;

                    if (c.Tile != null) {
                        addCube(c.Tile.Colors, xLeft, xRight, 0x2400 / 0x80, 0x2800 / 0x80, zStart, zEnd, drawFront, drawLeft, drawRight);   
                    }
                    if (c.Cube != null && c.Tunnel == null) {
                        addCube(c.Cube.Colors, xLeft, xRight, 0x2800 / 0x80, c.Cube.Height, zStart, zEnd, drawFront, drawLeft, drawRight);
                    }
                    if (c.Tunnel != null && c.Cube == null) {
                        addTunnel(c.Tunnel, xLeft, xRight, 0x2800 / 0x80, zStart, zEnd);
                    }
                    if (c.Tunnel != null && c.Cube != null) {
                        //addTunnel(c.Tunnel, xLeft, xRight, 0x2800 / 0x80, zStart, zEnd);
                        addCubeTunnel(c.Tunnel, c.Cube, xLeft, xRight, 0x2800 / 0x80, zStart, zEnd, drawLeft, drawRight);
                    }
                }
            }

            return verts;
        }
    }
} 