#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D uSampler;
uniform float uAlpha;
uniform float uBrightness;
uniform vec2 uSize;

varying vec2 vTexCoord;

void main(void) {
	float direction = uBrightness;
	float totalProgress = uAlpha;
	
	vec4 color = texture2D(uSampler, vTexCoord);

	if (totalProgress < 0.29) {
		float pixY = uSize.y * vTexCoord.y;
		float row = mod(pixY, 2.0);
		float alphaMul = ((row < 1.0) == (uBrightness < 0.0)) ? 1.0 : 0.0;
	
		float avg = (color.r + color.g + color.b) / 3.0;
		gl_FragColor = vec4(avg * 0.5, avg * 0.75, avg, color.a * alphaMul);
	} else if (totalProgress < 0.43) {
		float fadeWhiteProgress = (totalProgress - 0.29) / 0.14;
		float avg = (color.r + color.g + color.b) / 3.0;
		gl_FragColor = vec4(avg * 0.5 + fadeWhiteProgress, avg * 0.75 + fadeWhiteProgress, avg + fadeWhiteProgress, color.a);
	} else if (totalProgress < 1.0) {
		float fadeWhiteProgress = 2.0 * (1.0 - (totalProgress - 0.43) /  0.57);
		gl_FragColor = vec4(color.r + fadeWhiteProgress, color.g + fadeWhiteProgress, color.b + fadeWhiteProgress, color.a);
  } else {
		gl_FragColor = color;
	}
}