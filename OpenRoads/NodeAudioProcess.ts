declare function require(s: string): any;
declare var GLOBAL: any;
declare var process: any;
var rl = require('./RoadsLib');
GLOBAL.TSM = require('./JsLibs/tsm-node');
rl.Configurations.runNodeAudio();