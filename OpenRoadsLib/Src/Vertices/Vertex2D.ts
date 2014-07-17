module Vertices {
    export class Vertex2D implements WGL.VertexObject {
        public static getDescriptor(gl: WebGLRenderingContext): WGL.VertexDescriptor {
            return new WGL.VertexDescriptor([
                new WGL.VertexAttributeDescription(gl, "aPos", 2, gl.FLOAT, true, 8, 0)
            ]);
        }

        public X: number;
        public Y: number;
       
        constructor(x: number, y: number) {
            this.X = x;
            this.Y = y;
        }

        getComponent(name: String): number[]{
            if (name == "aPos") {
                return [this.X, this.Y];
            } else {
                throw "Bad component: " + name;
            }
        }
    }
} 