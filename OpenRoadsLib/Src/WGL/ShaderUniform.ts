module WGL {
    export class ShaderUniform {
        private gl: WebGLRenderingContext;
        private location: WebGLUniformLocation;
        constructor(gl: WebGLRenderingContext, location: WebGLUniformLocation) {
            if (location == null) {
                throw "InvalidUniformName";
            }

            this.gl = gl;
            this.location = location;
        }

        set1i(i: number) {
            this.gl.uniform1i(this.location, i);
        }

        set1f(f: number) {
            this.gl.uniform1f(this.location, f);
        }

        setVec2(v: TSM.vec2) {
            this.gl.uniform2f(this.location, v.x, v.y);
        }

        setVec3(v: TSM.vec3) {
            this.gl.uniform3f(this.location, v.x, v.y, v.z);
        }

        setMat4(m: TSM.mat4) {
            var nums: number[] = [];
            //Hack for node-webgl.  Should fix there instead.
            var marr = m.all();
            for (var i = 0; i < marr.length; i++) {
                nums.push(marr[i]);
            }
            this.gl.uniformMatrix4fv(this.location, false, marr);
        }
    }
} 