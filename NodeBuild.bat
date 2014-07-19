RMDIR Node /S /Q
MKDIR Node
xcopy OpenRoads\NodeMain.js Node
xcopy OpenRoads\RoadsLib.js Node

mkdir Node\Data
mkdir Node\Data.XMas
mkdir Node\JsLibs
mkdir Node\Shaders
mkdir Node\Images
mkdir Node\Node
mkdir Node\Node\node_modules
mkdir Node\Node\node_modules\node-canvas
mkdir Node\Node\node_modules\node-glfw
mkdir Node\Node\node_modules\node-webgl
mkdir Node\Node\node_modules\node-core-audio
mkdir Node\Node\node_modules\node-core-audio\gyp
mkdir Node\Node\node_modules\node-core-audio\build
mkdir Node\Node\node_modules\node-core-audio\node_modules
mkdir Node\Node\node_modules\node-core-audio\node_modules\fft

xcopy OpenRoads\Data Node\Data /E
xcopy OpenRoads\Data.XMas Node\Data.XMas /E
xcopy OpenRoads\Images Node\Images /E
xcopy OpenRoads\JsLibs Node\JsLibs /E
xcopy OpenRoads\Shaders Node\Shaders /E
xcopy OpenRoads\Node\node_modules\node-canvas Node\Node\node_modules\node-canvas /E
xcopy OpenRoads\Node\node_modules\node-glfw Node\Node\node_modules\node-glfw /E
xcopy OpenRoads\Node\node_modules\node-webgl Node\Node\node_modules\node-webgl /E
xcopy OpenRoads\Node\node_modules\node-core-audio Node\Node\node_modules\node-core-audio
xcopy OpenRoads\Node\node_modules\node-core-audio\gyp Node\Node\node_modules\node-core-audio\gyp /E
xcopy OpenRoads\Node\node_modules\node-core-audio\build Node\Node\node_modules\node-core-audio\build /E
xcopy OpenRoads\Node\node_modules\node-core-audio\node_modules\fft Node\Node\node_modules\node-core-audio\node_modules\fft /E