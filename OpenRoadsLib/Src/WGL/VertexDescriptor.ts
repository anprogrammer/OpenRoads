module WGL {
    export interface VertexObject {
        getComponent(name: String): number[];
    }
    export class VertexAttributeDescription {
        public Name: string;
        public NumComponents: number;
        public TypeOfData: number;
        public Normalize: boolean;
        public Stride: number;
        public Offset: number;
        public Size: number;

        constructor(gl: WebGLRenderingContext, name: string, numComponents: number, typeOfData: number = -1, normalize: boolean = false, stride: number = 0, offset: number = 0) {
            this.Name = name;
            this.NumComponents = numComponents;
            this.TypeOfData = typeOfData >= 0 ? typeOfData : gl.FLOAT;
            this.Normalize = normalize;
            this.Stride = stride;
            this.Offset = offset;
            switch (typeOfData) {
                case gl.FLOAT:
                    this.Size = 4 * this.NumComponents;
                    break;
                default:
                    throw "Invalid typeOfData";
            }
        }
    }

    export class VertexDescriptor {
        private attributes: VertexAttributeDescription[];
        private vertexSize: number;
        constructor(attributes: VertexAttributeDescription[]) {
            this.attributes = attributes;
            this.vertexSize = 0;
            attributes.forEach((a) => this.vertexSize += a.Size);
        }

        buildArray(verts: VertexObject[], array: Float32Array = null): Float32Array {
            if (array == null) {
                array = new Float32Array(verts.length * this.vertexSize / 4.0);
            }

            var attrs = this.attributes;
            var pos = 0;
            for (var i = 0; i < verts.length; i++) {
                for (var j = 0; j < attrs.length; j++) {
                    var comp = verts[i].getComponent(attrs[j].Name);
                    if (comp.length != attrs[j].NumComponents) {
                        throw "InvalidVertexFormat";
                    }
                    for (var k = 0; k < comp.length; k++) {
                        array[pos++] = comp[k];
                    }
                }
            }

            return array;
        }

        enableAndConfigureVertexAttributes(shader: Shader): void {
            shader.use();
            var attrs = this.attributes;
            var offset = 0;
            var stride = this.vertexSize;
            for (var i = 0; i < attrs.length; i++) {
                var attrDesc = attrs[i];
                var vertAttr = shader.getVertexAttribute(attrDesc.Name);
                if (vertAttr !== null) {
                    vertAttr.enable();
                    vertAttr.attribPointer(attrDesc.NumComponents, attrDesc.TypeOfData, attrDesc.Normalize, stride, offset);
                }
                offset += attrDesc.Size;
            }
        }

        drawContiguous(gl: WebGLRenderingContext, buffer: Buffer) {
            gl.drawArrays(gl.TRIANGLES, 0, buffer.getNumElements() / (this.vertexSize / 4));
        }

        public disableVertexAttributes(shader: Shader) {
            shader.use();
            var attrs = this.attributes;
            for (var i = 0; i < attrs.length; i++) {
                var vertAttr = shader.getVertexAttribute(attrs[i].Name);
                if (vertAttr !== null) {
                    vertAttr.disable();
                }
            }
        }
    }
} 