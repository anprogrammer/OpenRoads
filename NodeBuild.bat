RMDIR Node /S /Q
MKDIR Node
xcopy OpenRoads\NodeMain.js Node
xcopy OpenRoads\NodeAudioProcess.js Node
xcopy OpenRoads\RoadsLib.js Node

mkdir Node\Data
mkdir Node\Data.XMas
mkdir Node\JsLibs
mkdir Node\Shaders
mkdir Node\Images
mkdir Node\Node
mkdir Node\Node\node_modules
mkdir Node\Node\node_modules\node-canvas
mkdir Node\Node\node_modules\node-glfw-ovr
mkdir Node\Node\node_modules\node-webgl-ovr
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
xcopy OpenRoads\Node\node_modules\node-glfw-ovr Node\Node\node_modules\node-glfw-ovr /E
xcopy OpenRoads\Node\node_modules\node-webgl-ovr Node\Node\node_modules\node-webgl-ovr /E
xcopy OpenRoads\Node\node_modules\node-core-audio Node\Node\node_modules\node-core-audio
xcopy OpenRoads\Node\node_modules\node-core-audio\gyp Node\Node\node_modules\node-core-audio\gyp /E
xcopy OpenRoads\Node\node_modules\node-core-audio\build Node\Node\node_modules\node-core-audio\build /E
xcopy OpenRoads\Node\node_modules\node-core-audio\node_modules\fft Node\Node\node_modules\node-core-audio\node_modules\fft /E

del Node\Data\settings*.json

del Node\Node\node_modules\node-core-audio\build\* /Q
del Node\Node\node_modules\node-core-audio\build\Release\*.pdb
del Node\Node\node_modules\node-core-audio\build\Release\*.exp
del Node\Node\node_modules\node-core-audio\build\Release\*.lib
RMDIR Node\Node\node_modules\node-core-audio\build\Release\obj /S /Q
RMDIR Node\Node\node_modules\node-core-audio\gyp /S /Q

del Node\Node\node_modules\node-glfw-ovr\build\* /Q
del Node\Node\node_modules\node-glfw-ovr\build\Release\*.pdb
del Node\Node\node_modules\node-glfw-ovr\build\Release\*.exp
del Node\Node\node_modules\node-glfw-ovr\build\Release\*.lib
RMDIR Node\Node\node_modules\node-glfw-ovr\build\Release\obj /S /Q
RMDIR Node\Node\node_modules\node-glfw-ovr\src /S /Q
RMDIR Node\Node\node_modules\node-glfw-ovr\test /S /Q
RMDIR Node\Node\node_modules\node-glfw-ovr\node_modules /S /Q


del Node\Node\node_modules\node-webgl-ovr\build\* /Q
del Node\Node\node_modules\node-webgl-ovr\build\Release\*.pdb
del Node\Node\node_modules\node-webgl-ovr\build\Release\*.exp
del Node\Node\node_modules\node-webgl-ovr\build\Release\*.lib
RMDIR Node\Node\node_modules\node-webgl-ovr\build\Release\obj /S /Q

RMDIR Node\Node\node_modules\node-webgl-ovr\doc /S /Q
RMDIR Node\Node\node_modules\node-webgl-ovr\examples /S /Q
RMDIR Node\Node\node_modules\node-webgl-ovr\src /S /Q
RMDIR Node\Node\node_modules\node-webgl-ovr\test /S /Q
RMDIR Node\Node\node_modules\node-webgl-ovr\tools /S /Q


del Node\Node\node_modules\node-webgl-ovr\node_modules\node-glfw-ovr\build\* /Q
del Node\Node\node_modules\node-webgl-ovr\node_modules\node-glfw-ovr\build\Release\*.pdb
del Node\Node\node_modules\node-webgl-ovr\node_modules\node-glfw-ovr\build\Release\*.exp
del Node\Node\node_modules\node-webgl-ovr\node_modules\node-glfw-ovr\build\Release\*.lib
RMDIR Node\Node\node_modules\node-webgl-ovr\node_modules\node-glfw-ovr\build\Release\obj /S /Q
RMDIR Node\Node\node_modules\node-webgl-ovr\node_modules\node-glfw-ovr\src /S /Q
RMDIR Node\Node\node_modules\node-webgl-ovr\node_modules\node-glfw-ovr\test /S /Q


copy NodeParts\node.exe Node\

RMDIR SkyRoadsVR /S /Q
mkdir SkyRoadsVR
move Node SkyRoadsVR
copy OpenRoads\Instructions.txt SkyRoadsVR\Instructions.txt
copy "Release Classic\ExeRunner.exe" "SkyRoadsVR\SkyRoads VR.exe"
copy "Release XMas\ExeRunner.exe" "SkyRoadsVR\Skyroads XMas VR.exe"
del skyroads_vr.zip
7z.exe a -tzip skyroads_vr.zip SkyRoadsVR
copy skyroads_vr.zip Website\skyroads_vr.zip

