#ifdef GL_ES
precision highp float;
#endif

attribute vec2 aPos;
attribute vec3 aColor;
attribute vec2 aTexCoord;

varying vec3 vColor;
varying vec2 vTexCoord;

uniform vec3 uPos;
uniform vec2 uSize, uLow, uHigh, vLow, vHigh;

uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;

void main(void) {
	vec2 screenPos = (vec2(1.0, -1.0) * aPos) * uSize + uPos.xy * vec2(1.0, -1.0) - vec2(160.0, -102.0 - 80.0);

	vec4 res = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(screenPos.xy, uPos.z, 1.0);
	gl_Position = res;
	vColor = aColor;
	vTexCoord = aPos.x * (uHigh - uLow) + uLow + aPos.y * (vHigh - vLow) + vLow;
}
