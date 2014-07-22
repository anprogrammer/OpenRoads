attribute vec2 aPos;
varying vec2 vTexCoord;

uniform vec3 uPos;
uniform vec2 uSize, uLow, uHigh, vLow, vHigh;
uniform mat4 uViewMatrix;

void main(void) {
	vTexCoord = aPos.x * (uHigh - uLow) + uLow + aPos.y * (vHigh - vLow) + vLow;
	vec2 screenPos = aPos * uSize + uPos.xy;
	vec4 nPos = uViewMatrix * vec4(uPos, 1.0);
	
	vec2 percentPos = screenPos / vec2(320.0, 200.0);
	gl_Position = vec4((percentPos * 2.0 - 1.0) * vec2(1.0, -1.0), 2.0 / 20.0, 1.0);
}
