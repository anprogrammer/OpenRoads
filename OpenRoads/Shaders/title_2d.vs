#ifdef GL_ES
precision highp float;
#endif

attribute vec2 aPos;
varying vec2 vTexCoord;

uniform vec3 uPos;
uniform vec2 uSize;
uniform float uAlpha;
uniform float uBrightness;

uniform vec2 uLow, uHigh, vLow, vHigh;

void main(void) {
	float direction = uBrightness;
	float totalProgress = uAlpha;
	float animProgress = clamp(totalProgress / 0.29, 0.0, 1.0);

	float endX = uPos.x;
	float startX = (uBrightness < 0.0) ? -uSize.x : 320.0;

	vTexCoord = aPos.x * (uHigh - uLow) + uLow + aPos.y * (vHigh - vLow) + vLow;
	vec2 screenPos = aPos * uSize + vec2((endX - startX) * animProgress + startX, uPos.y);
	vec2 percentPos = screenPos / vec2(320.0, 200.0);
	gl_Position = vec4((percentPos * 2.0 - 1.0) * vec2(1.0, -1.0), uPos.z / 20.0, 1.0);
}
