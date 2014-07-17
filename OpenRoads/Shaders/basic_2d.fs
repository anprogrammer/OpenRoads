#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D uSampler;
uniform float uAlpha;
uniform float uBrightness;

varying vec2 vTexCoord;

void main(void) {
	gl_FragColor = texture2D(uSampler, vTexCoord) * vec4(uBrightness, uBrightness, uBrightness, uAlpha);
}