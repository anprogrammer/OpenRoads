declare function require(s: string): any;
declare var GLOBAL: any;
var rl = require('./RoadsLib');
GLOBAL.TSM = require('./JsLibs/tsm-node');
rl.Configurations.runNode();