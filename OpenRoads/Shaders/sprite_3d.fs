#ifdef GL_ES
precision highp float;
#endif


uniform sampler2D uSampler;

varying vec3 vColor;
varying vec2 vTexCoord;

void main(void) {
	gl_FragColor = texture2D(uSampler, vTexCoord);
}