#ifdef GL_ES
precision highp float;
#endif

attribute vec3 aPos;
attribute vec3 aColor;
attribute vec2 aTexCoord;

varying vec3 vColor;

uniform mat4 uViewMatrix;
void main(void) {
	vec4 pos = uViewMatrix * vec4(aPos + vec3(0.0, 0.0, 1.0 * 46.0), 1.0);
	//sy = (80.0 - X) * nz / z
	vColor = aColor;
	float z = -(pos.z) / 46.0;

	float x = aPos.x;
	float y = aPos.y;

	float targetX = x;
	float targetY = (80.0 - y) + 102.0;
	float matchZ = 3.0;

	float farX = x / 46.0;
	float farY = 32.0 + (80.0 - y)  / 46.0;

	/*
	float zpF = 1.0 - (z - matchZ) / (farZ - matchZ);
	float zp = 1.0 - pow(zpF, 2.4018172794575);
	float xp = (farX - targetX) * zp + targetX;
	float yp = (farY - targetY) * zp + targetY;
	*/

	float zPercent = (z - 1.0) / 9.0;
	/*
	float zp = 91.59466959 * pow(zPercent, 9.0) - 305.4138054 * pow(zPercent, 8.0) + 305.7508309 * pow(zPercent, 7.0) + 73.07343228 * pow(zPercent, 6.0) - 
		391.7440574 * pow(zPercent, 5.0) + 351.6411708 * pow(zPercent, 4.0) - 165.0705506 * pow(zPercent, 3.0) + 49.44913238 * pow(zPercent, 2.0) - 11.08081692 * zPercent + 1.79997551;
		*/
	float zp = max(-0.02, 1.707075344*exp(-4.119718377*zPercent) - 0.08);
	zp = 1.0 - zp;
	float xp = (farX - targetX) * zp + targetX;
	float yp = (farY - targetY) * zp + targetY;

	gl_Position = vec4(xp / 160.0, -(yp - 100.0) / 100.0, z / 20.0, 1.0);
}
