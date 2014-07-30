#ifdef GL_ES
precision highp float;
#endif

attribute vec3 aPos;
attribute vec3 aColor;
attribute vec2 aTexCoord;

varying vec3 vColor;
varying vec2 vTexCoord;

uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;
uniform float uScale;

void main(void) {
	gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPos.xyz, 1.0);
	vColor = aColor;
	vTexCoord = aTexCoord.xy;
}
