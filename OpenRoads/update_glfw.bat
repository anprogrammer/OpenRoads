PUSHD
cd Node
cd node_modules\node-webgl-ovr
cmd /C "npm install F:\Documents\GitHub\node-glfw-ovr"
cd node_modules\node-glfw-ovr\build\Release\
copy F:\Libs\AntTweakBar\lib\AntTweakBar.dll .
copy F:\Libs\glfw-3.0.4\src\Release\glfw3.dll .
POPD