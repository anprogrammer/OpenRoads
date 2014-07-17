PUSHD
cd Node
cmd /C "npm install F:\Documents\GitHub\node-webgl"
cd node_modules\node-webgl
cmd /C "npm install F:\Documents\GitHub\node-glfw"
cd node_modules\node-glfw\build\Release\
copy F:\Libs\AntTweakBar\lib\AntTweakBar.dll .
copy F:\Libs\glfw-3.0.4\src\Release\glfw3.dll .
POPD