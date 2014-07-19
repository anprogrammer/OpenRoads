RMDIR Website /S /Q
MKDIR Website
xcopy OpenRoads\index.html Website
xcopy OpenRoads\xmas.html Website
xcopy OpenRoads\GameMain.js Website
xcopy OpenRoads\GameMainXMas.js Website
xcopy OpenRoads\RoadsLib.js Website
xcopy OpenRoads\app.css Website

mkdir Website\Data
mkdir Website\Data.XMas
mkdir Website\JsLibs
mkdir Website\Shaders
mkdir Website\Images

xcopy OpenRoads\Data Website\Data /E
xcopy OpenRoads\Data.XMas Website\Data.XMas /E
xcopy OpenRoads\Images Website\Images /E
xcopy OpenRoads\JsLibs Website\JsLibs /E
xcopy OpenRoads\Shaders Website\Shaders /E
