/**
Module P: Generic Promises for TypeScript
Project, documentation, and license: https://github.com/pragmatrix/Promise
*/
var P;
(function (P) {
    /**
    Returns a new "Deferred" value that may be resolved or rejected.
    */
    function defer() {
        return new DeferredI();
    }
    P.defer = defer;

    /**
    Converts a value to a resolved promise.
    */
    function resolve(v) {
        return defer().resolve(v).promise();
    }
    P.resolve = resolve;

    /**
    Returns a rejected promise.
    */
    function reject(err) {
        return defer().reject(err).promise();
    }
    P.reject = reject;

    /**
    http://en.wikipedia.org/wiki/Anamorphism
    
    Given a seed value, unfold calls the unspool function, waits for the returned promise to be resolved, and then
    calls it again if a next seed value was returned.
    
    All the values of all promise results are collected into the resulting promise which is resolved as soon
    the last generated element value is resolved.
    */
    function unfold(unspool, seed) {
        var d = defer();
        var elements = new Array();

        unfoldCore(elements, d, unspool, seed);

        return d.promise();
    }
    P.unfold = unfold;

    function unfoldCore(elements, deferred, unspool, seed) {
        var result = unspool(seed);
        if (!result) {
            deferred.resolve(elements);
            return;
        }

        while (result.next && result.promise.status == 2 /* Resolved */) {
            elements.push(result.promise.result);
            result = unspool(result.next);
            if (!result) {
                deferred.resolve(elements);
                return;
            }
        }

        result.promise.done(function (v) {
            elements.push(v);
            if (!result.next)
                deferred.resolve(elements);
            else
                unfoldCore(elements, deferred, unspool, result.next);
        }).fail(function (e) {
            deferred.reject(e);
        });
    }

    /**
    The status of a Promise. Initially a Promise is Unfulfilled and may
    change to Rejected or Resolved.
    
    Once a promise is either Rejected or Resolved, it can not change its
    status anymore.
    */
    (function (Status) {
        Status[Status["Unfulfilled"] = 0] = "Unfulfilled";
        Status[Status["Rejected"] = 1] = "Rejected";
        Status[Status["Resolved"] = 2] = "Resolved";
    })(P.Status || (P.Status = {}));
    var Status = P.Status;

    

    

    

    

    /**
    Creates a promise that gets resolved when all the promises in the argument list get resolved.
    As soon one of the arguments gets rejected, the resulting promise gets rejected.
    If no promises were provided, the resulting promise is immediately resolved.
    */
    function when() {
        var promises = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            promises[_i] = arguments[_i + 0];
        }
        var allDone = defer();
        if (!promises.length) {
            allDone.resolve([]);
            return allDone.promise();
        }

        var resolved = 0;
        var results = [];

        promises.forEach(function (p, i) {
            p.done(function (v) {
                results[i] = v;
                ++resolved;
                if (resolved === promises.length && allDone.status !== 1 /* Rejected */)
                    allDone.resolve(results);
            }).fail(function (e) {
                if (allDone.status !== 1 /* Rejected */)
                    allDone.reject(new Error("when: one or more promises were rejected"));
            });
        });

        return allDone.promise();
    }
    P.when = when;

    /**
    Implementation of a promise.
    
    The Promise<Value> instance is a proxy to the Deferred<Value> instance.
    */
    var PromiseI = (function () {
        function PromiseI(deferred) {
            this.deferred = deferred;
        }
        Object.defineProperty(PromiseI.prototype, "status", {
            get: function () {
                return this.deferred.status;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PromiseI.prototype, "result", {
            get: function () {
                return this.deferred.result;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PromiseI.prototype, "error", {
            get: function () {
                return this.deferred.error;
            },
            enumerable: true,
            configurable: true
        });

        PromiseI.prototype.done = function (f) {
            this.deferred.done(f);
            return this;
        };

        PromiseI.prototype.fail = function (f) {
            this.deferred.fail(f);
            return this;
        };

        PromiseI.prototype.always = function (f) {
            this.deferred.always(f);
            return this;
        };

        PromiseI.prototype.then = function (f) {
            return this.deferred.then(f);
        };
        return PromiseI;
    })();

    /**
    Implementation of a deferred.
    */
    var DeferredI = (function () {
        function DeferredI() {
            this._resolved = function (_) {
            };
            this._rejected = function (_) {
            };
            this._status = 0 /* Unfulfilled */;
            this._error = { message: "" };
            this._promise = new PromiseI(this);
        }
        DeferredI.prototype.promise = function () {
            return this._promise;
        };

        Object.defineProperty(DeferredI.prototype, "status", {
            get: function () {
                return this._status;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(DeferredI.prototype, "result", {
            get: function () {
                if (this._status != 2 /* Resolved */)
                    throw new Error("Promise: result not available");
                return this._result;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(DeferredI.prototype, "error", {
            get: function () {
                if (this._status != 1 /* Rejected */)
                    throw new Error("Promise: rejection reason not available");
                return this._error;
            },
            enumerable: true,
            configurable: true
        });

        DeferredI.prototype.then = function (f) {
            var d = defer();

            this.done(function (v) {
                var promiseOrValue = f(v);

                // todo: need to find another way to check if r is really of interface
                // type Promise<any>, otherwise we would not support other
                // implementations here.
                if (promiseOrValue instanceof PromiseI) {
                    var p = promiseOrValue;
                    p.done(function (v2) {
                        return d.resolve(v2);
                    }).fail(function (err) {
                        return d.reject(err);
                    });
                    return p;
                }

                d.resolve(promiseOrValue);
            }).fail(function (err) {
                return d.reject(err);
            });

            return d.promise();
        };

        DeferredI.prototype.done = function (f) {
            if (this.status === 2 /* Resolved */) {
                f(this._result);
                return this;
            }

            if (this.status !== 0 /* Unfulfilled */)
                return this;

            var prev = this._resolved;
            this._resolved = function (v) {
                prev(v);
                f(v);
            };

            return this;
        };

        DeferredI.prototype.fail = function (f) {
            if (this.status === 1 /* Rejected */) {
                f(this._error);
                return this;
            }

            if (this.status !== 0 /* Unfulfilled */)
                return this;

            var prev = this._rejected;
            this._rejected = function (e) {
                prev(e);
                f(e);
            };

            return this;
        };

        DeferredI.prototype.always = function (f) {
            this.done(function (v) {
                return f(v);
            }).fail(function (err) {
                return f(null, err);
            });

            return this;
        };

        DeferredI.prototype.resolve = function (result) {
            if (this._status !== 0 /* Unfulfilled */)
                throw new Error("tried to resolve a fulfilled promise");

            this._result = result;
            this._status = 2 /* Resolved */;
            this._resolved(result);

            this.detach();
            return this;
        };

        DeferredI.prototype.reject = function (err) {
            if (this._status !== 0 /* Unfulfilled */)
                throw new Error("tried to reject a fulfilled promise");

            this._error = err;
            this._status = 1 /* Rejected */;
            this._rejected(err);

            this.detach();
            return this;
        };

        DeferredI.prototype.detach = function () {
            this._resolved = function (_) {
            };
            this._rejected = function (_) {
            };
        };
        return DeferredI;
    })();

    

    function generator(g) {
        return function () {
            return iterator(g());
        };
    }
    P.generator = generator;
    ;

    function iterator(f) {
        return new IteratorI(f);
    }
    P.iterator = iterator;

    var IteratorI = (function () {
        function IteratorI(f) {
            this.f = f;
            this.current = undefined;
        }
        IteratorI.prototype.advance = function () {
            var _this = this;
            var res = this.f();
            return res.then(function (value) {
                if (isUndefined(value))
                    return false;

                _this.current = value;
                return true;
            });
        };
        return IteratorI;
    })();

    /**
    Iterator functions.
    */
    function each(gen, f) {
        var d = defer();
        eachCore(d, gen(), f);
        return d.promise();
    }
    P.each = each;

    function eachCore(fin, it, f) {
        it.advance().done(function (hasValue) {
            if (!hasValue) {
                fin.resolve({});
                return;
            }

            f(it.current);
            eachCore(fin, it, f);
        }).fail(function (err) {
            return fin.reject(err);
        });
    }

    /**
    std
    */
    function isUndefined(v) {
        return typeof v === 'undefined';
    }
    P.isUndefined = isUndefined;
})(P || (P = {}));
var Configurations;
(function (Configurations) {
    function runNode(mode) {
        try  {
            var agentLib = require('webkit-devtools-agent');
            var agent = new agentLib();
            agent.start(9999, 'localhost', 3333, true);
        } catch (e) {
        }

        var n = Math.random();

        var child_process = require('child_process');
        var audioProc = child_process.fork('./NodeAudioProcess.js');

        var wgl = require('./Node/node_modules/node-webgl-ovr');

        var basePath = 'Data/', savePath = 'classic';
        if (mode === 'xmas') {
            basePath = 'Data.XMas/';
            savePath = 'xmas';
        }

        var manager = new Managers.StreamManager(new Stores.LocalFileProvider(), basePath), shaderManager = new Managers.ShaderManager(manager);
        var managers = new Managers.ManagerSet(manager, shaderManager);
        managers.Sounds = new Managers.SoundManager(managers);
        managers.Settings = new Managers.SettingsManager(new Stores.FSStore(savePath));
        managers.Textures = new Managers.TextureManager(managers);
        managers.Canvas = new Drawing.NodeCanvasProvider();
        managers.Audio = new Sounds.ChildProcessAudioProvider(audioProc);
        managers.Graphics = new Shaders.VRShaderProvider();
        managers.SnapshotProvider = new Game.InterpolatingSnapshoptProvider();

        manager.loadMultiple([
            "Shaders/basic_2d.fs", "Shaders/basic_2d.vs", 'Shaders/title_2d.fs', 'Shaders/title_2d.vs', 'Shaders/color_3d.vs', 'Shaders/color_3d.fs',
            'Shaders/texture_p3d.vs', 'Shaders/texture_p3d.fs', 'Shaders/sprite_3d.vs', 'Shaders/sprite_3d.fs',
            "Data/SKYROADS.EXE",
            "Data/ANIM.LZS",
            "Data/CARS.LZS",
            "Data/DASHBRD.LZS",
            "Data/DEMO.REC",
            "Data/FUL_DISP.DAT",
            "Data/GOMENU.LZS",
            "Data/HELPMENU.LZS",
            "Data/INTRO.LZS",
            "Data/INTRO.SND",
            "Data/MAINMENU.LZS",
            "Data/MUZAX.LZS",
            "Data/OXY_DISP.DAT",
            "Data/ROADS.LZS",
            "Data/SETMENU.LZS",
            "Data/SFX.SND",
            "Data/SPEED.DAT",
            "Data/TREKDAT.LZS",
            "Data/WORLD0.LZS",
            "Data/WORLD1.LZS",
            "Data/WORLD2.LZS",
            "Data/WORLD3.LZS",
            "Data/WORLD4.LZS",
            "Data/WORLD5.LZS",
            "Data/WORLD6.LZS",
            "Data/WORLD7.LZS",
            "Data/WORLD8.LZS",
            "Data/WORLD9.LZS"
        ]).done(function () {
            var exe = new ExeData.ExeDataLoader(managers);
            exe.load();

            var doc = wgl.document();
            var cvs = doc.createElement('canvas', 1280, 800, true);
            cvs.setTitle('SkyRoads VR');

            var controls = new Controls.CombinedControlSource();
            controls.addSource(new Controls.KeyboardControlsource(new Engine.KeyboardManager(doc)));
            controls.addSource(new Controls.JoystickControlSource(new Controls.GLFWJoystick(doc)));
            managers.Controls = controls;

            managers.VR = new VR.NodeVRProvider(doc);
            managers.VR.enable();

            var state = new States.Intro(managers);

            //var state = new States.GoMenu(managers);
            //var state = new States.MainMenu(managers);
            //var state = new States.GameState(managers, 0, new Game.DemoController(managers.Streams.getRawArray('DEMO.REC')));
            managers.Frames = new Engine.FrameManager(new Engine.NodeDocumentProvider(doc, cvs), cvs, managers, state, new Engine.Clock());
        });
    }
    Configurations.runNode = runNode;
})(Configurations || (Configurations = {}));
var Configurations;
(function (Configurations) {
    function runNodeAudio() {
        var manager = new Managers.StreamManager(new Stores.LocalFileProvider(), 'Data/');
        var managers = new Managers.ManagerSet(manager, null);

        manager.loadMultiple(['Data/MUZAX.LZS']).done(function () {
            var audioProvider = new Sounds.PortAudioAudioProvider();
            var opl = new Music.OPL(audioProvider);
            var player = new Music.Player(opl, managers);
            opl.setSource(player);

            var server = new Sounds.ChildProcessAudioServer(audioProvider, player);
        });
    }
    Configurations.runNodeAudio = runNodeAudio;
})(Configurations || (Configurations = {}));

if (typeof exports !== 'undefined') {
    exports.Configurations = {
        runNode: Configurations.runNode,
        runNodeAudio: Configurations.runNodeAudio
    };
}
var Controls;
(function (Controls) {
    var CombinedControlSource = (function () {
        function CombinedControlSource() {
            this.sources = [];
        }
        CombinedControlSource.prototype.addSource = function (src) {
            this.sources.push(src);
        };

        CombinedControlSource.prototype.foldVal = function (gvFunc) {
            var val = null;
            for (var i = 0; i < this.sources.length; i++) {
                val = val || gvFunc(this.sources[i]);
            }
            return val;
        };

        CombinedControlSource.prototype.update = function () {
            for (var i = 0; i < this.sources.length; i++) {
                this.sources[i].update();
            }
        };

        CombinedControlSource.prototype.getTurnAmount = function () {
            return this.foldVal(function (src) {
                return src.getTurnAmount();
            });
        };

        CombinedControlSource.prototype.getAccelAmount = function () {
            return this.foldVal(function (src) {
                return src.getAccelAmount();
            });
        };

        CombinedControlSource.prototype.getJump = function () {
            return this.foldVal(function (src) {
                return src.getJump();
            });
        };

        CombinedControlSource.prototype.getLeft = function () {
            return this.foldVal(function (src) {
                return src.getLeft();
            });
        };

        CombinedControlSource.prototype.getRight = function () {
            return this.foldVal(function (src) {
                return src.getRight();
            });
        };

        CombinedControlSource.prototype.getUp = function () {
            return this.foldVal(function (src) {
                return src.getUp();
            });
        };

        CombinedControlSource.prototype.getDown = function () {
            return this.foldVal(function (src) {
                return src.getDown();
            });
        };

        CombinedControlSource.prototype.getEnter = function () {
            return this.foldVal(function (src) {
                return src.getEnter();
            });
        };

        CombinedControlSource.prototype.getExit = function () {
            return this.foldVal(function (src) {
                return src.getExit();
            });
        };

        CombinedControlSource.prototype.getResetOrientation = function () {
            return this.foldVal(function (src) {
                return src.getResetOrientation();
            });
        };
        return CombinedControlSource;
    })();
    Controls.CombinedControlSource = CombinedControlSource;
})(Controls || (Controls = {}));
var Controls;
(function (Controls) {
    var ConditionWatcher = (function () {
        function ConditionWatcher(cond, cb) {
            this.enabled = false;
            this.repeating = true;
            this.heldTime = 0;
            this.repeatWait = 0.5;
            this.repeatRate = 0.1;
            this.condition = cond;
            this.cb = cb;
        }
        ConditionWatcher.prototype.update = function (time) {
            if (this.condition()) {
                if (!this.enabled) {
                    this.enabled = true;
                    this.repeating = false;
                    this.heldTime = 0;
                    this.cb();
                } else {
                    this.heldTime += time.getPhysicsStep();
                    var interval = this.repeating ? this.repeatRate : this.repeatWait;

                    if (this.heldTime >= interval) {
                        this.heldTime -= interval;
                        this.cb();
                        this.repeating = true;
                    }
                }
            } else {
                this.enabled = false;
            }
        };
        return ConditionWatcher;
    })();
    Controls.ConditionWatcher = ConditionWatcher;
})(Controls || (Controls = {}));
var Controls;
(function (Controls) {
    var GLFWJoystick = (function () {
        function GLFWJoystick(glfw) {
            this.glfw = glfw;
        }
        GLFWJoystick.prototype.update = function () {
            this.buttons = this.glfw.getJoystickButtons().split(',').map(function (b) {
                return b === "1";
            });

            this.axis = this.glfw.getJoystickAxes().split(',').map(function (b) {
                return parseFloat(b);
            });
        };

        GLFWJoystick.prototype.getButton = function (n) {
            return n < this.buttons.length ? this.buttons[n] : false;
        };

        GLFWJoystick.prototype.getAxis = function (n) {
            return n < this.axis.length ? this.axis[n] : 0.0;
        };

        GLFWJoystick.prototype.getTurnChannels = function () {
            return [0, 4];
        };
        GLFWJoystick.prototype.getLeftButtons = function () {
            return [4, 13];
        };
        GLFWJoystick.prototype.getRightButtons = function () {
            return [5, 11];
        };

        GLFWJoystick.prototype.getAccelChannels = function () {
            return [1, 2, 3];
        };
        GLFWJoystick.prototype.getFasterButtons = function () {
            return [10];
        };
        GLFWJoystick.prototype.getSlowerButtons = function () {
            return [12];
        };

        GLFWJoystick.prototype.getJumpButtons = function () {
            return [0];
        };
        GLFWJoystick.prototype.getEnterButtons = function () {
            return [0, 7];
        };

        GLFWJoystick.prototype.getExitButtons = function () {
            return [1, 6];
        };

        GLFWJoystick.prototype.getResetOrientationButtons = function () {
            return [2];
        };
        return GLFWJoystick;
    })();
    Controls.GLFWJoystick = GLFWJoystick;
})(Controls || (Controls = {}));
var Controls;
(function (Controls) {
    var JoystickControlSource = (function () {
        function JoystickControlSource(stick) {
            this.deadZone = 0.3;
            this.joystick = stick;
        }
        JoystickControlSource.prototype.channelWithDeadZone = function (n) {
            var v = this.joystick.getAxis(n);
            if (Math.abs(v) < this.deadZone) {
                return 0.0;
            } else {
                return v;
            }
        };

        JoystickControlSource.prototype.buttonAsChannel = function (n, v) {
            return this.joystick.getButton(n) ? v : 0.0;
        };

        JoystickControlSource.prototype.largest = function (ns) {
            var v = 0.0;
            for (var i = 0; i < ns.length; i++) {
                if (Math.abs(ns[i]) > Math.abs(v)) {
                    v = ns[i];
                }
            }

            return v;
        };

        JoystickControlSource.prototype.getValuesFromChannelsAndButtons = function (channels, buttonsNeg, buttonsPos) {
            var values = [];
            for (var i = 0; i < channels.length; i++) {
                values.push(this.channelWithDeadZone(channels[i]));
            }
            for (var i = 0; i < buttonsNeg.length; i++) {
                values.push(this.buttonAsChannel(buttonsNeg[i], -1));
            }
            for (var i = 0; i < buttonsPos.length; i++) {
                values.push(this.buttonAsChannel(buttonsPos[i], 1));
            }
            return this.largest(values);
        };

        JoystickControlSource.prototype.update = function () {
            this.joystick.update();
        };

        JoystickControlSource.prototype.getTurnAmount = function () {
            return this.getValuesFromChannelsAndButtons(this.joystick.getTurnChannels(), this.joystick.getLeftButtons(), this.joystick.getRightButtons());
        };

        JoystickControlSource.prototype.getAccelAmount = function () {
            return -this.getValuesFromChannelsAndButtons(this.joystick.getAccelChannels(), this.joystick.getFasterButtons(), this.joystick.getSlowerButtons());
        };

        JoystickControlSource.prototype.getJump = function () {
            return this.getValuesFromChannelsAndButtons([], [], this.joystick.getJumpButtons()) > 0.5;
        };

        JoystickControlSource.prototype.getLeft = function () {
            return this.getTurnAmount() < -0.5;
        };

        JoystickControlSource.prototype.getRight = function () {
            return this.getTurnAmount() > 0.5;
        };

        JoystickControlSource.prototype.getUp = function () {
            return this.getAccelAmount() > 0.5;
        };

        JoystickControlSource.prototype.getDown = function () {
            return this.getAccelAmount() < -0.5;
        };

        JoystickControlSource.prototype.getEnter = function () {
            return this.getValuesFromChannelsAndButtons([], [], this.joystick.getEnterButtons()) > 0.5;
        };

        JoystickControlSource.prototype.getExit = function () {
            return this.getValuesFromChannelsAndButtons([], [], this.joystick.getExitButtons()) > 0.5;
        };

        JoystickControlSource.prototype.getResetOrientation = function () {
            return this.getValuesFromChannelsAndButtons([], [], this.joystick.getResetOrientationButtons()) > 0.5;
        };
        return JoystickControlSource;
    })();
    Controls.JoystickControlSource = JoystickControlSource;
})(Controls || (Controls = {}));
var Controls;
(function (Controls) {
    var KeyboardControlsource = (function () {
        function KeyboardControlsource(kbd) {
            this.kbd = kbd;
        }
        KeyboardControlsource.prototype.update = function () {
        };

        KeyboardControlsource.prototype.getTurnAmount = function () {
            if (this.getLeft()) {
                return -1;
            } else if (this.getRight()) {
                return 1;
            } else {
                return 0;
            }
        };

        KeyboardControlsource.prototype.getAccelAmount = function () {
            if (this.getUp()) {
                return 1;
            } else if (this.getDown()) {
                return -1;
            } else {
                return 0;
            }
        };

        KeyboardControlsource.prototype.getJump = function () {
            return this.kbd.isDown(32);
        };

        KeyboardControlsource.prototype.getLeft = function () {
            return this.kbd.isDown(37) || this.kbd.isDown(65);
        };

        KeyboardControlsource.prototype.getRight = function () {
            return this.kbd.isDown(39) || this.kbd.isDown(68);
        };
        KeyboardControlsource.prototype.getUp = function () {
            return this.kbd.isDown(38) || this.kbd.isDown(87);
        };

        KeyboardControlsource.prototype.getDown = function () {
            return this.kbd.isDown(40) || this.kbd.isDown(83);
        };

        KeyboardControlsource.prototype.getEnter = function () {
            return this.kbd.isDown(32) || this.kbd.isDown(13);
        };

        KeyboardControlsource.prototype.getExit = function () {
            return this.kbd.isDown(27);
        };

        KeyboardControlsource.prototype.getResetOrientation = function () {
            return this.kbd.isDown(82);
        };
        return KeyboardControlsource;
    })();
    Controls.KeyboardControlsource = KeyboardControlsource;
})(Controls || (Controls = {}));
var Controls;
(function (Controls) {
    var NavigatorJoystick = (function () {
        function NavigatorJoystick(provider) {
            this.gamepad = null;
            this.provider = provider;
        }
        NavigatorJoystick.prototype.update = function () {
            var pads = this.provider.getGamepads ? this.provider.getGamepads() : [];
            if (pads.length > 0 && pads[0]) {
                this.gamepad = pads[0];
            } else {
                this.gamepad = null;
            }
        };

        NavigatorJoystick.prototype.getButton = function (n) {
            return this.gamepad !== null && n < this.gamepad.buttons.length ? this.gamepad.buttons[n].pressed : false;
        };

        NavigatorJoystick.prototype.getAxis = function (n) {
            return this.gamepad !== null && n < this.gamepad.axes.length ? this.gamepad.axes[n] : 0;
        };

        NavigatorJoystick.prototype.getTurnChannels = function () {
            return [0, 2];
        };

        NavigatorJoystick.prototype.getLeftButtons = function () {
            return [4, 14];
        };

        NavigatorJoystick.prototype.getRightButtons = function () {
            return [5, 15];
        };

        NavigatorJoystick.prototype.getAccelChannels = function () {
            return [1, 3];
        };

        NavigatorJoystick.prototype.getFasterButtons = function () {
            return [7, 12];
        };

        NavigatorJoystick.prototype.getSlowerButtons = function () {
            return [6, 13];
        };

        NavigatorJoystick.prototype.getJumpButtons = function () {
            return [0];
        };

        NavigatorJoystick.prototype.getEnterButtons = function () {
            return [0, 9];
        };

        NavigatorJoystick.prototype.getExitButtons = function () {
            return [1, 8];
        };

        NavigatorJoystick.prototype.getResetOrientationButtons = function () {
            return [2];
        };
        return NavigatorJoystick;
    })();
    Controls.NavigatorJoystick = NavigatorJoystick;
})(Controls || (Controls = {}));
/// <reference path="BitStream.ts" />
var Data;
(function (Data) {
    var ArrayBitStream = (function () {
        function ArrayBitStream(data) {
            this.data = data;
            this.idx = 0;
        }
        ArrayBitStream.prototype.getBit = function () {
            var idx = this.idx;
            this.idx++;

            var byteIdx = Math.floor(idx / 8), bitIdx = 7 - (idx % 8);

            return (this.data[byteIdx] & (1 << bitIdx)) >> bitIdx;
        };

        ArrayBitStream.prototype.setPosition = function (idx) {
            this.idx = idx;
        };

        ArrayBitStream.prototype.getPosition = function () {
            return this.idx;
        };

        ArrayBitStream.prototype.eof = function () {
            return this.idx >= (this.data.length * 8);
        };

        ArrayBitStream.prototype.getLength = function () {
            return this.data.length * 8;
        };
        return ArrayBitStream;
    })();
    Data.ArrayBitStream = ArrayBitStream;
})(Data || (Data = {}));
/// <reference path="BitStream.ts"  />
var Data;
(function (Data) {
    var BinaryReader = (function () {
        function BinaryReader(stream) {
            this.stream = stream;
        }
        BinaryReader.prototype.getBit = function () {
            return this.stream.getBit();
        };

        BinaryReader.prototype.getBits = function (n) {
            var byte = 0;
            for (var i = 0; i < n; i++) {
                byte |= this.getBit() * (1 << (n - i - 1));
            }
            return byte;
        };

        BinaryReader.prototype.getUint8 = function () {
            return this.getBits(8);
        };

        BinaryReader.prototype.getUint16 = function () {
            return this.getUint8() | (this.getUint8() << 8);
        };

        BinaryReader.prototype.getUint32 = function () {
            return this.getUint16() | (this.getUint16() << 16);
        };

        BinaryReader.prototype.getFixedLengthString = function (len) {
            var s = '';
            for (var i = 0; i < len; i++) {
                s += String.fromCharCode(this.getUint8());
            }
            return s;
        };

        BinaryReader.prototype.eof = function () {
            return this.stream.eof();
        };
        return BinaryReader;
    })();
    Data.BinaryReader = BinaryReader;
})(Data || (Data = {}));
var Data;
(function (Data) {
    var Color = (function () {
        function Color(r, g, b) {
            this.R = r;
            this.G = g;
            this.B = b;
        }
        Color.prototype.negative = function () {
            return new Color(255 - this.R, 255 - this.G, 255 - this.B);
        };

        Color.prototype.scale = function (n) {
            return new Color(Math.floor(this.R * n), Math.floor(this.G * n), Math.floor(this.B * n));
        };

        Color.prototype.toCss = function () {
            return 'rgb(' + this.R + ',' + this.G + ',' + this.B + ')';
        };

        Color.prototype.toVec3 = function () {
            return new TSM.vec3([this.R / 255.0, this.G / 255.0, this.B / 255.0]);
        };

        Color.prototype.equals = function (b) {
            return this.R === b.R && this.G === b.G && this.B === b.B;
        };
        return Color;
    })();
    Data.Color = Color;
})(Data || (Data = {}));
/// <reference path="BitStream.ts" />
/// <reference path="ArrayBitStream.ts" />
var Data;
(function (Data) {
    var CompressedByteStream = (function () {
        function CompressedByteStream(stream) {
            this.buffer = [];
            this.source = stream;
            this.len1 = this.source.getUint8();
            this.len2 = this.source.getUint8();
            this.len3 = this.source.getUint8();
            this.len4 = (1 << this.len2);
            this.outputStream = new Data.ArrayBitStream(this.buffer);
        }
        CompressedByteStream.prototype.copySet = function (offset) {
            var copyStart = this.buffer.length - 2 - offset;
            var bytesToCopy = this.source.getBits(this.len1) + 1;
            for (var i = 0; i <= bytesToCopy; i++) {
                this.buffer.push(this.buffer[copyStart + i]);
            }
        };

        CompressedByteStream.prototype.advanceBuffer = function () {
            if (this.source.getBit() == 1) {
                if (this.source.getBit() == 1) {
                    this.buffer.push(this.source.getUint8());
                } else {
                    var copySize = this.source.getBits(this.len3) + this.len4;
                    this.copySet(copySize);
                }
            } else {
                var copySize = this.source.getBits(this.len2);
                this.copySet(copySize);
            }
        };

        CompressedByteStream.prototype.getBit = function () {
            if (this.outputStream.eof()) {
                this.advanceBuffer();
            }
            return this.outputStream.getBit();
        };

        CompressedByteStream.prototype.eof = function () {
            return this.source.eof();
        };
        return CompressedByteStream;
    })();
    Data.CompressedByteStream = CompressedByteStream;
})(Data || (Data = {}));
var Drawing;
(function (Drawing) {
    ;
})(Drawing || (Drawing = {}));
var Drawing;
(function (Drawing) {
    var HTMLCanvasProvider = (function () {
        function HTMLCanvasProvider() {
        }
        HTMLCanvasProvider.prototype.getCanvas = function () {
            return document.createElement('canvas');
        };
        return HTMLCanvasProvider;
    })();
    Drawing.HTMLCanvasProvider = HTMLCanvasProvider;
})(Drawing || (Drawing = {}));
var WGL;
(function (WGL) {
    var GLState = (function () {
        function GLState(gl) {
            this.EnableBlend = false;
            this.EnableDepthTest = false;
            this.BlendSrc = 0;
            this.BlendDst = 0;
            this.BlendSrc = gl.SRC_ALPHA;
            this.BlendDst = gl.ONE_MINUS_SRC_ALPHA;
        }
        return GLState;
    })();
    WGL.GLState = GLState;

    var Renderable = (function () {
        function Renderable(gl, glState, vertexDescriptor, shader, buffer) {
            this.gl = gl;
            this.State = glState;
            this.vertex = vertexDescriptor;
            this.shader = shader;
            this.buffer = buffer;
        }
        Renderable.prototype.configureState = function (state) {
            var gl = this.gl;
            if (state.EnableBlend) {
                gl.enable(gl.BLEND);
            } else {
                gl.disable(gl.BLEND);
            }
            gl.blendFunc(state.BlendSrc, state.BlendDst);

            if (state.EnableDepthTest) {
                gl.enable(gl.DEPTH_TEST);
            } else {
                gl.disable(gl.DEPTH_TEST);
            }
        };

        Renderable.prototype.preDraw = function (gl, shader) {
        };

        Renderable.prototype.postDraw = function (gl, shader) {
        };

        Renderable.prototype.draw = function () {
            this.buffer.bind();
            this.shader.use();
            this.vertex.enableAndConfigureVertexAttributes(this.shader);
            this.configureState(this.State);
            this.preDraw(this.gl, this.shader);
            this.vertex.drawContiguous(this.gl, this.buffer);
            this.postDraw(this.gl, this.shader);
            this.vertex.disableVertexAttributes(this.shader);
        };
        return Renderable;
    })();
    WGL.Renderable = Renderable;
})(WGL || (WGL = {}));
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../WGL/Renderable.ts" />
var Drawing;
(function (Drawing) {
    var Mesh = (function (_super) {
        __extends(Mesh, _super);
        function Mesh(gl, managers, vertices, shader) {
            if (typeof shader === "undefined") { shader = null; }
            this.Scale = 1.0;
            this.ModelMatrix = TSM.mat4.identity.copy();
            this.ViewMatrix = TSM.mat4.identity.copy();
            this.ProjectionMatrix = TSM.mat4.perspective(80.0, 320.0 / 200.0, 0.1, 1000.0);
            this.Texture = managers.Textures.getTexture(gl, 'WHITE').Texture;

            shader = shader || managers.Shaders.getShader(gl, managers.Shaders.Shaders.Color3D);
            var vertDesc = Vertices.Vertex3DC.getDescriptor(gl);

            var state = new WGL.GLState(gl);
            state.EnableBlend = false;
            state.EnableDepthTest = true;

            var buffer = new WGL.Buffer(gl);
            buffer.loadData(vertDesc.buildArray(vertices));

            this.uModelMatrix = shader.getUniform("uModelMatrix");
            this.uViewMatrix = shader.getUniform("uViewMatrix");
            this.uProjectionMatrix = shader.getUniform("uProjectionMatrix");
            this.uScale = shader.getUniform("uScale");
            this.uSampler = shader.getUniform("uSampler");

            _super.call(this, gl, state, vertDesc, shader, buffer);
        }
        Mesh.prototype.preDraw = function (gl, shader) {
            if (this.uProjectionMatrix !== null) {
                this.uProjectionMatrix.setMat4(this.ProjectionMatrix);
            }
            if (this.uModelMatrix !== null) {
                this.uModelMatrix.setMat4(this.ModelMatrix);
            }
            if (this.uViewMatrix !== null) {
                this.uViewMatrix.setMat4(this.ViewMatrix);
            }
            if (this.uSampler !== null && this.Texture !== null) {
                this.Texture.attachToUniform(this.uSampler);
            }
            if (this.uScale !== null) {
                this.uScale.set1f(this.Scale);
            }
        };

        Mesh.prototype.postDraw = function (gl, shader) {
            if (this.uSampler !== null && this.Texture !== null) {
                this.Texture.detachFromUniform();
            }
        };
        return Mesh;
    })(WGL.Renderable);
    Drawing.Mesh = Mesh;
})(Drawing || (Drawing = {}));
var Drawing;
(function (Drawing) {
    var canvas = null;
    if (typeof document === 'undefined' && typeof require !== 'undefined') {
        canvas = require('./Node/node_modules/node-canvas');
    }

    var NodeCanvasProvider = (function () {
        function NodeCanvasProvider() {
        }
        NodeCanvasProvider.prototype.getCanvas = function () {
            return new canvas(1, 1);
        };
        return NodeCanvasProvider;
    })();
    Drawing.NodeCanvasProvider = NodeCanvasProvider;
})(Drawing || (Drawing = {}));
/// <reference path="../WGL/Renderable.ts" />
var Drawing;
(function (Drawing) {
    var Sprite = (function (_super) {
        __extends(Sprite, _super);
        function Sprite(gl, managers, texture, shader) {
            if (typeof shader === "undefined") { shader = null; }
            this.ModelMatrix = TSM.mat4.identity.copy();
            this.ViewMatrix = TSM.mat4.identity.copy();
            this.ProjectionMatrix = TSM.mat4.perspective(80.0, 320.0 / 200.0, 0.1, 1000.0);

            this.Texture = texture.Texture;
            this.Position = new TSM.vec3([texture.XOffset, texture.YOffset, 0.0]);
            this.Size = new TSM.vec2([texture.Width, texture.Height]);
            this.Alpha = 1.0;
            this.Brightness = 1.0;
            this.ULow = new TSM.vec2([0.0, 0.0]);
            this.UHigh = new TSM.vec2([1.0, 0.0]);
            this.VLow = new TSM.vec2([0.0, 0.0]);
            this.VHigh = new TSM.vec2([0.0, 1.0]);

            shader = shader || managers.Shaders.getShader(gl, managers.Shaders.Shaders.Basic2D);
            var vertDesc = Vertices.Vertex2D.getDescriptor(gl);
            var vertices = [
                new Vertices.Vertex2D(0.0, 0.0),
                new Vertices.Vertex2D(1.0, 0.0),
                new Vertices.Vertex2D(1.0, 1.0),
                new Vertices.Vertex2D(1.0, 1.0),
                new Vertices.Vertex2D(0.0, 1.0),
                new Vertices.Vertex2D(0.0, 0.0)
            ];

            var state = new WGL.GLState(gl);
            state.EnableBlend = true;

            var buffer = new WGL.Buffer(gl);
            buffer.loadData(vertDesc.buildArray(vertices));

            this.uSampler = shader.getUniform("uSampler");
            this.uPos = shader.getUniform("uPos");
            this.uSize = shader.getUniform("uSize");
            this.uAlpha = shader.getUniform("uAlpha");
            this.uBrightness = shader.getUniform("uBrightness");
            this.uULow = shader.getUniform("uLow");
            this.uVLow = shader.getUniform("vLow");
            this.uUHigh = shader.getUniform("uHigh");
            this.uVHigh = shader.getUniform("vHigh");

            this.uModelMatrix = shader.getUniform("uModelMatrix");
            this.uViewMatrix = shader.getUniform("uViewMatrix");
            this.uProjectionMatrix = shader.getUniform("uProjectionMatrix");

            _super.call(this, gl, state, vertDesc, shader, buffer);
        }
        Sprite.prototype.preDraw = function (gl, shader) {
            this.Texture.attachToUniform(this.uSampler);
            this.uPos.setVec3(this.Position);
            this.uSize.setVec2(this.Size);
            this.uBrightness.set1f(this.Brightness);
            this.uAlpha.set1f(this.Alpha);
            this.uULow.setVec2(this.ULow);
            this.uVLow.setVec2(this.VLow);
            this.uUHigh.setVec2(this.UHigh);
            this.uVHigh.setVec2(this.VHigh);

            if (this.uProjectionMatrix !== null) {
                this.uProjectionMatrix.setMat4(this.ProjectionMatrix);
            }
            if (this.uModelMatrix !== null) {
                this.uModelMatrix.setMat4(this.ModelMatrix);
            }
            if (this.uViewMatrix !== null) {
                this.uViewMatrix.setMat4(this.ViewMatrix);
            }
        };

        Sprite.prototype.postDraw = function (gl, shader) {
            this.Texture.detachFromUniform();
        };
        return Sprite;
    })(WGL.Renderable);
    Drawing.Sprite = Sprite;
})(Drawing || (Drawing = {}));
var Drawing;
(function (Drawing) {
    var TextHelper = (function () {
        function TextHelper(managers) {
            this.managers = managers;
        }
        TextHelper.prototype.getSpriteFromText = function (gl, managers, text, font, height) {
            var cvs = managers.Canvas.getCanvas();
            var ctx = cvs.getContext('2d');
            cvs.width = 600;
            cvs.height = 600;
            ctx.font = font;
            var size = ctx.measureText(text);
            cvs.width = size.width + 1;
            cvs.height = height;
            ctx.fillStyle = '#FFFFFF';
            ctx.textBaseline = 'middle';
            ctx.font = font;
            ctx.fillText(text, 0.5, cvs.height / 2 + 0.5);

            var tex = new WGL.Texture(gl);
            tex.setFilters(gl.NEAREST, gl.NEAREST);
            tex.loadData(cvs);

            var tf = new Drawing.TextureFragment(tex, 0, 0, cvs.width, cvs.height);

            return managers.Graphics.get3DSprite(gl, managers, tf);
        };
        return TextHelper;
    })();
    Drawing.TextHelper = TextHelper;
})(Drawing || (Drawing = {}));
var Drawing;
(function (Drawing) {
    var TextureFragment = (function () {
        function TextureFragment(tex, x, y, w, h) {
            this.Texture = tex;
            this.XOffset = x;
            this.YOffset = y;
            this.Width = w;
            this.Height = h;
        }
        return TextureFragment;
    })();
    Drawing.TextureFragment = TextureFragment;
})(Drawing || (Drawing = {}));
var Engine;
(function (Engine) {
    var BrowserDocumentProvider = (function () {
        function BrowserDocumentProvider() {
        }
        BrowserDocumentProvider.prototype.getSize = function () {
            return new TSM.vec2([document.body.clientWidth, document.body.clientHeight]);
        };

        BrowserDocumentProvider.prototype.setResizeCb = function (cb) {
            var _this = this;
            window.onresize = function () {
                cb(_this.getSize());
            };
        };

        BrowserDocumentProvider.prototype.requestAnimationFrame = function (cb) {
            requestAnimationFrame(cb);
        };
        return BrowserDocumentProvider;
    })();
    Engine.BrowserDocumentProvider = BrowserDocumentProvider;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var CameraState = (function () {
        function CameraState(headPosition, headOrientation, eyeOffset, projectionMatrix) {
            this.HeadPosition = headPosition;
            this.HeadOrientation = headOrientation;
            this.EyeOffset = eyeOffset;
            this.ProjectionMatrix = projectionMatrix;
        }
        return CameraState;
    })();
    Engine.CameraState = CameraState;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var ClassicState2DDrawer = (function () {
        function ClassicState2DDrawer() {
        }
        ClassicState2DDrawer.prototype.draw = function (gl, canvas, frameManager, frameTimeInfo, cam, state) {
            var helper = new States.ClassicGLStateHelper();
            helper.startFrame(gl, canvas);
            state.drawFrame2D(gl, canvas, frameManager, frameTimeInfo, cam);
        };
        return ClassicState2DDrawer;
    })();
    Engine.ClassicState2DDrawer = ClassicState2DDrawer;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var ClassicState3DDrawer = (function () {
        function ClassicState3DDrawer() {
        }
        ClassicState3DDrawer.prototype.draw = function (gl, canvas, frameManager, frameTimeInfo, cam, state) {
            var helper = new States.ClassicGLStateHelper();
            helper.startFrame(gl, canvas);
            state.drawFrame3D(gl, canvas, frameManager, frameTimeInfo, cam);
        };
        return ClassicState3DDrawer;
    })();
    Engine.ClassicState3DDrawer = ClassicState3DDrawer;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var FrameTimeInfo = (function () {
        function FrameTimeInfo(frameTime) {
            this.frameTime = frameTime;
        }
        FrameTimeInfo.prototype.getPhysicsStep = function () {
            return 1.0 / 30.0;
        };

        FrameTimeInfo.prototype.getFPS = function () {
            return 30.0;
        };

        FrameTimeInfo.prototype.getFrameTime = function () {
            return this.frameTime;
        };
        return FrameTimeInfo;
    })();
    Engine.FrameTimeInfo = FrameTimeInfo;

    var Clock = (function () {
        function Clock() {
            this.lastTime = Date.now();
        }
        Clock.prototype.nextFrame = function () {
            var newTime = Date.now();
            var duration = (newTime - this.lastTime) / 1000.0;
            this.lastTime = newTime;

            return new FrameTimeInfo(duration);
        };
        return Clock;
    })();
    Engine.Clock = Clock;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var FrameManager = (function () {
        function FrameManager(documentProvider, canvas, managers, gs, clock) {
            var _this = this;
            this.physicsTime = 0;
            this.states = [];
            this.fps = 0;
            this.timeLast = Date.now();
            this.lastWidth = 0;
            this.lastHeight = 0;
            this.frame = 0;
            this.hasRunPhysics = false;
            this.document = documentProvider;
            this.canvas = canvas;
            this.ctx = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            var preloader = new Images.Preloader();
            preloader.preloadData(this.ctx, managers);

            this.addState(gs);

            this.clock = clock;
            this.document.setResizeCb(function (sz) {
                return _this.maintainCanvasSize(sz);
            });

            this.maintainCanvasSize(this.document.getSize());
            this.managers = managers;
            documentProvider.requestAnimationFrame(function () {
                return _this.onFrame();
            });
        }
        FrameManager.prototype.getCanvas = function () {
            return this.canvas;
        };

        FrameManager.prototype.addState = function (gs) {
            this.states.push(gs);
            this.hasRunPhysics = false;
            gs.load(this.ctx);
        };

        FrameManager.prototype.maintainCanvasSize = function (sz) {
            if (sz !== null) {
                this.canvas.width = sz.x;
                this.canvas.height = sz.y;
            }

            var bw = this.canvas.width, bh = this.canvas.height;
            if (bw !== this.lastWidth || bh !== this.lastHeight) {
                this.canvas.width = bw;
                this.canvas.height = bh;
                this.lastWidth = bw;
                this.lastHeight = bh;
            }
        };

        FrameManager.prototype.onFrame = function () {
            var _this = this;
            var gs = this.states[this.states.length - 1];

            this.managers.Controls.update();
            var time = this.clock.nextFrame();
            var physStep = time.getPhysicsStep();
            this.physicsTime += time.getFrameTime();

            if (this.managers.Controls.getResetOrientation() && this.managers.VR !== null) {
                this.managers.VR.resetOrientation();
            }

            if (this.frame % 30 === 0) {
                this.managers.Audio.setGain(this.managers.Settings.getMuted() ? 0.0 : this.managers.Settings.getVolume());
            }
            this.frame++;

            if (this.physicsTime >= physStep * 3) {
                this.physicsTime = physStep;
            }

            if (this.physicsTime < physStep && !this.hasRunPhysics) {
                this.physicsTime = physStep;
            }
            this.hasRunPhysics = true;

            while (this.physicsTime >= physStep && this.states[this.states.length - 1] === gs) {
                gs.updatePhysics(this, time);
                this.physicsTime -= physStep;
            }

            if (this.states[this.states.length - 1] === gs) {
                gs.drawFrame(this.ctx, this.canvas, this, time, new Engine.CameraState(new TSM.vec3(), new TSM.quat(), new TSM.vec3(), new TSM.mat4()));
            }

            this.fps++;
            var n = Date.now();
            if (n - this.timeLast > 1000.0) {
                console.log('FPS: ' + this.fps);
                this.fps = 0;
                this.timeLast = n;
            }
            this.document.requestAnimationFrame(function () {
                return _this.onFrame();
            });
        };

        FrameManager.prototype.popState = function () {
            this.hasRunPhysics = false;
            this.states[this.states.length - 1].unload();
            this.states.pop();
        };
        return FrameManager;
    })();
    Engine.FrameManager = FrameManager;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var KeyboardManager = (function () {
        function KeyboardManager(element) {
            var _this = this;
            this.keys = [];
            for (var i = 0; i < 256; i++) {
                this.keys.push(false);
            }

            element.onkeydown = function (evt) {
                return _this.onDown(evt);
            };
            element.onkeyup = function (evt) {
                return _this.onUp(evt);
            };
        }
        KeyboardManager.prototype.isDown = function (n) {
            return this.keys[n];
        };

        KeyboardManager.prototype.onDown = function (evt) {
            this.keys[evt.keyCode] = true;
        };

        KeyboardManager.prototype.onUp = function (evt) {
            this.keys[evt.keyCode] = false;
        };
        return KeyboardManager;
    })();
    Engine.KeyboardManager = KeyboardManager;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var NodeDocumentProvider = (function () {
        function NodeDocumentProvider(doc, cvs) {
            this.doc = doc;
            this.cvs = cvs;
        }
        NodeDocumentProvider.prototype.getSize = function () {
            return new TSM.vec2([this.cvs.width, this.cvs.height]);
        };

        NodeDocumentProvider.prototype.setResizeCb = function (cb) {
            this.cvs.onresize = function (evt) {
                cb(new TSM.vec2([evt.width, evt.height]));
            };
        };

        NodeDocumentProvider.prototype.requestAnimationFrame = function (cb) {
            this.doc.requestAnimationFrame(cb);
        };
        return NodeDocumentProvider;
    })();
    Engine.NodeDocumentProvider = NodeDocumentProvider;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var State2D = (function () {
        function State2D(managers) {
            this.managers = managers;
        }
        State2D.prototype.load = function (gl) {
            this.drawer = this.managers.Graphics.getState2DDrawer(gl, this.managers);
        };

        State2D.prototype.unload = function () {
        };

        State2D.prototype.updatePhysics = function (frameManager, frameTimeInfo) {
        };

        State2D.prototype.drawFrame = function (gl, canvas, frameManager, frameTimeInfo, cam) {
            this.drawer.draw(gl, canvas, frameManager, frameTimeInfo, cam, this);
        };

        State2D.prototype.drawFrame2D = function (gl, canvas, frameManager, frameTimeInfo, cam) {
            throw "drawFrame2D NOT IMPLEMENTED";
        };
        return State2D;
    })();
    Engine.State2D = State2D;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var State3D = (function () {
        function State3D(managers) {
            this.managers = managers;
        }
        State3D.prototype.load = function (gl) {
            this.drawer = this.managers.Graphics.getState3DDrawer(gl, this.managers);
        };

        State3D.prototype.unload = function () {
        };

        State3D.prototype.updatePhysics = function (frameManager, frameTimeInfo) {
        };

        State3D.prototype.drawFrame = function (gl, canvas, frameManager, frameTimeInfo, cam) {
            this.drawer.draw(gl, canvas, frameManager, frameTimeInfo, cam, this);
        };

        State3D.prototype.drawFrame3D = function (gl, canvas, frameManager, frameTimeInfo, cam) {
            throw "drawFrame3D NOT IMPLEMENTED";
        };
        return State3D;
    })();
    Engine.State3D = State3D;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var VRState2DDrawer = (function () {
        function VRState2DDrawer(managers) {
            this.managers = managers;
        }
        VRState2DDrawer.prototype.ensureObjects = function (gl) {
            if (VRState2DDrawer.initialized) {
                return;
            }
            VRState2DDrawer.target = WGL.RenderableTexture.Create(gl, 1024, 1024);
            VRState2DDrawer.initialized = true;

            var color = new TSM.vec3([1.0, 1.0, 1.0]);
            var w = 5.0;
            var h = w * 200.0 / 320.0;
            var z = 0.0;

            var verts = [
                new Vertices.Vertex3DC(new TSM.vec3([-w, -h, z]), color, new TSM.vec2([0.0, 0.0])),
                new Vertices.Vertex3DC(new TSM.vec3([w, -h, z]), color, new TSM.vec2([1.0, 0.0])),
                new Vertices.Vertex3DC(new TSM.vec3([w, h, z]), color, new TSM.vec2([1.0, 1.0])),
                new Vertices.Vertex3DC(new TSM.vec3([w, h, z]), color, new TSM.vec2([1.0, 1.0])),
                new Vertices.Vertex3DC(new TSM.vec3([-w, h, z]), color, new TSM.vec2([0.0, 1.0])),
                new Vertices.Vertex3DC(new TSM.vec3([-w, -h, z]), color, new TSM.vec2([0.0, 0.0]))
            ];

            VRState2DDrawer.screenMesh = this.managers.Graphics.getMesh(gl, this.managers, verts);
            VRState2DDrawer.screenMesh.Texture = VRState2DDrawer.target.Texture;

            VRState2DDrawer.screenMesh.ModelMatrix.translate(new TSM.vec3([0.0, 0.0, -12.0]));
        };

        VRState2DDrawer.prototype.draw = function (gl, canvas, frameManager, frameTimeInfo, cam, state) {
            this.ensureObjects(gl);

            var helper = new States.VRGLStateHelper(this.managers.VR);
            VRState2DDrawer.target.bindForDrawing();
            gl.viewport(0, 0, 1024, 1024);
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            state.drawFrame2D(gl, canvas, frameManager, frameTimeInfo, cam);

            helper.startFrame(gl);
            VRState2DDrawer.target.Texture.generateMipmap();

            var me = this;
            function runPass(eyeNum) {
                var base = me.managers.VR.getHeadCameraState(eyeNum);
                VRState2DDrawer.screenMesh.ViewMatrix.setIdentity();
                VRState2DDrawer.screenMesh.ViewMatrix.translate(base.EyeOffset);
                VRState2DDrawer.screenMesh.ViewMatrix.multiply(base.HeadOrientation.inverse().toMat4());
                VRState2DDrawer.screenMesh.ViewMatrix.translate(base.HeadPosition.scale(-1));

                VRState2DDrawer.screenMesh.ProjectionMatrix = base.ProjectionMatrix;
                VRState2DDrawer.screenMesh.draw();
            }

            helper.startEye(gl, 0);
            runPass(0);
            helper.endEye(gl, 0);

            helper.startEye(gl, 1);
            runPass(1);
            helper.endEye(gl, 1);
        };
        VRState2DDrawer.initialized = false;
        VRState2DDrawer.target = null;
        VRState2DDrawer.screenMesh = null;
        return VRState2DDrawer;
    })();
    Engine.VRState2DDrawer = VRState2DDrawer;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var VRState3DDrawer = (function () {
        function VRState3DDrawer(managers) {
            this.managers = managers;
        }
        VRState3DDrawer.prototype.draw = function (gl, canvas, frameManager, frameTimeInfo, cam, state) {
            var helper = new States.VRGLStateHelper(this.managers.VR);
            helper.startFrame(gl);

            var me = this;
            function getCam(eyeNum) {
                var base = me.managers.VR.getHeadCameraState(eyeNum);
                return base;
            }

            helper.startEye(gl, 0);
            var camLeft = getCam(0);
            state.drawFrame3D(gl, canvas, frameManager, frameTimeInfo, camLeft);
            helper.endEye(gl, 0);

            helper.startEye(gl, 1);
            var camRight = getCam(1);
            state.drawFrame3D(gl, canvas, frameManager, frameTimeInfo, camRight);
            helper.endEye(gl, 1);
        };
        VRState3DDrawer.initialized = false;
        return VRState3DDrawer;
    })();
    Engine.VRState3DDrawer = VRState3DDrawer;
})(Engine || (Engine = {}));
var Events;
(function (Events) {
    var EventBus = (function () {
        function EventBus() {
            this.handlers = {};
        }
        EventBus.prototype.getClassName = function (event) {
            var evt = event;
            return evt.constructor.name;
        };

        EventBus.prototype.fire = function (event) {
            var name = this.getClassName(event);
            if (name in this.handlers) {
                var handlers = this.handlers[name];
                for (var i = 0; i < handlers.length; i++) {
                    handlers[i](event);
                }
            }
        };

        EventBus.prototype.register = function (event, handler) {
            var name = this.getClassName(event);
            if (!(name in this.handlers)) {
                this.handlers[name] = [];
            }
            this.handlers[name].push(handler);
        };

        EventBus.prototype.unregister = function (event, handler) {
            var name = this.getClassName(event);
            if (name in this.handlers) {
                var handlers = this.handlers[name];
                for (var i = 0; i < handlers.length; i++) {
                    if (handlers[i] === handler) {
                        handlers.splice(i, 1);
                        i--;
                    }
                }
            }
        };
        return EventBus;
    })();
    Events.EventBus = EventBus;
})(Events || (Events = {}));
var ExeData;
(function (ExeData) {
    var ExeDataLoader = (function () {
        function ExeDataLoader(managers) {
            this.managers = managers;
        }
        ExeDataLoader.prototype.load = function () {
            var managers = this.managers;

            var src = new ExeData.ExeReader(managers.Streams.getStream('SKYROADS.EXE'));
            var dst = managers.Textures;

            var dash = dst.getImage('DASHBRD.LZS');

            var loader = new Images.DirectImageLoader(this.managers);
            var pi = 5;
            var palette = [new Data.Color(0, 0, 0), dash.Palette[pi]];
            while (palette.length < 255) {
                palette.push(dash.Palette[pi + 1]);
            }

            dst.setImages('NUMBERS', loader.loadFromStream(src, 0x13C * 8, palette, 10, 0, 0, 4, 5));
            dst.setImages('JUMPMASTER', loader.loadFromStream(src, 0x204 * 8, palette, 2, 203, 156, 26, 5));

            //Calculate O2 for flash
            dst.setImages('O2_RED', [this.imageByChangingColor(dash, 160, 161, 7, 7, new Data.Color(216, 224, 224), new Data.Color(255, 0, 0))]);

            //Calculate Fuel for flashing
            dst.setImages('FUEL_RED', [this.imageByChangingColor(dash, 155, 169, 16, 5, new Data.Color(216, 224, 224), new Data.Color(255, 0, 0))]);

            //Calculate progress indicator
            var progressImgs = [];
            for (var i = 1; i < 29; i++) {
                progressImgs.push(this.imageByChangingColor(dash, 42, 130, i, 20, new Data.Color(72, 0, 68), new Data.Color(113, 0, 101)));
            }

            dst.setImages('PROGRESS_INDICATOR', progressImgs);

            var cvs = managers.Canvas.getCanvas();
            cvs.width = 32;
            cvs.height = 32;
            var ctx = cvs.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 32, 32);
            dst.setImages('WHITE', [new Images.ImageFragment(cvs, [], 0, 0)]);
        };

        ExeDataLoader.prototype.imageByChangingColor = function (src, xPos, yPos, w, h, colorA, colorB) {
            var ctxSrc = src.Canvas.getContext('2d');
            var dataSrc = ctxSrc.getImageData(xPos - src.XOffset, yPos - src.YOffset, w, h);

            var cvsDst = this.managers.Canvas.getCanvas();
            cvsDst.width = w;
            cvsDst.height = h;

            var ctxDst = cvsDst.getContext('2d');
            var dataDst = ctxDst.getImageData(0, 0, w, h);

            for (var i = 0; i < dataSrc.data.length; i += 4) {
                var color = new Data.Color(dataSrc.data[i + 0], dataSrc.data[i + 1], dataSrc.data[i + 2]);
                var alpha = dataSrc.data[i + 3];
                if (color.equals(colorA)) {
                    color = colorB;
                } else if (color.equals(colorB)) {
                    color = colorA;
                }

                dataDst.data[i + 0] = color.R;
                dataDst.data[i + 1] = color.G;
                dataDst.data[i + 2] = color.B;
                dataDst.data[i + 3] = alpha;
            }

            ctxDst.putImageData(dataDst, 0, 0);

            return new Images.ImageFragment(cvsDst, src.Palette, xPos, yPos);
        };
        return ExeDataLoader;
    })();
    ExeData.ExeDataLoader = ExeDataLoader;
})(ExeData || (ExeData = {}));
var ExeData;
(function (ExeData) {
    var ExeReader = (function () {
        function ExeReader(stream) {
            this.stream = stream;
            var reader = new Data.BinaryReader(stream);
            stream.setPosition(8 * 8);
            this.offset = reader.getUint16() * 16 + 0x66E * 16;
            this.setPosition(0);
        }
        ExeReader.prototype.getBit = function () {
            return this.stream.getBit();
        };

        ExeReader.prototype.eof = function () {
            return this.stream.eof();
        };

        ExeReader.prototype.setPosition = function (bit) {
            this.stream.setPosition(bit + this.offset * 8);
        };

        ExeReader.prototype.getPosition = function () {
            return this.stream.getPosition() - this.offset * 8;
        };
        return ExeReader;
    })();
    ExeData.ExeReader = ExeReader;
})(ExeData || (ExeData = {}));
var Game;
(function (Game) {
    var CarSprite = (function () {
        function CarSprite(gl, managers) {
            this.sprite = managers.Graphics.get3DSprite(gl, managers, managers.Textures.getTexture(gl, "CARS.LZS"));
            this.sprite.VHigh.x = 1.0;
            this.sprite.VHigh.y = 0.0;

            this.sprite.ULow.y = 0.0;
            this.sprite.UHigh.x = 0.0;

            this.sprite.Size.x = 30;
            this.sprite.Size.y = this.sprite.Texture.Width;
            this.sprite.State.EnableDepthTest = true;
            this.frame = 0;
            this.playedDeath = false;
            this.finishedDeath = false;
        }
        CarSprite.prototype.updateAnimation = function (snap, level) {
            this.frame++;
        };

        CarSprite.prototype.updatePosition = function (snap, level) {
            var frame = Math.max(0, this.frame - 1);

            this.sprite.Position.x = snap.Position.x - 95 - this.sprite.Size.x / 2;
            this.sprite.Position.y = 102 - (snap.Position.y - 80) - this.sprite.Texture.Width;
            this.sprite.Position.z = -(snap.Position.z) * 46.0 + 1.0;

            var minX = 95, maxX = 417;
            var xp = (snap.Position.x - minX) / (maxX - minX);
            var idx = 14 + Math.floor(xp * 7) * 9 + frame % 3;

            var gravityAccel = level.getGravityAcceleration();
            if (snap.Velocity.y > -gravityAccel * 4) {
                idx += 3;
            } else if (snap.Velocity.y < gravityAccel * 4) {
                idx += 6;
            }

            if (snap.CraftState === 1 /* Exploded */) {
                if (!this.playedDeath) {
                    this.playedDeath = true;
                    this.frame = 0;
                    frame = 0;
                }

                var deathFNum = 14;
                idx = Math.min(deathFNum, Math.floor(frame / 2.0));
                if (idx === deathFNum) {
                    this.finishedDeath = true;
                }
            }

            this.sprite.ULow.y = idx * 30 / this.sprite.Texture.Height;
            this.sprite.UHigh.y = (idx + 1) * 30 / this.sprite.Texture.Height;
        };

        CarSprite.prototype.draw = function (view, cam) {
            if (!this.finishedDeath) {
                this.sprite.ModelMatrix.setIdentity();
                view.copy(this.sprite.ViewMatrix);
                cam.ProjectionMatrix.copy(this.sprite.ProjectionMatrix);

                this.sprite.draw();
            }
        };

        CarSprite.prototype.hasAnimationFinished = function () {
            return this.finishedDeath;
        };
        return CarSprite;
    })();
    Game.CarSprite = CarSprite;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var ControllerState = (function () {
        function ControllerState(turn, accel, jump) {
            if (turn >= -1 && turn <= 1) {
                this.TurnInput = turn;
            } else {
                throw "Invalid TurnInput";
            }

            if (accel >= -1 && accel <= 1) {
                this.AccelInput = accel;
            } else {
                throw "Invalid accel";
            }

            this.JumpInput = jump;
        }
        return ControllerState;
    })();
    Game.ControllerState = ControllerState;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Dashboard = (function () {
        function Dashboard(gl, managers) {
            this.oxyAmt = 0.0;
            this.fuelAmt = 0.0;
            this.speedAmt = 0.0;
            this.gravity = 0.0;
            this.jumpMasterInUse = false;
            this.craftState = 0;
            this.frame = 0;
            this.zPosition = 0.0;
            this.zLevelLength = 0.0;
            var loadGauge = function (filename) {
                return managers.Textures.getTextures(gl, filename).map(function (t) {
                    return managers.Graphics.get3DSprite(gl, managers, t);
                });
            };
            this.dash = managers.Graphics.get3DSprite(gl, managers, managers.Textures.getTexture(gl, "DASHBRD.LZS"));
            this.oxyGauge = loadGauge("OXY_DISP.DAT");
            this.fuelGauge = loadGauge("FUL_DISP.DAT");
            this.speedGauge = loadGauge("SPEED.DAT");
            this.progressGauge = loadGauge("PROGRESS_INDICATOR");
            this.oxyEmpty = loadGauge("O2_RED")[0];
            this.fuelEmpty = loadGauge("FUEL_RED")[0];

            this.numberSet = loadGauge("NUMBERS");
            this.jumpMasterOn = loadGauge("JUMPMASTER")[1];

            var blackTex = new WGL.Texture(gl);
            var cvs = managers.Canvas.getCanvas();
            cvs.width = 32;
            cvs.height = 32;

            var ctx = cvs.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, cvs.width, cvs.height);

            blackTex.loadData(cvs);
            blackTex.setFilters(gl.NEAREST, gl.NEAREST);

            var blackFrag = new Drawing.TextureFragment(blackTex, 0, 138, 320, 200 - 138);
            this.back = managers.Graphics.get3DSprite(gl, managers, blackFrag);
        }
        Dashboard.prototype.update = function (snap, level) {
            this.oxyAmt = snap.OxygenPercent;
            this.fuelAmt = snap.FuelPercent;
            this.speedAmt = (snap.Velocity.z) / (0x2AAA / 0x10000);
            this.gravity = level.Gravity;
            this.jumpMasterInUse = snap.JumpOMasterInUse;
            this.zPosition = snap.Position.z;
            this.zLevelLength = level.getLength();
            this.craftState = snap.CraftState;

            this.frame++;
        };

        Dashboard.prototype.draw = function (gl, cam, scaleVec) {
            var view = new TSM.mat4().setIdentity();
            view.multiply(cam.HeadOrientation.toMat4());
            view.translate(cam.HeadPosition.copy().scale(-1.0));
            view.scale(scaleVec);
            view.translate(cam.EyeOffset.copy().divide(scaleVec));

            var model = new TSM.mat4().setIdentity();
            model.setIdentity().translate(new TSM.vec3([0.0, -50.0, -25.0]));
            model.rotate(-Math.PI / 9.0, new TSM.vec3([1.0, 0.0, 0.0]));
            model.scale(new TSM.vec3([0.25, 0.25, 0.25]));

            var configAndDrawSprite = function (s) {
                s.ViewMatrix = view;
                s.ModelMatrix = model;
                s.ProjectionMatrix = cam.ProjectionMatrix;
                s.draw();
            };

            configAndDrawSprite(this.back);
            configAndDrawSprite(this.dash);
            var drawGauge = function (gs, amt) {
                var n = Math.round(Math.min(1.0, amt) * gs.length) - 1;
                if (n >= 0)
                    configAndDrawSprite(gs[n]);
            };

            drawGauge(this.oxyGauge, this.oxyAmt);
            drawGauge(this.fuelGauge, this.fuelAmt);
            drawGauge(this.speedGauge, this.speedAmt);
            if (this.zLevelLength > 0) {
                drawGauge(this.progressGauge, this.zPosition / this.zLevelLength);
            }

            if (this.jumpMasterInUse) {
                configAndDrawSprite(this.jumpMasterOn);
            }

            if (this.craftState === 3 /* OutOfOxygen */ && this.frame % 4 < 2) {
                configAndDrawSprite(this.oxyEmpty);
            }

            if (this.craftState === 2 /* OutOfFuel */ && this.frame % 4 < 2) {
                configAndDrawSprite(this.fuelEmpty);
            }

            var grav = this.gravity - 3, gravHigh = Math.floor(grav / 10), gravLow = grav % 10;
            if (gravHigh > 0) {
                this.numberSet[gravHigh].Position.x = 96.0;
                this.numberSet[gravHigh].Position.y = 156.0;
                configAndDrawSprite(this.numberSet[gravHigh]);
            }
            if (gravLow > 0) {
                this.numberSet[gravLow].Position.x = 101.0;
                this.numberSet[gravLow].Position.y = 156.0;
                configAndDrawSprite(this.numberSet[gravLow]);
            }
        };
        return Dashboard;
    })();
    Game.Dashboard = Dashboard;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var DemoController = (function () {
        function DemoController(demo) {
            this.demo = demo;
        }
        DemoController.prototype.update = function (ship) {
            var idx = Math.floor(ship.getZPosition() * DemoController.TilePositionToDemoPosition);
            if (idx >= this.demo.length)
                return new Game.ControllerState(0, 0, false);
            var val = this.demo[idx];

            return new Game.ControllerState(((val >> 2) & 3) - 1, (val & 3) - 1, ((val >> 4) & 1) > 0);
        };
        DemoController.TilePositionToDemoPosition = 0x10000 / 0x666;
        return DemoController;
    })();
    Game.DemoController = DemoController;
})(Game || (Game = {}));
var Game;
(function (Game) {
    (function (ShipEvents) {
        var ShipBouncedEvent = (function () {
            function ShipBouncedEvent() {
            }
            return ShipBouncedEvent;
        })();
        ShipEvents.ShipBouncedEvent = ShipBouncedEvent;
    })(Game.ShipEvents || (Game.ShipEvents = {}));
    var ShipEvents = Game.ShipEvents;
})(Game || (Game = {}));
var Game;
(function (Game) {
    (function (ShipEvents) {
        var ShipBumpedWallEvent = (function () {
            function ShipBumpedWallEvent() {
            }
            return ShipBumpedWallEvent;
        })();
        ShipEvents.ShipBumpedWallEvent = ShipBumpedWallEvent;
    })(Game.ShipEvents || (Game.ShipEvents = {}));
    var ShipEvents = Game.ShipEvents;
})(Game || (Game = {}));
var Game;
(function (Game) {
    (function (ShipEvents) {
        var ShipExplodedEvent = (function () {
            function ShipExplodedEvent() {
            }
            return ShipExplodedEvent;
        })();
        ShipEvents.ShipExplodedEvent = ShipExplodedEvent;
    })(Game.ShipEvents || (Game.ShipEvents = {}));
    var ShipEvents = Game.ShipEvents;
})(Game || (Game = {}));
var Game;
(function (Game) {
    (function (ShipEvents) {
        var ShipRefilledEvent = (function () {
            function ShipRefilledEvent() {
            }
            return ShipRefilledEvent;
        })();
        ShipEvents.ShipRefilledEvent = ShipRefilledEvent;
    })(Game.ShipEvents || (Game.ShipEvents = {}));
    var ShipEvents = Game.ShipEvents;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var FixedRateSnapshotProvider = (function () {
        function FixedRateSnapshotProvider() {
            this.snapshot = null;
        }
        FixedRateSnapshotProvider.prototype.reset = function () {
            this.snapshot = null;
        };

        FixedRateSnapshotProvider.prototype.pushSnapshot = function (s) {
            this.snapshot = s;
        };

        FixedRateSnapshotProvider.prototype.getSnapshot = function () {
            return this.snapshot;
        };
        return FixedRateSnapshotProvider;
    })();
    Game.FixedRateSnapshotProvider = FixedRateSnapshotProvider;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var FPMath = (function () {
        function FPMath() {
        }
        FPMath.prototype.round32 = function (n) {
            return Math.floor(n * 0x10000) / 0x10000;
        };

        FPMath.prototype.round16 = function (n) {
            return Math.floor(n * 0x80) / 0x80;
        };
        return FPMath;
    })();
    Game.FPMath = FPMath;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var GameSnapshot = (function () {
        function GameSnapshot() {
        }
        return GameSnapshot;
    })();
    Game.GameSnapshot = GameSnapshot;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var InterpolatingSnapshoptProvider = (function () {
        function InterpolatingSnapshoptProvider() {
            this.first = null;
            this.second = null;
            this.tempState = new Game.GameSnapshot();
        }
        InterpolatingSnapshoptProvider.prototype.reset = function () {
            this.first = null;
            this.second = null;
            this.tempState.Position = new TSM.vec3();
            this.tempState.Velocity = new TSM.vec3();
        };

        InterpolatingSnapshoptProvider.prototype.pushSnapshot = function (s) {
            this.second = this.first;
            this.secondTime = this.firstTime;

            this.first = s;
            this.firstTime = Date.now();
        };

        InterpolatingSnapshoptProvider.prototype.getSnapshot = function () {
            if (this.second === null) {
                return this.first;
            }

            var timeSince = Date.now() - this.firstTime;
            var percent = Math.max(0, Math.min(1.0, timeSince / (this.firstTime - this.secondTime)));

            var first = this.first;
            var second = this.second;
            var temp = this.tempState;
            temp.CraftState = first.CraftState;
            temp.FuelPercent = first.FuelPercent;
            temp.JumpOMasterInUse = first.JumpOMasterInUse;
            temp.JumpOMasterVelocityDelta = first.JumpOMasterVelocityDelta;
            temp.OxygenPercent = first.OxygenPercent;
            temp.Position = first.Position.copy().subtract(second.Position).scale(percent).add(second.Position);
            temp.Velocity = first.Velocity.copy().subtract(second.Velocity).scale(percent).add(second.Velocity);

            return temp;
        };
        return InterpolatingSnapshoptProvider;
    })();
    Game.InterpolatingSnapshoptProvider = InterpolatingSnapshoptProvider;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var ControlSourceController = (function () {
        function ControlSourceController(source) {
            this.controlSource = source;
        }
        ControlSourceController.prototype.update = function (ship) {
            return new Game.ControllerState(this.controlSource.getTurnAmount(), this.controlSource.getAccelAmount(), this.controlSource.getJump());
        };
        ControlSourceController.TilePositionToDemoPosition = 0x10000 / 0x666;
        return ControlSourceController;
    })();
    Game.ControlSourceController = ControlSourceController;
})(Game || (Game = {}));
var Game;
(function (Game) {
    function sFloor(n) {
        var s = n >= 0 ? 1 : -1;
        return Math.floor(n * s) * s;
    }

    (function (ShipState) {
        ShipState[ShipState["Alive"] = 0] = "Alive";
        ShipState[ShipState["Exploded"] = 1] = "Exploded";
        ShipState[ShipState["OutOfFuel"] = 2] = "OutOfFuel";
        ShipState[ShipState["OutOfOxygen"] = 3] = "OutOfOxygen";
    })(Game.ShipState || (Game.ShipState = {}));
    var ShipState = Game.ShipState;

    ;
    var Ship = (function () {
        function Ship(params) {
            this.fp = new Game.FPMath();
            this.load(params);
        }
        Ship.prototype.load = function (params) {
            this.xPosition = params.xPosition;
            this.yPosition = params.yPosition;
            this.zPosition = params.zPosition;

            this.slideAmount = params.slideAmount;
            this.slidingAccel = params.slidingAccel;
            this.xMovementBase = params.xMovementBase;

            this.yVelocity = params.yVelocity;
            this.zVelocity = params.zVelocity;

            this.isOnGround = params.isOnGround;
            this.isGoingUp = params.isGoingUp;
            this.hasRunJumpOMaster = params.hasRunJumpOMaster;
            this.jumpOMasterVelocityDelta = params.jumpOMasterVelocityDelta;
            this.jumpOMasterInUse = params.jumpOMasterInUse;

            this.jumpedFromYPosition = params.jumpedFromYPosition;

            this.fuelRemaining = params.fuelRemaining;
            this.oxygenRemaining = params.oxygenRemaining;

            this.offsetAtWhichNotInsideTile = params.offsetAtWhichNotInsideTile;

            this.state = params.state;
        };

        Ship.prototype.getXPosition = function () {
            return this.xPosition;
        };

        Ship.prototype.getYPosition = function () {
            return this.yPosition;
        };

        Ship.prototype.getZPosition = function () {
            return this.zPosition;
        };

        Ship.prototype.getZVelocity = function () {
            return this.zVelocity;
        };

        Ship.prototype.getJumpOMasterVelocityDelta = function () {
            return this.jumpOMasterVelocityDelta;
        };

        Ship.prototype.getJumpOMasterInUse = function () {
            return this.jumpOMasterInUse;
        };

        Ship.prototype.getState = function () {
            return this.state;
        };

        Ship.prototype.getFuelRemaining = function () {
            return this.fuelRemaining;
        };

        Ship.prototype.getOxygenRemaining = function () {
            return this.oxygenRemaining;
        };

        Ship.prototype.clone = function (other) {
            if (typeof other === "undefined") { other = null; }
            if (other === null) {
                return new Ship(this);
            } else {
                other.load(this);
                return other;
            }
        };

        Ship.prototype.update = function (level, expected, controls, eventBus) {
            this.sanitizeParameters();
            var canControl = this.state === 0 /* Alive */;

            var cell = level.getCell(this.getXPosition(), this.getYPosition(), this.getZPosition());
            var isAboveNothing = cell.isEmpty();
            var touchEffect = this.getTouchEffect(cell);

            var isOnSlidingTile = touchEffect === 4 /* Slide */;
            var isOnDecelPad = touchEffect === 2 /* Decelerate */;

            this.applyTouchEffect(touchEffect, eventBus);
            this.updateYVelocity(expected, level, eventBus);
            this.updateZVelocity(canControl, controls.AccelInput);
            this.updateXVelocity(canControl, controls.TurnInput, isOnSlidingTile, isAboveNothing, this.isGoingUp);
            this.updateJump(canControl, isAboveNothing, controls.JumpInput, level);
            this.updateJumpOMaster(controls, level);
            this.updateGravity(level.getGravityAcceleration());

            this.clone(expected);
            expected.attemptMotion(isOnDecelPad);
            expected.sanitizeParameters();
            this.moveTo(expected, level);
            this.sanitizeParameters();
            expected.sanitizeParameters();
            this.handleBumps(expected, level, eventBus);
            this.handleCollision(expected, eventBus);
            this.handleSlideCollision(expected);
            this.handleBounce(expected, level);
            this.handleOxygenAndFuel(level);
        };

        Ship.prototype.getTouchEffect = function (cell) {
            var touchEffect = 0 /* None */;
            if (this.isOnGround) {
                var y = this.yPosition;
                if (Math.floor(y) == 0x2800 / 0x80 && cell.Tile != null) {
                    touchEffect = cell.Tile.Effect;
                } else if (Math.floor(y) > 0x2800 / 0x80 && cell.Cube != null && cell.Cube.Height == y) {
                    touchEffect = cell.Cube.Effect;
                }
            }
            return touchEffect;
        };

        Ship.prototype.applyTouchEffect = function (effect, eventBus) {
            switch (effect) {
                case 1 /* Accelerate */:
                    this.zVelocity += 0x12F / 0x10000;
                    break;
                case 2 /* Decelerate */:
                    this.zVelocity -= 0x12F / 0x10000;
                    break;
                case 3 /* Kill */:
                    this.state = 1 /* Exploded */;
                    if (this.state !== 1 /* Exploded */) {
                        eventBus.fire(new Game.ShipEvents.ShipExplodedEvent());
                    }
                    break;
                case 5 /* RefillOxygen */:
                    if (this.state === 0 /* Alive */) {
                        if (this.fuelRemaining < 0x6978 || this.oxygenRemaining < 0x6978) {
                            eventBus.fire(new Game.ShipEvents.ShipRefilledEvent());
                        }

                        this.fuelRemaining = 0x7530;
                        this.oxygenRemaining = 0x7530;
                    }
                    break;
            }
            this.clampGlobalZVelocity();
        };

        Ship.prototype.updateYVelocity = function (expected, level, eventBus) {
            if (this.isDifferentHeight(expected)) {
                if (this.slideAmount == 0 || this.offsetAtWhichNotInsideTile >= 2) {
                    var yvel = Math.abs(this.yVelocity);
                    if (yvel > (level.Gravity * 0x104 / 8 / 0x80)) {
                        if (this.yVelocity < 0) {
                            eventBus.fire(new Game.ShipEvents.ShipBouncedEvent());
                        }
                        this.yVelocity = -0.5 * this.yVelocity;
                    } else {
                        this.yVelocity = 0;
                    }
                } else {
                    this.yVelocity = 0;
                }
            }
        };

        Ship.prototype.updateZVelocity = function (canControl, zAccelInput) {
            this.zVelocity += (canControl ? zAccelInput : 0) * 0x4B / 0x10000;
            this.clampGlobalZVelocity();
        };

        Ship.prototype.updateXVelocity = function (canControl, turnInput, isOnSlidingTile, isAboveNothing, isGoingUp) {
            if (!isOnSlidingTile) {
                var canControl1 = (isGoingUp || isAboveNothing) && this.xMovementBase === 0 && this.yVelocity > 0 && (this.yPosition - this.jumpedFromYPosition) < 30;
                var canControl2 = !isGoingUp && !isAboveNothing;
                if (canControl1 || canControl2) {
                    this.xMovementBase = (canControl ? turnInput * 0x1D / 0x80 : 0);
                }
            }
        };

        Ship.prototype.updateJump = function (canControl, isAboveNothing, jumpInput, level) {
            if (!this.isGoingUp && !isAboveNothing && jumpInput && level.Gravity < 0x14 && canControl) {
                this.yVelocity = 0x480 / 0x80;
                this.isGoingUp = true;
                this.jumpedFromYPosition = this.yPosition;
            }
        };

        Ship.prototype.updateJumpOMaster = function (controls, level) {
            if (this.isGoingUp && !this.hasRunJumpOMaster && this.getYPosition() >= 110) {
                this.runJumpOMaster(controls, level);
                this.hasRunJumpOMaster = true;
            }
        };

        Ship.prototype.updateGravity = function (gravityAcceleration) {
            if (this.getYPosition() >= 0x28) {
                this.yVelocity += gravityAcceleration;
                this.yVelocity = sFloor(this.yVelocity * 0x80) / 0x80;
            } else if (this.yVelocity > -105 / 0x80) {
                this.yVelocity = -105 / 0x80;
            }
        };

        Ship.prototype.attemptMotion = function (onDecelPad) {
            var isDead = this.state === 1 /* Exploded */;
            var motionVel = this.zVelocity;
            if (!onDecelPad) {
                motionVel += 0x618 / 0x10000;
            }

            var xMotion = sFloor(this.xMovementBase * 0x80) * sFloor(motionVel * 0x10000) / 0x10000 + this.slideAmount;
            if (!isDead) {
                this.xPosition += xMotion;
                this.yPosition += this.yVelocity;
                this.zPosition += this.zVelocity;
            }
        };

        Ship.prototype.moveTo = function (dest, level) {
            if (this.xPosition === dest.xPosition && this.yPosition === dest.yPosition && this.zPosition === dest.zPosition) {
                return;
            }

            var fake = this.clone();

            var iter = 1;
            for (iter = 1; iter <= 5; iter++) {
                this.clone(fake);
                fake.interp(dest, iter / 5);
                if (level.isInsideTile(fake.xPosition, fake.yPosition, fake.zPosition)) {
                    break;
                }
            }

            iter--; //We care about the last iter we were *NOT* inside a tile
            this.interp(dest, iter / 5);

            var zGran = 0x1000 / 0x10000;

            while (zGran != 0) {
                this.clone(fake);
                fake.zPosition += zGran;
                if (dest.zPosition - this.zPosition >= zGran && !level.isInsideTile(fake.xPosition, fake.yPosition, fake.zPosition)) {
                    this.zPosition = fake.zPosition;
                } else {
                    zGran /= 0x10;
                    zGran = Math.floor(zGran * 0x10000) / 0x10000;
                }
            }

            this.zPosition = this.fp.round32(this.zPosition);

            var xGran = dest.xPosition > this.xPosition ? (0x7D / 0x80) : (-0x7D / 0x80);
            while (Math.abs(xGran) > 0) {
                this.clone(fake);
                fake.xPosition += xGran;
                if (Math.abs(dest.xPosition - this.xPosition) >= Math.abs(xGran) && !level.isInsideTile(fake.xPosition, fake.yPosition, fake.zPosition)) {
                    this.xPosition = fake.xPosition;
                } else {
                    xGran = sFloor(xGran / 5.0 * 0x80) / 0x80;
                }
            }

            this.xPosition = this.fp.round16(this.xPosition);

            var yGran = dest.yPosition > this.yPosition ? (0x7D / 0x80) : (-0x7D / 0x80);
            while (Math.abs(yGran) > 0) {
                this.clone(fake);
                fake.yPosition += yGran;
                if (Math.abs(dest.yPosition - this.yPosition) >= Math.abs(yGran) && !level.isInsideTile(fake.xPosition, fake.yPosition, fake.zPosition)) {
                    this.yPosition = fake.yPosition;
                } else {
                    yGran = sFloor(yGran / 5.0 * 0x80) / 0x80;
                }
            }

            this.yPosition = this.fp.round16(this.yPosition);
        };

        Ship.prototype.handleBumps = function (expected, level, eventBus) {
            var movedShip = this.clone();
            movedShip.zPosition = expected.zPosition;
            if (this.zPosition != expected.zPosition && level.isInsideTile(movedShip.xPosition, movedShip.yPosition, movedShip.zPosition)) {
                var bumpOff = 0x3a0 / 0x80;

                this.clone(movedShip);
                movedShip.xPosition = this.xPosition - bumpOff;
                movedShip.zPosition = expected.zPosition;
                if (!level.isInsideTile(movedShip.xPosition, movedShip.yPosition, movedShip.zPosition)) {
                    this.xPosition = movedShip.xPosition;
                    expected.zPosition = this.zPosition;
                    eventBus.fire(new Game.ShipEvents.ShipBumpedWallEvent());
                } else {
                    movedShip.xPosition = this.xPosition + bumpOff;
                    if (!level.isInsideTile(movedShip.xPosition, movedShip.yPosition, movedShip.zPosition)) {
                        this.xPosition = movedShip.xPosition;
                        expected.zPosition = this.zPosition;
                        eventBus.fire(new Game.ShipEvents.ShipBumpedWallEvent());
                    }
                }
            }
        };

        Ship.prototype.handleCollision = function (expected, eventBus) {
            if (Math.abs(this.zPosition - expected.zPosition) > 0.01) {
                if (this.zVelocity < 1.0 / 3.0 * 0x2aaa / 0x10000) {
                    this.zVelocity = 0.0;
                    eventBus.fire(new Game.ShipEvents.ShipBumpedWallEvent());
                } else if (this.state !== 1 /* Exploded */) {
                    this.state = 1 /* Exploded */;
                    eventBus.fire(new Game.ShipEvents.ShipExplodedEvent());
                }
            }
        };

        Ship.prototype.handleSlideCollision = function (expected) {
            if (Math.abs(this.xPosition - expected.xPosition) > 0.01) {
                this.xMovementBase = 0.0;
                if (this.slideAmount !== 0.0) {
                    expected.xPosition = this.xPosition;
                    this.slideAmount = 0.0;
                }
                this.zVelocity -= 0x97 / 0x10000;
                this.clampGlobalZVelocity();
            }
        };

        Ship.prototype.handleBounce = function (expected, level) {
            this.isOnGround = false;
            if (this.yVelocity < 0 && expected.yPosition !== this.yPosition) {
                this.zVelocity += this.jumpOMasterVelocityDelta;
                this.jumpOMasterVelocityDelta = 0.0;
                this.hasRunJumpOMaster = false;
                this.jumpOMasterInUse = false;

                this.isGoingUp = false;
                this.isOnGround = true;
                this.slidingAccel = 0;

                var movedShip = this.clone();
                for (var i = 1; i <= 0xE; i++) {
                    this.clone(movedShip);
                    movedShip.xPosition += i;
                    movedShip.yPosition -= 1.0 / 0x80;

                    if (!level.isInsideTile(movedShip.xPosition, movedShip.yPosition, movedShip.zPosition)) {
                        this.slidingAccel++;
                        this.offsetAtWhichNotInsideTile = i;
                        break;
                    }
                }

                for (var i = 1; i <= 0xE; i++) {
                    this.clone(movedShip);
                    movedShip.xPosition -= i;
                    movedShip.yPosition -= 1.0 / 0x80;
                    if (!level.isInsideTile(movedShip.xPosition, movedShip.yPosition, movedShip.zPosition)) {
                        this.slidingAccel--;
                        this.offsetAtWhichNotInsideTile = i;
                        break;
                    }
                }

                if (this.slidingAccel != 0) {
                    this.slideAmount += 0x11 * this.slidingAccel / 0x80;
                } else {
                    this.slideAmount = 0;
                }
            }
        };

        Ship.prototype.handleOxygenAndFuel = function (level) {
            this.oxygenRemaining -= 0x7530 / (0x24 * level.Oxygen);
            if (this.oxygenRemaining <= 0) {
                this.oxygenRemaining = 0;
                this.state = 3 /* OutOfOxygen */;
            }

            this.fuelRemaining -= this.zVelocity * 0x7530 / level.Fuel;
            if (this.fuelRemaining <= 0) {
                this.fuelRemaining = 0;
                this.state = 2 /* OutOfFuel */;
            }
        };

        Ship.prototype.interp = function (dest, percent) {
            this.xPosition = this.fp.round16((dest.xPosition - this.xPosition) * percent + this.xPosition);
            this.yPosition = this.fp.round16((dest.yPosition - this.yPosition) * percent + this.yPosition);
            this.zPosition = this.fp.round32((dest.zPosition - this.zPosition) * percent + this.zPosition);
        };

        Ship.prototype.runJumpOMaster = function (controls, level) {
            if (this.willLandOnTile(controls, this, level)) {
                return;
            }

            var zVelocity = this.zVelocity;
            var xMov = this.xMovementBase;
            var i;
            for (i = 1; i <= 6; i++) {
                this.xMovementBase = this.fp.round16(xMov + xMov * i / 10);
                if (this.willLandOnTile(controls, this, level)) {
                    break;
                }

                this.xMovementBase = this.fp.round16(xMov - xMov * i / 10);
                if (this.willLandOnTile(controls, this, level)) {
                    break;
                }

                this.xMovementBase = xMov;

                var zv2 = this.fp.round32(zVelocity + zVelocity * i / 10);
                this.zVelocity = this.clampZVelocity(zv2);
                if (this.zVelocity == zv2) {
                    if (this.willLandOnTile(controls, this, level)) {
                        break;
                    }
                }

                zv2 = this.fp.round32(zVelocity - zVelocity * i / 10);
                this.zVelocity = this.clampZVelocity(zv2);
                if (this.zVelocity == zv2) {
                    if (this.willLandOnTile(controls, this, level)) {
                        break;
                    }
                }

                this.zVelocity = zVelocity;
            }

            this.jumpOMasterVelocityDelta = zVelocity - this.zVelocity;
            if (i <= 6) {
                this.jumpOMasterInUse = true;
            }
        };

        Ship.prototype.isOnNothing = function (level, xPosition, zPosition) {
            var cell = level.getCell(xPosition, 0, zPosition);
            return cell.isEmpty() || (cell.Tile != null && cell.Tile.Effect == 3 /* Kill */);
        };

        Ship.prototype.willLandOnTile = function (controls, ship, level) {
            var xPos = ship.xPosition, yPos = ship.yPosition, zPos = ship.zPosition, xVelocity = ship.xMovementBase, yVelocity = ship.yVelocity, zVelocity = ship.zVelocity;

            while (true) {
                var currentX = xPos;
                var currentSlideAmount = this.slideAmount;
                var currentZ = zPos;

                yVelocity += level.getGravityAcceleration();
                zPos += zVelocity;

                var xRate = zVelocity + 0x618 / 0x10000;
                var xMov = xVelocity * xRate * 128 + currentSlideAmount;
                xPos += xMov;
                if (xPos < 0x2F80 / 0x80 || xPos > 0xD080 / 0x80) {
                    return false;
                }

                yPos += yVelocity;
                zVelocity = this.clampZVelocity(zVelocity + controls.AccelInput * 0x4B / 0x10000);

                if (yPos <= 0x2800 / 0x80) {
                    return !this.isOnNothing(level, currentX, currentZ) && !this.isOnNothing(level, xPos, zPos);
                }
            }
        };

        Ship.prototype.clampZVelocity = function (z) {
            return Math.min(Math.max(0.0, z), 0x2AAA / 0x10000);
        };

        Ship.prototype.clampGlobalZVelocity = function () {
            this.zVelocity = this.clampZVelocity(this.zVelocity);
        };

        Ship.prototype.isDifferentHeight = function (other) {
            return Math.abs(other.yPosition - this.yPosition) > 0.01;
        };

        Ship.prototype.sanitizeParameters = function () {
            this.xPosition = Math.round(this.xPosition * 0x80) / 0x80;
            this.yPosition = Math.round(this.yPosition * 0x80) / 0x80;
            this.zPosition = Math.round(this.zPosition * 0x10000) / 0x10000;
        };
        return Ship;
    })();
    Game.Ship = Ship;
})(Game || (Game = {}));
var Game;
(function (Game) {
    function sFloor(n) {
        var s = n >= 0 ? 1 : -1;
        return Math.floor(n * s) * s;
    }

    var StateManager = (function () {
        function StateManager(managers, level, controller) {
            this.level = null;
            this.controller = null;
            this.didWin = false;
            this.level = level;
            this.controller = controller;

            this.resetStateVars();
        }
        StateManager.prototype.resetStateVars = function () {
            this.current = new Game.Ship({
                xPosition: 0x8000 / 0x80,
                yPosition: 0x2800 / 0x80,
                zPosition: 3.0,
                slideAmount: 0,
                slidingAccel: 0,
                xMovementBase: 0,
                yVelocity: 0,
                zVelocity: 0,
                offsetAtWhichNotInsideTile: 0,
                isOnGround: true,
                isOnDecelPad: false,
                isOnSlidingTile: false,
                isGoingUp: false,
                fuelRemaining: 0x7530,
                oxygenRemaining: 0x7530,
                jumpedFromYPosition: 0,
                state: 0 /* Alive */,
                hasRunJumpOMaster: false,
                jumpOMasterInUse: false,
                jumpOMasterVelocityDelta: 0
            });

            this.expected = this.current.clone();
        };

        StateManager.prototype.getLevel = function () {
            return this.level;
        };

        StateManager.prototype.runFrame = function (eventBus) {
            var controls = this.controller.update(this.current);
            this.current.update(this.level, this.expected, controls, eventBus);

            if (this.current.getZPosition() >= this.level.getLength() - 0.5 && this.level.isInsideTunnel(this.current.getXPosition(), this.current.getYPosition(), this.current.getZPosition())) {
                this.didWin = true;
            }

            var result = new Game.GameSnapshot();
            result.Position = new TSM.vec3([this.current.getXPosition(), this.current.getYPosition(), this.current.getZPosition()]);
            result.Velocity = new TSM.vec3([0.0, 0.0, this.current.getZVelocity() + this.current.getJumpOMasterVelocityDelta()]);
            result.CraftState = this.current.getState();
            result.FuelPercent = this.current.getFuelRemaining() / 0x7530;
            result.OxygenPercent = this.current.getOxygenRemaining() / 0x7530;
            result.JumpOMasterInUse = this.current.getJumpOMasterInUse();
            result.JumpOMasterVelocityDelta = this.current.getJumpOMasterVelocityDelta();
            return result;
        };
        return StateManager;
    })();
    Game.StateManager = StateManager;
})(Game || (Game = {}));
var Images;
(function (Images) {
    var Preloader = (function () {
        function Preloader() {
        }
        Preloader.prototype.preloadData = function (gl, managers) {
            this.compress(managers, 'OXY_DISP.DAT');
            this.compress(managers, 'FUL_DISP.DAT');
            this.compress(managers, 'SPEED.DAT');
            this.compress(managers, 'PROGRESS_INDICATOR');

            managers.Sounds.getMultiEffect('SFX.SND');
            [
                'CARS.LZS', 'DASHBRD.LZS', 'GOMENU.LZS', 'HELPMENU.LZS', 'INTRO.LZS', 'MAINMENU.LZS', 'SETMENU.LZS',
                'WORLD0.LZS', 'WORLD1.LZS', 'WORLD2.LZS', 'WORLD3.LZS', 'WORLD4.LZS', 'WORLD5.LZS', 'WORLD6.LZS', 'WORLD7.LZS', 'WORLD8.LZS', 'WORLD9.LZS'].map(function (fname) {
                return managers.Textures.getTexture(gl, fname);
            });
        };

        Preloader.prototype.compress = function (managers, name) {
            var _this = this;
            var parts = managers.Textures.getImages(name);
            var combinedParts = parts.map(function (part, idx) {
                return _this.compressPart(managers, parts, idx);
            });
            managers.Textures.setImages(name, combinedParts);
        };

        Preloader.prototype.compressPart = function (managers, parts, upTo) {
            var minX = Infinity, maxX = -Infinity;
            var minY = Infinity, maxY = -Infinity;
            for (var i = 0; i <= upTo; i++) {
                var p = parts[i];
                minX = Math.min(p.XOffset, minX);
                maxX = Math.max(p.XOffset + p.Canvas.width, maxX);
                minY = Math.min(p.YOffset, minY);
                maxY = Math.max(p.YOffset + p.Canvas.height, maxY);
            }

            var cvs = managers.Canvas.getCanvas();
            cvs.width = maxX - minX;
            cvs.height = maxY - minY;

            var ctx = cvs.getContext('2d');
            for (var i = 0; i <= upTo; i++) {
                var p = parts[i];
                ctx.drawImage(p.Canvas, p.XOffset - minX, p.YOffset - minY);
            }

            return new Images.ImageFragment(cvs, parts[0].Palette, minX, minY);
        };
        return Preloader;
    })();
    Images.Preloader = Preloader;
})(Images || (Images = {}));
var Images;
(function (Images) {
    var ImageFragment = (function () {
        function ImageFragment(c, palette, x, y) {
            this.Canvas = c;
            this.Palette = palette;
            this.XOffset = x;
            this.YOffset = y;
        }
        return ImageFragment;
    })();
    Images.ImageFragment = ImageFragment;

    var PixelMap = (function () {
        function PixelMap(x, y, w, h, data) {
            this.XOffset = x;
            this.YOffset = y;
            this.Width = w;
            this.Height = h;
            this.Data = data;
        }
        return PixelMap;
    })();

    var AnimLoader = (function () {
        function AnimLoader(managers) {
            this.managers = managers;
        }
        AnimLoader.prototype.load = function (stream) {
            var helper = new LoaderHelper(this.managers);

            var colorMap = null;
            var pixelMap = null;

            var reader = new Data.BinaryReader(stream);
            var expectedAnim = reader.getFixedLengthString(4);
            if (expectedAnim != "ANIM") {
                throw "Unexpected Ident: " + expectedAnim;
            }

            var numFrames = reader.getUint16();

            //First we read a CMAP (always)
            var ident = reader.getFixedLengthString(4);
            if (ident !== "CMAP") {
                throw "Unexpected ident: " + ident;
            }

            colorMap = helper.loadColorMap(reader);

            var remainingInFrame = 0;
            var frame = [];
            var frames = [frame];
            var pc = 0;

            for (var frameIdx = 0; frameIdx < numFrames; frameIdx++) {
                var numParts = reader.getUint16();
                for (var partIdx = 0; partIdx < numParts; partIdx++) {
                    var ident = reader.getFixedLengthString(4);
                    if (ident !== "PICT") {
                        throw "Unexpected ident: " + ident;
                    }
                    pixelMap = helper.loadPixelMap(reader);
                    stream.setPosition(Math.ceil(stream.getPosition() / 8) * 8);
                    frame.push(helper.assembleImage(false, colorMap, pixelMap));
                }
                if (frame.length > 0) {
                    frame = [];
                    frames.push(frame);
                }
            }

            return frames;
        };
        return AnimLoader;
    })();
    Images.AnimLoader = AnimLoader;

    var DirectImageLoader = (function () {
        function DirectImageLoader(managers) {
            this.managers = managers;
        }
        DirectImageLoader.prototype.loadFromStream = function (stream, streamPos, palette, count, xOff, yOff, width, height) {
            stream.setPosition(streamPos);
            var reader = new Data.BinaryReader(stream);

            var fragments = [];
            for (var i = 0; i < count; i++) {
                var data = [];
                for (var j = 0; j < width * height; j++) {
                    data.push(reader.getUint8());
                }

                var pm = new PixelMap(xOff, yOff, width, height, data);
                var helper = new LoaderHelper(this.managers);
                fragments.push(helper.assembleImage(true, palette, pm));
            }

            return fragments;
        };
        return DirectImageLoader;
    })();
    Images.DirectImageLoader = DirectImageLoader;

    var ImageSetLoader = (function () {
        function ImageSetLoader(managers) {
            this.managers = managers;
        }
        ImageSetLoader.prototype.load = function (stream) {
            var helper = new LoaderHelper(this.managers);
            var colorMap = null;
            var pixelMap = null;
            var results = [];

            var reader = new Data.BinaryReader(stream);

            while (!stream.eof()) {
                var ident = reader.getFixedLengthString(4);
                if (ident == "CMAP") {
                    colorMap = helper.loadColorMap(reader);
                } else if (ident == "PICT") {
                    pixelMap = helper.loadPixelMap(reader);
                    stream.setPosition(Math.ceil(stream.getPosition() / 8) * 8);

                    if (colorMap != null && pixelMap != null) {
                        results.push(helper.assembleImage(false, colorMap, pixelMap));
                    }
                } else {
                    throw "Unexpected ident: " + ident;
                }
            }

            return results;
        };
        return ImageSetLoader;
    })();
    Images.ImageSetLoader = ImageSetLoader;

    var DatLoader = (function () {
        function DatLoader(managers) {
            this.managers = managers;
        }
        DatLoader.prototype.load = function (stream) {
            var results = [];
            var helper = new LoaderHelper(this.managers);
            var colorMap = [null, new Data.Color(97, 0, 93), new Data.Color(113, 0, 101)];
            var reader = new Data.BinaryReader(stream);

            reader.getUint16(); //Skip
            var offset = reader.getUint16() == 0x2C ? 0x22 : 0xA;
            stream.setPosition(offset * 2 * 8);
            while (!reader.eof()) {
                var position = reader.getUint16();
                var w = reader.getUint8(), h = reader.getUint8();
                var pixels = [];
                for (var i = 0; i < w * h; i++) {
                    pixels.push(reader.getUint8());
                }

                results.push(helper.assembleImage(false, colorMap, new PixelMap(position % 320, Math.floor(position / 320), w, h, pixels)));
            }
            return results;
        };
        return DatLoader;
    })();
    Images.DatLoader = DatLoader;

    var LoaderHelper = (function () {
        function LoaderHelper(managers) {
            this.managers = managers;
        }
        LoaderHelper.prototype.loadColorMap = function (reader) {
            var colors = [];
            var colorCount = reader.getUint8();
            for (var i = 0; i < colorCount; i++) {
                colors.push(new Data.Color(reader.getUint8() * 4, reader.getUint8() * 4, reader.getUint8() * 4));
            }

            reader.getBits(16 * colorCount); //Skip these.  Not sure :-\

            return colors;
        };

        LoaderHelper.prototype.loadPixelMap = function (reader) {
            var offset = reader.getUint16();
            var h = reader.getUint16(), w = reader.getUint16();

            if (h == 0) {
                h = 1;
            }

            var stream2 = new Data.BinaryReader(new Data.CompressedByteStream(reader));
            var data = [];
            var pixelCount = w * h;

            for (var i = 0; i < pixelCount; i++) {
                data.push(stream2.getUint8());
            }

            return new PixelMap(offset % 320, offset / 320, w, h, data);
        };

        LoaderHelper.prototype.assembleImage = function (noTransparentPixels, colorMap, pixelMap) {
            var w = pixelMap.Width, h = pixelMap.Height;

            var canvas = this.managers.Canvas.getCanvas();
            canvas.width = w;
            canvas.height = h;

            var ctx = canvas.getContext('2d');
            var data = ctx.getImageData(0, 0, w, h);

            var pixelCount = w * h;
            for (var i = 0; i < pixelCount; i++) {
                var pi = pixelMap.Data[i];
                var px = colorMap[pi];
                if (px && pi > 0) {
                    data.data[i * 4 + 0] = px.R;
                    data.data[i * 4 + 1] = px.G;
                    data.data[i * 4 + 2] = px.B;
                }
                data.data[i * 4 + 3] = noTransparentPixels || (pi != 0) ? 255 : 0;
            }

            ctx.putImageData(data, 0, 0);
            return new ImageFragment(canvas, colorMap, pixelMap.XOffset, pixelMap.YOffset);
        };
        return LoaderHelper;
    })();
})(Images || (Images = {}));
/// <reference path="../Data/Color.ts" />
var Levels;
(function (Levels) {
    (function (TouchEffect) {
        TouchEffect[TouchEffect["None"] = 0] = "None";
        TouchEffect[TouchEffect["Accelerate"] = 1] = "Accelerate";
        TouchEffect[TouchEffect["Decelerate"] = 2] = "Decelerate";
        TouchEffect[TouchEffect["Kill"] = 3] = "Kill";
        TouchEffect[TouchEffect["Slide"] = 4] = "Slide";
        TouchEffect[TouchEffect["RefillOxygen"] = 5] = "RefillOxygen";
    })(Levels.TouchEffect || (Levels.TouchEffect = {}));
    var TouchEffect = Levels.TouchEffect;

    var CubeColors = (function () {
        function CubeColors(left, right, top, front) {
            this.Left = left;
            this.Right = right;
            this.Top = top;
            this.Front = front;
        }
        return CubeColors;
    })();
    Levels.CubeColors = CubeColors;

    var CubeProperties = (function () {
        function CubeProperties(height, colors, effect) {
            this.Height = height;
            this.Colors = colors;
            this.Effect = effect;
        }
        return CubeProperties;
    })();
    Levels.CubeProperties = CubeProperties;

    var TileProperties = (function () {
        function TileProperties(colors, effect) {
            this.Colors = colors;
            this.Effect = effect;
        }
        return TileProperties;
    })();
    Levels.TileProperties = TileProperties;

    var TunnelProperties = (function () {
        function TunnelProperties(colors) {
            this.TunnelColors = colors;
        }
        return TunnelProperties;
    })();
    Levels.TunnelProperties = TunnelProperties;

    var Cell = (function () {
        function Cell(level, colorIndexLow, colorIndexHigh, colorRaw, flags) {
            this.Tunnel = null;
            this.Cube = null;
            this.Tile = null;
            this.CI = colorRaw;
            if (flags & 1) {
                this.Tunnel = new TunnelProperties(level.getTunnelColors());
            }
            var lowEffect;
            switch (colorIndexLow) {
                case 10:
                    lowEffect = 1 /* Accelerate */;
                    break;
                case 12:
                    lowEffect = 3 /* Kill */;
                    break;
                case 9:
                    lowEffect = 5 /* RefillOxygen */;
                    break;
                case 8:
                    lowEffect = 4 /* Slide */;
                    break;
                case 2:
                    lowEffect = 2 /* Decelerate */;
                    break;
                default:
                    lowEffect = 0 /* None */;
            }
            var highEffect;
            switch (colorIndexHigh) {
                case 10:
                    highEffect = 1 /* Accelerate */;
                    break;
                case 12:
                    highEffect = 3 /* Kill */;
                    break;
                case 9:
                    highEffect = 5 /* RefillOxygen */;
                    break;
                case 8:
                    highEffect = 4 /* Slide */;
                    break;
                case 2:
                    highEffect = 2 /* Decelerate */;
                    break;
                default:
                    highEffect = 0 /* None */;
            }

            if (flags & 6) {
                var height = [80, 100, 100, 100, 120][flags & 6];
                var colors = colorIndexHigh > 0 ? level.getCubeColorsWithTop(colorIndexHigh) : level.getCubeColors();
                this.Cube = new CubeProperties(height, colors, highEffect);
            }

            if (colorIndexLow > 0) {
                this.Tile = new TileProperties(level.getTileColors(colorIndexLow), lowEffect);
            }
        }
        Cell.prototype.isEmpty = function () {
            return this.Cube == null && this.Tile == null && this.Tunnel == null;
        };

        Cell.getEmpty = function () {
            return new Cell(null, 0, 0, 0, 0);
        };
        return Cell;
    })();
    Levels.Cell = Cell;

    var Level = (function () {
        function Level(name, gravity, fuel, oxygen, colors) {
            this.Name = name;
            this.Gravity = gravity;
            this.Fuel = fuel;
            this.Oxygen = oxygen;
            this.Colors = colors;
        }
        Level.prototype.getCell = function (xPos, yPos, zPos) {
            var x = xPos - 95;
            if (x > 322 || x < 0) {
                return Cell.getEmpty();
            }

            var z = Math.floor(Math.floor(zPos * 8.0) / 8);
            x /= 0x2E;
            x = Math.floor(x);

            if (x < this.Cells.length && z < this.Cells[x].length) {
                return this.Cells[x][z];
            } else {
                return Cell.getEmpty();
            }
        };

        Level.prototype.width = function () {
            return this.Cells.length;
        };

        Level.prototype.length = function () {
            return this.Cells[0].length;
        };

        Level.prototype.getTunnelColors = function () {
            return this.Colors.slice(66, 72).reverse();
        };

        Level.prototype.getTileColors = function (startIndex) {
            return new CubeColors(this.Colors[startIndex + 45], this.Colors[startIndex + 30], this.Colors[startIndex], this.Colors[startIndex + 15]);
        };

        Level.prototype.getCubeColors = function () {
            return new CubeColors(this.Colors[64], this.Colors[63], this.Colors[61], this.Colors[62]);
        };

        Level.prototype.getCubeColorsWithTop = function (cTop) {
            return new CubeColors(this.Colors[64], this.Colors[63], this.Colors[cTop], this.Colors[62]);
        };

        Level.prototype.getLength = function () {
            return this.Cells[0].length;
        };

        Level.prototype.getGravityAcceleration = function () {
            return -Math.floor(this.Gravity * 0x1680 / 0x190) / 0x80;
        };

        Level.prototype.isInsideTileY = function (yPos, distFromCenter, cell) {
            distFromCenter = Math.round(distFromCenter);
            if (distFromCenter > 37) {
                return false;
            }

            var tunCeils = [
                0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
                0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
                0x20, 0x1F, 0x1F, 0x1F, 0x1F, 0x1F, 0x1E, 0x1E,
                0x1E, 0x1D, 0x1D, 0x1D, 0x1C, 0x1B, 0x1A, 0x19,
                0x18, 0x16, 0x14, 0x12, 0x11, 0xE];
            var tunLows = [
                0x10, 0x10, 0x10, 0x10, 0x0F, 0x0E, 0x0D, 0x0B,
                0x08, 0x07, 0x06, 0x05, 0x03, 0x03, 0x03, 0x03,
                0x03, 0x03, 0x02, 0x01, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

            var y2 = yPos - 68;
            if (cell.Tunnel != null && cell.Cube == null) {
                return y2 > tunLows[distFromCenter] && y2 < tunCeils[distFromCenter];
            } else if (cell.Tunnel == null && cell.Cube != null) {
                return yPos < cell.Cube.Height;
            } else if (cell.Tunnel != null && cell.Cube != null) {
                return y2 > tunLows[distFromCenter] && yPos < cell.Cube.Height;
            } else {
                return false;
            }
        };

        Level.prototype.isInsideTunnel = function (xPos, yPos, zPos) {
            var leftTile = this.getCell(xPos - 14, yPos, zPos);
            var rightTile = this.getCell(xPos + 14, yPos, zPos);

            if (!leftTile.isEmpty() || !rightTile.isEmpty()) {
                var centerTile = this.getCell(xPos, yPos, zPos);
                var distanceFromCenter = 23 - (xPos - 49) % 46;
                var var_A = -46;
                if (distanceFromCenter < 0) {
                    distanceFromCenter = 1 - distanceFromCenter;
                    var_A = -var_A;
                }

                if (this.isInsideTunnelY(yPos, distanceFromCenter, centerTile)) {
                    return true;
                }

                centerTile = this.getCell(xPos + var_A, yPos, zPos);
                if (this.isInsideTunnelY(yPos, 47 - distanceFromCenter, centerTile)) {
                    return true;
                }
            }
            return false;
        };

        Level.prototype.isInsideTunnelY = function (yPos, distFromCenter, cell) {
            distFromCenter = Math.round(distFromCenter);
            if (distFromCenter > 37) {
                return false;
            }

            var tunCeils = [
                0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
                0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
                0x20, 0x1F, 0x1F, 0x1F, 0x1F, 0x1F, 0x1E, 0x1E,
                0x1E, 0x1D, 0x1D, 0x1D, 0x1C, 0x1B, 0x1A, 0x19,
                0x18, 0x16, 0x14, 0x12, 0x11, 0xE];
            var tunLows = [
                0x10, 0x10, 0x10, 0x10, 0x0F, 0x0E, 0x0D, 0x0B,
                0x08, 0x07, 0x06, 0x05, 0x03, 0x03, 0x03, 0x03,
                0x03, 0x03, 0x02, 0x01, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

            var y2 = yPos - 68;
            return cell.Tunnel != null && cell.Tile != null && y2 < tunLows[distFromCenter] && yPos >= 80;
        };

        Level.prototype.isInsideTile = function (xPos, yPos, zPos) {
            var leftTile = this.getCell(xPos - 14, yPos, zPos);
            var rightTile = this.getCell(xPos + 14, yPos, zPos);

            if (!leftTile.isEmpty() || !rightTile.isEmpty()) {
                if (yPos < 80 && yPos > 0x1e80 / 0x80) {
                    return true;
                }

                if (yPos < 0x2180 / 0x80) {
                    return false;
                }

                var centerTile = this.getCell(xPos, yPos, zPos);
                var distanceFromCenter = 23 - (xPos - 49) % 46;
                var var_A = -46;
                if (distanceFromCenter < 0) {
                    distanceFromCenter = 1 - distanceFromCenter;
                    var_A = -var_A;
                }

                if (this.isInsideTileY(yPos, distanceFromCenter, centerTile)) {
                    return true;
                }

                centerTile = this.getCell(xPos + var_A, yPos, zPos);
                if (this.isInsideTileY(yPos, 47 - distanceFromCenter, centerTile)) {
                    return true;
                }
            }
            return false;
        };
        return Level;
    })();
    Levels.Level = Level;
})(Levels || (Levels = {}));
var Levels;
(function (Levels) {
    var LevelToTableRenderer = (function () {
        function LevelToTableRenderer() {
        }
        LevelToTableRenderer.prototype.convertColors = function (l) {
            var table = document.createElement('table');
            var row = table.insertRow(-1);
            for (var i = 0; i < l.Colors.length; i++) {
                var cell = row.insertCell(-1);
                cell.style.backgroundColor = l.Colors[i].toCss();
                cell.style.color = l.Colors[i].negative().toCss();
                cell.innerHTML = '' + i;
            }

            return table;
        };

        LevelToTableRenderer.prototype.convert = function (l) {
            //Color(0): No tile
            //Color(128): Slidey gray
            //Color(160): Accelerator
            //Color(10): Accelerator
            //Color(12): Kill
            var labels = {
                '1': '1',
                '2': '2',
                '4': '3',
                '8': '4',
                '16': '5',
                '32': '6',
                '64': '7',
                '128': '8'
            };
            function assignColors(el, cols) {
                el.style.color = cols.Top.negative().toCss();
                el.style.backgroundColor = cols.Top.toCss();
                el.style.borderRight = el.style.borderLeft = '1px solid ' + cols.Front.toCss();
                el.style.borderTop = '1px solid ' + cols.Left.toCss();
                el.style.borderBottom = '1px solid ' + cols.Right.toCss();
            }

            var table = document.createElement('table');
            table.className = 'debugTable';
            for (var x = 0; x < l.width(); x++) {
                var row = table.insertRow(-1);

                for (var y = 0; y < l.length(); y++) {
                    var cell = l.Cells[x][y];
                    var ttcell = row.insertCell(-1);
                    var tcell = document.createElement('div');
                    ttcell.appendChild(tcell);
                    tcell.innerHTML = '&nbsp;';
                    tcell.style.backgroundColor = '#000';
                    tcell.style.color = '#000';
                    tcell.style.width = '100px';
                    if (cell.Tile != null) {
                        assignColors(tcell, cell.Tile.Colors);
                        tcell.innerHTML = '' + cell.CI;
                    }
                    if (cell.Tunnel != null) {
                        var tDiv = document.createElement('div');
                        tDiv.innerHTML = 'T';
                        tDiv.style.display = 'inline-block';
                        tDiv.style.backgroundColor = cell.Tunnel.TunnelColors[3].toCss();
                        tDiv.style.color = cell.Tunnel.TunnelColors[3].negative().toCss();
                        tcell.appendChild(tDiv);
                    }
                    if (cell.Cube != null) {
                        var cDiv = document.createElement('div');
                        cDiv.style.display = 'inline-block';
                        assignColors(cDiv, cell.Cube.Colors);
                        cDiv.innerHTML = 'C' + cell.Cube.Height;
                        tcell.appendChild(cDiv);
                    }
                }
            }
            return table;
        };
        return LevelToTableRenderer;
    })();
    Levels.LevelToTableRenderer = LevelToTableRenderer;
})(Levels || (Levels = {}));
var Levels;
(function (Levels) {
    var LevelLoader = (function () {
        function LevelLoader(levelNumber, levelStartByte, levelSize) {
            this.levelNumber = levelNumber;
            this.levelStartByte = levelStartByte;
            this.levelSize = levelSize;
        }
        LevelLoader.prototype.load = function (stream) {
            stream.setPosition(this.levelStartByte * 8);
            var reader = new Data.BinaryReader(stream);
            var gravity = reader.getUint16();
            var fuel = reader.getUint16();
            var oxygen = reader.getUint16();

            var colors = [];
            for (var i = 0; i < 72; i++) {
                colors.push(new Data.Color(reader.getUint8() * 4, reader.getUint8() * 4, reader.getUint8() * 4));
            }

            var bytes = [];
            var stream2 = new Data.BinaryReader(new Data.CompressedByteStream(reader));
            for (var i = 0; i < this.levelSize; i++) {
                bytes.push(stream2.getUint8());
            }

            var levelWidth = 7, levelLength = bytes.length / 2 / levelWidth;

            var level = new Levels.Level(this.levelNumber > 0 ? 'Level ' + this.levelNumber : 'Demo Level', gravity, fuel, oxygen, colors);
            var cells = [];
            for (var x = 0; x < levelWidth; x++) {
                var col = [];
                cells.push(col);
                for (var y = 0; y < levelLength; y++) {
                    var idx = x * 2 + y * 14;
                    var colorLow = bytes[idx] & 0xF, colorHigh = bytes[idx] >> 4, color = colorLow || colorHigh;
                    col.push(new Levels.Cell(level, colorLow, colorHigh, bytes[idx], bytes[idx + 1]));
                }
            }
            level.Cells = cells;
            return level;
        };
        return LevelLoader;
    })();
    Levels.LevelLoader = LevelLoader;

    var MultiLevelLoader = (function () {
        function MultiLevelLoader(stream) {
            this.Levels = [];
            var reader = new Data.BinaryReader(stream);
            var l1Start = reader.getUint16(), l1Size = reader.getUint16();
            var level1StartBit = l1Start * 8;

            var levels = [];
            levels.push(new LevelLoader(0, l1Start, l1Size));
            for (var i = 0; stream.getPosition() < level1StartBit; i++) {
                levels.push(new LevelLoader(i + 1, reader.getUint16(), reader.getUint16()));
            }

            for (var i = 0; i < levels.length; i++) {
                this.Levels.push(levels[i].load(stream));
            }
        }
        return MultiLevelLoader;
    })();
    Levels.MultiLevelLoader = MultiLevelLoader;
})(Levels || (Levels = {}));
var Levels;
(function (Levels) {
    var MeshBuilder = (function () {
        function MeshBuilder() {
            this.CellLength = 46;
            this.CellWidth = 46;
        }
        MeshBuilder.prototype.buildMesh = function (level, includeStars, back) {
            var verts = [];

            var addQuad = function (color, p1, p2, p3, p4) {
                var c = color.toVec3();
                verts.push(new Vertices.Vertex3DC(p1, c));
                verts.push(new Vertices.Vertex3DC(p2, c));
                verts.push(new Vertices.Vertex3DC(p3, c));

                verts.push(new Vertices.Vertex3DC(p3, c));
                verts.push(new Vertices.Vertex3DC(p4, c));
                verts.push(new Vertices.Vertex3DC(p1, c));
            };

            var addCube = function (colors, xLeft, xRight, yBottom, yTop, zStart, zEnd, drawFront, drawLeft, drawRight, drawBack, drawBottom) {
                if (typeof drawBack === "undefined") { drawBack = false; }
                if (typeof drawBottom === "undefined") { drawBottom = false; }
                var ltf = new TSM.vec3([xLeft, yTop, zStart]);
                var rtf = new TSM.vec3([xRight, yTop, zStart]);
                var lbf = new TSM.vec3([xLeft, yBottom, zStart]);
                var rbf = new TSM.vec3([xRight, yBottom, zStart]);
                var ltb = new TSM.vec3([xLeft, yTop, zEnd]);
                var rtb = new TSM.vec3([xRight, yTop, zEnd]);
                var lbb = new TSM.vec3([xLeft, yBottom, zEnd]);
                var rbb = new TSM.vec3([xRight, yBottom, zEnd]);

                if (drawFront) {
                    addQuad(colors.Front, ltf, rtf, rbf, lbf);
                }

                if (drawLeft) {
                    addQuad(colors.Left, ltf, lbf, lbb, ltb);
                }

                if (drawRight) {
                    addQuad(colors.Right, rtf, rbf, rbb, rtb);
                }

                if (drawBottom) {
                    addQuad(colors.Top, lbf, rbf, rbb, lbb);
                }

                addQuad(colors.Top, ltf, rtf, rtb, ltb);
            };

            var tunnelHighRadius = 23, tunnelLowRadius = 20, tunnelRadiusYMultiplier = 0.855, tunnelSegs = 23;
            var generateCurve = function (r, xB, yB, z) {
                var pts = [];
                for (var i = 0; i <= tunnelSegs; i++) {
                    var a = i / tunnelSegs * Math.PI;
                    var x = xB + Math.cos(a) * r;
                    var y = yB + Math.sin(a) * r * tunnelRadiusYMultiplier;
                    pts.push(new TSM.vec3([x, y, z]));
                }
                return pts;
            };
            var connectCurves = function (colors, c1, c2) {
                var segs = c1.length;
                for (var i = 0; i < segs - 1; i++) {
                    addQuad(colors[Math.floor(i / segs * colors.length)], c1[i + 0], c1[i + 1], c2[i + 1], c2[i + 0]);
                }
            };

            var addTunnel = function (t, xLeft, xRight, yBase, zStart, zEnd) {
                var center = (xLeft + xRight) / 2.0;
                var frontLow = generateCurve(tunnelLowRadius, center, yBase, zStart);
                var frontHigh = generateCurve(tunnelHighRadius, center, yBase, zStart);
                var backLow = generateCurve(tunnelLowRadius, center, yBase, zEnd);
                var backHigh = generateCurve(tunnelHighRadius, center, yBase, zEnd);
                var center = (xLeft + xRight) / 2;
                var colors = t.TunnelColors;
                connectCurves(colors, frontLow, backLow);
                connectCurves(colors, frontHigh, backHigh);
                connectCurves([colors[0]], frontLow, frontHigh);
            };

            var addCubeTunnel = function (t, c, xLeft, xRight, yBase, zStart, zEnd, drawLeft, drawRight) {
                var center = (xLeft + xRight) / 2.0;
                var frontLow = generateCurve(tunnelLowRadius, center, yBase, zStart);
                var backLow = generateCurve(tunnelLowRadius, center, yBase, zEnd);
                var center = (xLeft + xRight) / 2;
                connectCurves([c.Colors.Right, c.Colors.Top, c.Colors.Left], frontLow, backLow);

                frontLow.splice(0, 0, new TSM.vec3([xRight, yBase, zStart]));
                frontLow.push(new TSM.vec3([xLeft, yBase, zStart]));
                connectCurves([c.Colors.Front], frontLow, frontLow.map(function (v) {
                    return new TSM.vec3([v.x, c.Height, v.z]);
                }));
                addCube(c.Colors, xLeft, xRight, yBase, c.Height, zStart, zEnd, false, drawLeft, drawRight);
            };

            function getHeight(c) {
                if (c.isEmpty()) {
                    return 0;
                }

                if (c.Cube !== null) {
                    return c.Cube.Height;
                }

                if (c.Tile !== null) {
                    return 80.0;
                }

                return 0;
            }

            for (var z = 0; z < level.getLength(); z++) {
                for (var x = 0; x < 7; x++) {
                    var c = level.Cells[x][z];
                    var xLeft = x * this.CellWidth - this.CellWidth * 3.5;
                    var xRight = xLeft + this.CellWidth;
                    var zStart = -z * 46.0;
                    var zEnd = -(z + 1) * 46.0;

                    var h = getHeight(c);
                    var drawLeft = x === 0 || getHeight(level.Cells[x - 1][z]) < h;
                    var drawRight = x === 6 || getHeight(level.Cells[x + 1][z]) < h;
                    var drawFront = z === 0 || getHeight(level.Cells[x][z - 1]) < h;

                    if (c.Tile != null) {
                        addCube(c.Tile.Colors, xLeft, xRight, 0x2400 / 0x80, 0x2800 / 0x80, zStart, zEnd, drawFront, drawLeft, drawRight);
                    }
                    if (c.Cube != null && c.Tunnel == null) {
                        addCube(c.Cube.Colors, xLeft, xRight, 0x2800 / 0x80, c.Cube.Height, zStart, zEnd, drawFront, drawLeft, drawRight);
                    }
                    if (c.Tunnel != null && c.Cube == null) {
                        addTunnel(c.Tunnel, xLeft, xRight, 0x2800 / 0x80, zStart, zEnd);
                    }
                    if (c.Tunnel != null && c.Cube != null) {
                        //addTunnel(c.Tunnel, xLeft, xRight, 0x2800 / 0x80, zStart, zEnd);
                        addCubeTunnel(c.Tunnel, c.Cube, xLeft, xRight, 0x2800 / 0x80, zStart, zEnd, drawLeft, drawRight);
                    }
                }
            }

            if (includeStars) {
                var cvs = back.Canvas;
                var ctx = cvs.getContext('2d');

                var colorData = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
                for (var i = 0; i < level.getLength() * 0.5; i++) {
                    var xp = (Math.random() < 0.5 ? -1.0 : 1.0) * (Math.random() * 0.5 + 0.5) * 0.5 + 0.5;
                    var yp = Math.random();
                    var zp = Math.random();
                    var posX = (2.0 * xp - 1.0) * 10.0 * this.CellWidth;
                    var posY = yp * (150 - 50) + 50;
                    var posZ = -zp * level.getLength() * this.CellLength;
                    var w = (Math.random() + 1) * this.CellWidth, h = (Math.random() + 1) * 20, l = (Math.random() * 2 + 1) * this.CellLength;

                    var idx = (Math.floor(xp * cvs.width) + Math.floor(yp * cvs.height) * cvs.width) * 4;
                    var color = new Data.Color(colorData[idx + 0], colorData[idx + 1], colorData[idx + 2]);

                    addCube(new Levels.CubeColors(color.scale(0.8), color.scale(0.9), color.scale(0.6), color), posX, posX + w, posY, posY + h, posZ, posZ - l, true, true, true, true, true);
                }
            }

            return verts;
        };
        return MeshBuilder;
    })();
    Levels.MeshBuilder = MeshBuilder;
})(Levels || (Levels = {}));
var Managers;
(function (Managers) {
    var ManagerSet = (function () {
        function ManagerSet(streams, shaders) {
            this.Streams = streams;
            this.Shaders = shaders;
        }
        return ManagerSet;
    })();
    Managers.ManagerSet = ManagerSet;
})(Managers || (Managers = {}));
var Managers;
(function (Managers) {
    var SettingsManager = (function () {
        function SettingsManager(store) {
            this.PlayMusic = true;
            this.Muted = true;
            this.volume = 0.2;
            this.store = store;
            this.Muted = JSON.parse(this.store.getValue('muted') || 'false');
        }
        SettingsManager.prototype.getMuted = function () {
            return this.Muted;
        };

        SettingsManager.prototype.setMuted = function (m) {
            this.Muted = m;
            this.store.setValue('muted', JSON.stringify(m));
        };

        SettingsManager.prototype.getVolume = function () {
            return this.Muted ? 0.0 : this.volume;
        };

        SettingsManager.prototype.wonLevelCount = function (levelNum) {
            var c = this.store.getValue('wonlevel_' + levelNum);
            return parseInt(c) || 0;
        };

        SettingsManager.prototype.incrementWonLevelCount = function (levelNum) {
            this.store.setValue('wonlevel_' + levelNum, '' + (this.wonLevelCount(levelNum) + 1));
        };
        return SettingsManager;
    })();
    Managers.SettingsManager = SettingsManager;
})(Managers || (Managers = {}));
var Managers;
(function (Managers) {
    var ShaderManager = (function () {
        function ShaderManager(streamManager) {
            this.shaders = {};
            this.Shaders = {
                Basic2D: 'basic_2d.',
                TitleEffect2D: 'title_2d.',
                Color3D: 'color_3d.',
                TexturedPerspective: 'texture_p3d.',
                Sprite3D: 'sprite_3d.'
            };
            this.streamManager = streamManager;
        }
        ShaderManager.prototype.getShader = function (gl, shaderName) {
            if (!(shaderName in this.shaders)) {
                this.shaders[shaderName] = new WGL.Shader(gl, this.streamManager.getText(shaderName + 'vs'), this.streamManager.getText(shaderName + 'fs'));
            }
            return this.shaders[shaderName];
        };
        return ShaderManager;
    })();
    Managers.ShaderManager = ShaderManager;
})(Managers || (Managers = {}));
var Managers;
(function (Managers) {
    var SoundManager = (function () {
        function SoundManager(managers) {
            this.sounds = {};
            this.multiSounds = {};
            this.Sounds = {
                Intro: 'INTRO.SND'
            };
            this.streamManager = managers.Streams;
            this.managers = managers;
        }
        SoundManager.prototype.getSound = function (soundName) {
            soundName = soundName.toUpperCase();
            if (!(soundName in this.sounds)) {
                this.sounds[soundName] = new Sounds.SoundEffect(this.managers, this.streamManager.getStream(soundName));
            }
            return this.sounds[soundName];
        };

        SoundManager.prototype.getMultiEffect = function (soundName) {
            soundName = soundName.toUpperCase();
            if (!(soundName in this.multiSounds)) {
                var data = this.streamManager.getStream(soundName);
                var reader = new Data.BinaryReader(data);
                var sfx = [];
                var starts = [reader.getUint16()];
                for (var i = 4; i < starts[0]; i += 2) {
                    starts.push(reader.getUint16());
                }

                for (var i = 0; i < starts.length; i++) {
                    if (i < starts.length - 1) {
                        sfx.push(new Sounds.SoundEffect(this.managers, data, starts[i], starts[i + 1]));
                    } else {
                        sfx.push(new Sounds.SoundEffect(this.managers, data, starts[i]));
                    }
                }
                this.multiSounds[soundName] = sfx;
            }
            return this.multiSounds[soundName];
        };
        return SoundManager;
    })();
    Managers.SoundManager = SoundManager;
})(Managers || (Managers = {}));
var Managers;
(function (Managers) {
    var StreamManager = (function () {
        function StreamManager(provider, basePath) {
            if (typeof basePath === "undefined") { basePath = 'Data/'; }
            this.streams = {};
            this.filterBasePath = 'Data/';
            this.basePath = 'Data/';
            this.provider = provider;
            this.basePath = basePath;
        }
        StreamManager.prototype.load = function (filename) {
            var _this = this;
            var p = P.defer();
            this.provider.load(filename.replace(this.filterBasePath, this.basePath), function (result) {
                _this.streams[filename.toUpperCase().split('/')[1]] = result;
                p.resolve(result);
            });

            return p.promise();
        };

        StreamManager.prototype.loadMultiple = function (filenames) {
            var _this = this;
            var promises = filenames.map(function (f) {
                return _this.load(f);
            });
            return P.when.apply(null, promises);
        };

        StreamManager.prototype.getStream = function (filename) {
            filename = filename.toUpperCase();
            if (!(filename in this.streams)) {
                throw filename + " not loaded";
            }
            return new Data.ArrayBitStream(this.streams[filename]);
        };

        StreamManager.prototype.getRawArray = function (filename) {
            filename = filename.toUpperCase();
            if (!(filename in this.streams)) {
                throw filename + " not loaded";
            }
            return this.streams[filename];
        };

        StreamManager.prototype.getText = function (filename) {
            filename = filename.toUpperCase();
            if (!(filename in this.streams)) {
                throw filename + " not loaded";
            }
            return String.fromCharCode.apply(null, this.streams[filename]);
        };
        return StreamManager;
    })();
    Managers.StreamManager = StreamManager;
})(Managers || (Managers = {}));
var Managers;
(function (Managers) {
    var TextureManager = (function () {
        function TextureManager(managers) {
            this.textures = {};
            this.images = {};
            this.managers = managers;
            this.streamManager = managers.Streams;
        }
        TextureManager.prototype.getImage = function (filename) {
            return this.getImages(filename)[0];
        };

        TextureManager.prototype.getImages = function (filename) {
            filename = filename.toUpperCase();
            if (!(filename in this.images)) {
                var images = null;

                var stream = this.streamManager.getStream(filename);
                if (filename.split('.')[1].toUpperCase() == 'LZS') {
                    var imgLoader = new Images.ImageSetLoader(this.managers);
                    images = imgLoader.load(stream);
                } else {
                    var datLoader = new Images.DatLoader(this.managers);
                    images = datLoader.load(stream);
                }
                this.images[filename] = [images];
            }
            return this.images[filename][0];
        };

        TextureManager.prototype.getTexture = function (gl, filename) {
            return this.getTextures(gl, filename)[0];
        };

        TextureManager.prototype.getTextures = function (gl, filename) {
            filename = filename.toUpperCase();
            if (!(filename in this.textures)) {
                this.textures[filename] = [this.imageFragmentsToTextureFragments(gl, this.getImages(filename))];
            }
            return this.textures[filename][0];
        };

        TextureManager.prototype.getAnim = function (gl, filename) {
            var _this = this;
            filename = filename.toUpperCase();
            if (!(filename in this.textures)) {
                var stream = this.streamManager.getStream(filename);
                var loader = new Images.AnimLoader(this.managers);
                var anim = loader.load(stream);
                this.textures[filename] = anim.map(function (images) {
                    return _this.imageFragmentsToTextureFragments(gl, images);
                });
            }
            return this.textures[filename];
        };

        TextureManager.prototype.setImages = function (filename, imgs) {
            this.images[filename] = [imgs];
        };

        TextureManager.prototype.imageFragmentsToTextureFragments = function (gl, imgs) {
            return imgs.map(function (img) {
                var tex = new WGL.Texture(gl);
                tex.loadData(img.Canvas);
                tex.setFilters(gl.NEAREST, gl.NEAREST);
                return new Drawing.TextureFragment(tex, img.XOffset, img.YOffset, img.Canvas.width, img.Canvas.height);
            });
        };
        return TextureManager;
    })();
    Managers.TextureManager = TextureManager;
})(Managers || (Managers = {}));
var Music;
(function (Music) {
    var Player = (function () {
        function Player(opl, managers) {
            this.currentSong = -1;
            this.opl = opl;
            this.fullData = managers.Streams.getStream('MUZAX.LZS');
            this.stream = null;
        }
        Player.prototype.loadSong = function (n) {
            if (n === this.currentSong) {
                return;
            }
            this.currentSong = n;
            this.fullData.setPosition(n * 6 * 8);
            var reader = new Data.BinaryReader(this.fullData);
            var startPos = reader.getUint16();
            var numInstruments = reader.getUint16();
            var uncompressedLength = reader.getUint16();
            this.data = new Uint8Array(uncompressedLength);

            this.fullData.setPosition(startPos * 8);
            var dstream = new Data.CompressedByteStream(reader);
            var dreader = new Data.BinaryReader(dstream);

            for (var i = 0; i < this.data.length; i++) {
                this.data[i] = dreader.getUint8();
            }

            this.stream = new Data.ArrayBitStream(this.data);
            this.stream.setPosition(numInstruments * 16 * 8);
            this.reader = new Data.BinaryReader(this.stream);
            this.paused = 0;

            for (var i = 0; i < 11; i++) {
                this.opl.stopNote(i);
            }
        };

        Player.prototype.readNote = function () {
            if (this.stream === null) {
                return;
            }

            if (this.paused > 0) {
                this.paused--;
                return;
            }

            while (this.paused == 0) {
                var cmdLow = this.reader.getUint8();
                var cmdHigh = this.reader.getUint8();

                var functionType = cmdLow & 7;
                cmdLow = cmdLow >> 4;

                switch (functionType) {
                    case 0:
                        this.pause(cmdHigh);
                        return;
                    case 1:
                        //Configure instrument
                        this.turnOffNoteOrPlayBase(cmdLow, cmdHigh);
                        this.configureInstrument(cmdLow, cmdHigh);
                        break;
                    case 2:
                        //Play note;
                        this.playNote(cmdLow, cmdHigh);
                        break;
                    case 3:
                        //Turn off note or play base
                        this.turnOffNoteOrPlayBase(cmdLow, cmdHigh);
                        break;
                    case 4:
                        this.playInstrumentEffect(cmdLow, cmdHigh);
                        break;
                    case 5:
                        //Goto save position
                        this.stream.setPosition(this.jumpPos);
                        break;
                    case 6:
                        //Save song position;
                        this.jumpPos = this.stream.getPosition();
                        break;
                    case 7:
                        break;
                }
            }
        };

        Player.prototype.playInstrumentEffect = function (cmdLow, cmdHigh) {
            this.opl.setChannelVolume(cmdLow, (cmdHigh & 0x3F) / 0x3F * -47.25);
        };

        Player.prototype.configureInstrument = function (cmdLow, cmdHigh) {
            var channel = cmdLow;
            var instrumentNum = cmdHigh;

            var instrStream = new Data.ArrayBitStream(this.data);
            instrStream.setPosition(instrumentNum * 16 * 8);
            var instrReader = new Data.BinaryReader(instrStream);

            var configureOSC = function (channelNum, oscNum) {
                var tremolo = instrReader.getUint8();
                var keyScaleLevel = instrReader.getUint8();
                var attackRate = instrReader.getUint8();
                var sustainLevel = instrReader.getUint8();
                var waveForm = instrReader.getUint8();

                var oscDesc = new Music.OscDesc();
                oscDesc.Tremolo = (tremolo & 0x80) > 0;
                oscDesc.Vibrato = (tremolo & 0x40) > 0;
                oscDesc.SoundSustaining = (tremolo & 0x20) > 0;
                oscDesc.KeyScaling = (tremolo & 0x10) > 0; //KSR
                oscDesc.Multiplication = tremolo & 0xF;

                oscDesc.KeyScaleLevel = keyScaleLevel >> 6; //KSL
                oscDesc.OutputLevel = (keyScaleLevel & 0x3F) / 0x3F * -47.25;

                oscDesc.AttackRate = attackRate >> 4;
                oscDesc.DecayRate = attackRate & 0xF;

                oscDesc.SustainLevel = -45.0 * (sustainLevel >> 4) / 0xF;
                oscDesc.ReleaseRate = sustainLevel & 0xF;

                var waveForms = [0 /* Sine */, 1 /* HalfSine */, 2 /* AbsSign */, 3 /* PulseSign */, 4 /* SineEven */, 5 /* AbsSineEven */, 6 /* Square */, 7 /* DerivedSquare */];
                oscDesc.WaveForm = waveForms[waveForm & 7];

                return oscDesc;
            };

            var a = configureOSC(channel, 0);
            var b = configureOSC(channel, 1);
            var channelConfig = instrReader.getUint8();
            var additive = (channelConfig & 1) > 0;
            var feedback = (channelConfig & 14) >> 1;
            this.opl.setChannelConfig(channel, a, b, additive, feedback);
        };

        Player.prototype.pause = function (cmdHigh) {
            this.paused = cmdHigh;
        };

        Player.prototype.turnOffNoteOrPlayBase = function (cmdLow, cmdHigh) {
            var channelNum = cmdLow;
            if (channelNum < 11) {
                this.opl.stopNote(channelNum);
            }
        };

        Player.prototype.playNote = function (low, high) {
            var channels = [0, 1, 2, 3, 4, 5, 6, 7];
            var lowFreqs = [0xAC, 0xB6, 0xC1, 0xCD, 0xD9, 0xE6, 0xF3, 0x02, 0x11, 0x22, 0x33, 0x45];
            var highFreqs = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1];

            var channelNum = low, note = high % 12, octave = Math.floor(high / 12) + 2;
            var blockNum = octave;
            var freqN = (highFreqs[note] << 8) | lowFreqs[note];
            if (channelNum < 6) {
                this.opl.startNote(channelNum, freqN, blockNum);
            } else {
                //Drums
                channelNum -= 6;
                if (channelNum == 0) {
                    //BASE
                    this.opl.startNote(channelNum + 6, freqN, blockNum);
                } else if (channelNum == 1) {
                    //SNARE -- Used in Misty
                    this.opl.startNote(channelNum + 6, freqN, blockNum);
                } else if (channelNum == 2) {
                    //TOM
                    this.opl.startNote(channelNum + 6, freqN, blockNum);
                } else if (channelNum == 3) {
                    //TOP CYMBAL
                    this.opl.startNote(channelNum + 6, freqN, blockNum);
                } else if (channelNum == 4) {
                    //HIGH HAT
                    this.opl.startNote(channelNum + 6, freqN, blockNum);
                }
            }
        };
        return Player;
    })();
    Music.Player = Player;
})(Music || (Music = {}));
var Music;
(function (Music) {
    (function (WaveType) {
        WaveType[WaveType["Sine"] = 0] = "Sine";
        WaveType[WaveType["HalfSine"] = 1] = "HalfSine";
        WaveType[WaveType["AbsSign"] = 2] = "AbsSign";
        WaveType[WaveType["PulseSign"] = 3] = "PulseSign";
        WaveType[WaveType["SineEven"] = 4] = "SineEven";
        WaveType[WaveType["AbsSineEven"] = 5] = "AbsSineEven";
        WaveType[WaveType["Square"] = 6] = "Square";
        WaveType[WaveType["DerivedSquare"] = 7] = "DerivedSquare";
    })(Music.WaveType || (Music.WaveType = {}));
    var WaveType = Music.WaveType;

    (function (KeyState) {
        KeyState[KeyState["Off"] = 0] = "Off";
        KeyState[KeyState["Attack"] = 1] = "Attack";
        KeyState[KeyState["Sustain"] = 2] = "Sustain";
        KeyState[KeyState["Decay"] = 3] = "Decay";
        KeyState[KeyState["Release"] = 4] = "Release";
    })(Music.KeyState || (Music.KeyState = {}));
    var KeyState = Music.KeyState;

    var OscDesc = (function () {
        function OscDesc() {
            this.Tremolo = false;
            this.Vibrato = false;
            this.SoundSustaining = true;
            this.KeyScaling = false;
            this.Multiplication = 1.0;
            this.KeyScaleLevel = 0.0;
            this.OutputLevel = 1.0;
            this.AttackRate = 0;
            this.DecayRate = 0;
            this.SustainLevel = 0;
            this.ReleaseRate = 0;
            this.WaveForm = 0 /* Sine */;
            this.Wave = [];
        }
        return OscDesc;
    })();
    Music.OscDesc = OscDesc;

    var OscState = (function () {
        function OscState() {
            this.Config = new OscDesc();
            this.State = 0 /* Off */;
            this.Volume = 0;
            this.EnvelopeStep = 0;
            this.Angle = 0;
        }
        return OscState;
    })();
    Music.OscState = OscState;

    var Channel = (function () {
        function Channel() {
            this.A = new OscState();
            this.B = new OscState();
            this.Additive = false;
            this.Feedback = 0;
            this.FreqNum = 0.0;
            this.BlockNum = 0.0;
            this.Output0 = 0.0;
            this.Output1 = 0.0;
            this.M1 = 0.0;
            this.M2 = 0.0;
            this.FeedbackFactor = 0.0;
        }
        return Channel;
    })();

    var OPL = (function () {
        function OPL(llap) {
            this.sampleRate = 44100;
            this.src = null;
            this.timeSinceNote = 0;
            this.noteTickRate = 5 / 1000.0;
            this.time = 0.0;
            this.synthTime = 0.0;
            this.timePassed = 0.0;
            this.VMin = -96.0;
            this.VMax = 0.0;
            this.waves = [];
            this.sampleCount = 1024;
            this.channels = [];

            var waveSin = [];
            var waveHalfSin = [];
            var waveAbsSign = [];
            var wavePulseSign = [];
            var waveSineEven = [];
            var waveAbsSineEven = [];
            var waveSquare = [];
            var waveDerivedSquare = [];
            for (var i = 0; i < this.sampleCount; i++) {
                var angle = 2 * Math.PI * i / this.sampleCount;
                var s = Math.sin(angle);
                waveSin.push(s);
                waveHalfSin.push(Math.max(s, 0.0));
                waveAbsSign.push(Math.abs(s));
                wavePulseSign.push(angle % 6.28 < 1.57 ? s : 0.0);
                waveSineEven.push(angle % 12.56 < 6.28 ? s : 0.0);
                waveAbsSineEven.push(angle % 12.56 < 6.28 ? Math.abs(s) : 0.0);
                waveSquare.push(s > 0.0 ? 1.0 : 0.0);
                waveDerivedSquare.push(s > 0.0 ? 1.0 : 0.0);
            }

            this.waves.push(waveSin);
            this.waves.push(waveHalfSin);
            this.waves.push(waveAbsSign);
            this.waves.push(wavePulseSign);
            this.waves.push(waveSineEven);
            this.waves.push(waveAbsSineEven);
            this.waves.push(waveSquare);
            this.waves.push(waveDerivedSquare);

            for (var i = 0; i < 15; i++) {
                this.channels.push(new Channel());
                this.channels[i].ProcessFunc = this.processChannelOutputFM;
            }

            this.sampleRate = 44100;
            llap.runPlayer(this);
        }
        OPL.prototype.setSource = function (mp) {
            this.src = mp;
            for (var i = 0; i < this.channels.length; i++) {
                this.stopNote(i);
            }
        };

        OPL.prototype.setChannelConfig = function (n, a, b, isAdditive, feedbackAmt) {
            if (n >= this.channels.length) {
                return;
            }
            a.Wave = this.waves[a.WaveForm];
            b.Wave = this.waves[b.WaveForm];

            this.channels[n].A.Config = a;
            this.channels[n].B.Config = b;
            this.channels[n].Additive = isAdditive;
            this.channels[n].Feedback = feedbackAmt;
            var v = 0.0;
            var feedbackFactor = feedbackAmt > 0 ? Math.pow(2.0, feedbackAmt + 8) : 0;
            var radiansPerWave = 2 * Math.PI;
            var dbuPerWave = 1024 * 16.0;
            var volAsDbu = 1.0 * 0x4000 * 0x10000 * 1.0 / 0x4000;
            var m2 = radiansPerWave * volAsDbu / dbuPerWave;
            var m1 = m2 / 2.0 / 0x10000;
            this.channels[n].M1 = m1;
            this.channels[n].M2 = m2;
            this.channels[n].FeedbackFactor = feedbackFactor;
            this.channels[n].ProcessFunc = isAdditive ? this.processChannelOutputAdditive : this.processChannelOutputFM;
        };

        OPL.prototype.setChannelVolume = function (n, v) {
            if (n >= this.channels.length) {
                return;
            }
            this.channels[n].B.Config.OutputLevel = v;
        };

        OPL.prototype.startNote = function (channel, freqNum, blockNum) {
            var chan = this.channels[channel];
            function configureOSC(osc) {
                if (chan.FreqNum == freqNum && chan.BlockNum == blockNum && osc.State == 2 /* Sustain */) {
                    return;
                }

                osc.State = 1 /* Attack */;
                osc.EnvelopeStep = 0;
            }

            configureOSC(chan.A);
            configureOSC(chan.B);
            chan.FreqNum = freqNum;
            chan.BlockNum = blockNum;
        };

        OPL.prototype.stopNote = function (channel) {
            var chan = this.channels[channel];
            function configureOSC(osc) {
                if (osc.State == 0 /* Off */) {
                    return;
                }

                osc.State = 4 /* Release */;
            }

            configureOSC(chan.A);
            configureOSC(chan.B);
        };

        OPL.prototype.fillAudioBuffer = function (buffer) {
            var synthOut = 0.0;

            if (this.src == null) {
                for (var i = 0; i < buffer.length; i++) {
                    buffer[i] = 0;
                }
                return true;
            }

            this.timePassed = 1.0 / this.sampleRate;
            for (var i = 0; i < buffer.length; i++) {
                this.timeSinceNote += this.timePassed;

                if (this.timeSinceNote > this.noteTickRate) {
                    this.src.readNote();
                    this.timeSinceNote -= this.noteTickRate;
                }

                this.time += this.timePassed;
                this.synthTime += this.timePassed;
                while (this.synthTime >= Music.OPLConstants.SampleTime) {
                    synthOut = 0.0;
                    for (var j = 0; j < this.channels.length; j++) {
                        synthOut += this.channels[j].ProcessFunc.call(this, this.channels[j]);
                    }
                    this.synthTime -= Music.OPLConstants.SampleTime;
                }

                buffer[i] = synthOut / 2.0;
            }

            return true;
        };

        OPL.prototype.processChannelOutputAdditive = function (c) {
            var a = this.processOsc(c.A, c.FreqNum, c.BlockNum, (c.Output0 + c.Output1) * c.FeedbackFactor * c.M1);
            var b = this.processOsc(c.B, c.FreqNum, c.BlockNum, 0.0);
            c.Output1 = c.Output0;
            c.Output0 = a;
            return a + b;
        };

        OPL.prototype.processChannelOutputFM = function (c) {
            var a = this.processOsc(c.A, c.FreqNum, c.BlockNum, (c.Output0 + c.Output1) * c.FeedbackFactor * c.M1);
            var b = this.processOsc(c.B, c.FreqNum, c.BlockNum, a * c.M2);
            c.Output1 = c.Output0;
            c.Output0 = a;
            return b;
        };

        OPL.prototype.processOsc = function (osc, freqNum, blockNum, modulator) {
            var state = osc.State;
            var conf = osc.Config;

            if (state == 0 /* Off */) {
                return 0.0;
            }

            //TODO: Proper KEYBOARD SPLIT SECTION Implementation - pg.43
            //Actual OutputLevel
            //Actual KSR/KSS etc
            //Feedback modulation
            //Tremelo
            //Vibrato
            var keyScaleNum = blockNum * 2 + (freqNum >> 7);
            var rof = conf.KeyScaling ? keyScaleNum : Math.floor(keyScaleNum / 4);

            function getRate(n) {
                return Math.min(n > 0 ? rof + n * 4 : 0, 63);
            }

            switch (osc.State) {
                case 1 /* Attack */:
                    var rate = getRate(conf.AttackRate);
                    var timeToAttack = Music.OPLConstants.AttackRates[rate];
                    if (timeToAttack == 0) {
                        osc.Volume = this.VMax;
                        osc.EnvelopeStep = 0;
                        osc.State = 3 /* Decay */;
                    } else if (timeToAttack == null) {
                        osc.State = 0 /* Off */;
                    } else {
                        var p = 3.0;
                        var steps = Math.floor(timeToAttack / 1000.0 / Music.OPLConstants.SampleTime);
                        osc.Volume = -96.0 * Math.pow((steps - osc.EnvelopeStep) / steps, p);
                        osc.EnvelopeStep++;
                        if (osc.EnvelopeStep >= steps) {
                            osc.EnvelopeStep = 0;
                            osc.Volume = this.VMax;
                            osc.State = 3 /* Decay */;
                        }
                    }
                    break;
                case 3 /* Decay */:
                    var rate = getRate(conf.DecayRate);
                    var timeToDecay = Music.OPLConstants.DecayRates[rate];
                    if (timeToDecay === 0) {
                        osc.Volume = conf.SustainLevel;
                        osc.EnvelopeStep = 0;
                        osc.State = 2 /* Sustain */;
                    } else if (timeToDecay !== null) {
                        var steps = Math.floor(timeToDecay / 1000.0 / Music.OPLConstants.SampleTime);
                        var decreaseAmt = conf.SustainLevel / steps;
                        osc.Volume += decreaseAmt;
                        osc.EnvelopeStep++;
                        if (osc.EnvelopeStep >= steps) {
                            osc.EnvelopeStep = 0;
                            osc.State = 2 /* Sustain */;
                        }
                    }
                    break;
                case 2 /* Sustain */:
                    if (!conf.SoundSustaining) {
                        osc.State = 4 /* Release */;
                    }
                    break;
                case 4 /* Release */:
                    var rate = getRate(conf.ReleaseRate);
                    var timeToRelease = Music.OPLConstants.DecayRates[rate];
                    var steps = Math.floor(timeToRelease / 1000.0 / Music.OPLConstants.SampleTime);
                    var decreaseAmt = (this.VMin - conf.SustainLevel) / steps;
                    osc.Volume += decreaseAmt;
                    osc.EnvelopeStep++;
                    if (osc.EnvelopeStep == steps) {
                        osc.Volume = this.VMin;
                        osc.State = 0 /* Off */;
                    }
                    break;
            }

            var ksDamping = 0;
            if (osc.Config.KeyScaleLevel > 0) {
                var kslm = Music.OPLConstants.KeyScaleMultipliers[conf.KeyScaleLevel];
                ksDamping = -kslm * Music.OPLConstants.KeyScaleLevels[blockNum][freqNum >> 6];
            }

            var freq = Music.OPLConstants.FreqStarts[blockNum] + Music.OPLConstants.FreqSteps[blockNum] * freqNum;
            freq *= (conf.Multiplication == 0 ? 0.5 : conf.Multiplication);

            var vib = conf.Vibrato ? Math.cos(this.time * 2 * Math.PI) * 0.00004 + 1.0 : 1.0;
            osc.Angle += Music.OPLConstants.SampleTime * 2 * Math.PI * freq * vib;

            var angle = osc.Angle + modulator;
            var a2 = Math.abs(angle) % (2 * Math.PI);
            var wave = conf.Wave[Math.floor(a2 * this.sampleCount / 2 / Math.PI)];

            var tremolo = conf.Tremolo ? Math.abs(Math.cos(this.time * Math.PI * 3.7)) * 1 : 0.0;
            return wave * Math.pow(10.0, (osc.Volume + conf.OutputLevel + tremolo + ksDamping) / 10.0);
        };
        return OPL;
    })();
    Music.OPL = OPL;
})(Music || (Music = {}));
var Music;
(function (Music) {
    var OPLConstants = (function () {
        function OPLConstants() {
        }
        OPLConstants.SampleRate = 49700;
        OPLConstants.SampleTime = 1.0 / OPLConstants.SampleRate;
        OPLConstants.AttackRates = [
            null,
            null,
            null,
            null,
            2826.24,
            2252.80,
            1884.16,
            1597.44,
            1413.12,
            1126.40,
            942.08,
            798.72,
            706.56,
            563.20,
            471.04,
            399.36,
            353.28,
            281.60,
            235.52,
            199.68,
            176.76,
            140.80,
            117.76,
            99.84,
            88.32,
            70.40,
            58.88,
            49.92,
            44.16,
            35.20,
            29.44,
            24.96,
            22.08,
            17.60,
            14.72,
            12.48,
            11.04,
            8.8,
            7.36,
            6.24,
            5.52,
            4.40,
            3.68,
            3.12,
            2.76,
            2.20,
            1.84,
            1.56,
            1.40,
            1.12,
            0.92,
            0.80,
            0.70,
            0.56,
            0.46,
            0.42,
            0.38,
            0.30,
            0.24,
            0.20,
            0.00,
            0.00,
            0.00,
            0.00
        ];

        OPLConstants.DecayRates = [
            null, null, null, null,
            39280.64,
            31416.32,
            26173.44,
            22446.08,
            19640.32,
            15708.16,
            13086.72,
            11223.04,
            9820.16,
            7854.08,
            6543.36,
            5611.52,
            4910.08,
            3927.04,
            3271.68,
            2805.76,
            2455.04,
            1936.52,
            1635.84,
            1402.88,
            1227.52,
            981.76,
            817.92,
            701.44,
            613.76,
            490.88,
            488.96,
            350.72,
            306.88,
            245.44,
            204.48,
            175.36,
            153.44,
            122.72,
            102.24,
            87.68,
            76.72,
            61.36,
            51.12,
            43.84,
            38.36,
            30.68,
            25.56,
            21.92,
            19.20,
            15.36,
            12.80,
            10.96,
            9.60,
            7.68,
            6.40,
            5.48,
            4.80,
            3.84,
            3.20,
            2.74,
            2.40,
            2.40,
            2.40,
            2.40
        ];

        OPLConstants.KeyScaleLevels = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0.750, 1.125, 1.5, 1.875, 2.250, 2.625, 3.0],
            [0, 0, 0, 0, 0, 1.875, 3.0, 4.125, 4.875, 5.625, 6.0, 6.750, 7.125, 7.5, 7.875, 8.250, 8.625, 9.0],
            [0, 0, 0, 1.875, 3.0, 4.125, 4.875, 5.625, 6.0, 6.750, 7.125, 7.5, 7.875, 8.250, 8.625, 9.0],
            [0, 0, 3.0, 4.875, 6.0, 7.125, 7.875, 8.625, 9.0, 9.750, 10.125, 10.5, 10.875, 11.25, 11.625, 12.0],
            [0, 3.0, 6.0, 7.875, 9.0, 10.125, 10.875, 1.625, 12.0, 12.750, 13.125, 13.5, 13.875, 14.250, 14.625, 15.0],
            [0, 6.0, 9.0, 10.875, 12.0, 13.125, 13.875, 14.625, 15.0, 15.750, 16.125, 16.5, 16.875, 17.25, 17.625, 18],
            [0, 9.0, 12.0, 13.875, 15.0, 16.125, 16.875, 17.625, 18.0, 18.750, 19.125, 19.5, 19.875, 20.250, 20.625, 21.0]
        ];

        OPLConstants.FreqStarts = [0.047, 0.094, 0.189, 0.379, 0.758, 1.517, 3.034, 6.068];
        OPLConstants.FreqSteps = [0.048, 0.095, 0.190, 0.379, 0.759, 1.517, 3.034, 6.069];

        OPLConstants.KeyScaleMultipliers = [0, 1.0, 0.5, 2.0];
        return OPLConstants;
    })();
    Music.OPLConstants = OPLConstants;
})(Music || (Music = {}));
var RefPhysics;
(function (RefPhysics) {
    var Ship = (function () {
        function Ship(xPosition, yPosition, zPosition) {
            this.xPosition = xPosition;
            this.yPosition = yPosition;
            this.zPosition = zPosition;
        }
        Ship.prototype.getXPosition = function () {
            return this.xPosition;
        };

        Ship.prototype.getYPosition = function () {
            return this.yPosition;
        };

        Ship.prototype.getZPosition = function () {
            return this.zPosition;
        };
        return Ship;
    })();
    RefPhysics.Ship = Ship;
})(RefPhysics || (RefPhysics = {}));
var RefPhysics;
(function (RefPhysics) {
    function sFloor(n) {
        var s = n >= 0 ? 1 : -1;
        return Math.floor(n * s) * s;
    }

    var StateManager = (function () {
        function StateManager(managers, level, controller) {
            this.level = null;
            this.controller = null;
            this.isGoingUp = false;
            this.hasRunJumpOMaster = false;
            this.jumpOMasterInUse = false;
            this.jumpOMasterVelocityDelta = 0.0;
            this.didWin = false;
            this.Log = '';
            this.lastJumpZ = 0.0;
            this.level = level;
            this.controller = controller;
            this.sounds = managers.Sounds.getMultiEffect('SFX.SND');

            this.resetStateVars();
        }
        StateManager.prototype.resetStateVars = function () {
            this.gravityAcceleration = -Math.floor(this.level.Gravity * 0x1680 / 0x190) / 0x80;
            this.currentZPosition = 3.0;
            this.currentXPosition = 0x8000 / 0x80;
            this.currentYPosition = 0x2800 / 0x80;

            this.slideAmount = 0;
            this.xMovementBase = 0;
            this.yVelocity = 0;
            this.zVelocity = 0;

            this.fuelRemaining = 0x7530;
            this.oxygenRemaining = 0x7530;

            this.craftState = 0;
            this.isDead = false;

            this.isOnGround = true;
            this.isOnDecelPad = false;
            this.isOnSlidingTile = false;
            this.isGoingUp = false;

            this.offsetAtWhichNotInsideTile = 0;
            this.jumpedFromYPosition = 0;
        };

        StateManager.prototype.currentPosToPosition = function () {
            var _this = this;
            return { getXPosition: function () {
                    return _this.currentXPosition;
                }, getYPosition: function () {
                    return _this.currentYPosition;
                }, getZPosition: function () {
                    return _this.currentZPosition;
                } };
        };

        StateManager.prototype.getPos = function (x, y, z) {
            return { getXPosition: function () {
                    return x;
                }, getYPosition: function () {
                    return y;
                }, getZPosition: function () {
                    return z;
                } };
        };

        StateManager.prototype.sanitizeFP32 = function (n) {
            return Math.floor(n * 0x10000) / 0x10000;
        };

        StateManager.prototype.sanitizeFP16 = function (n) {
            return Math.floor(n * 0x80) / 0x80;
        };

        StateManager.prototype.sanitizeVars = function () {
            this.currentXPosition = Math.round(this.currentXPosition * 0x80) / 0x80;
            this.currentYPosition = Math.round(this.currentYPosition * 0x80) / 0x80;
            this.currentZPosition = Math.round(this.currentZPosition * 0x10000) / 0x10000;

            this.expectedXPosition = Math.round(this.expectedXPosition * 0x80) / 0x80;
            this.expectedYPosition = Math.round(this.expectedYPosition * 0x80) / 0x80;
            this.expectedZPosition = Math.round(this.expectedZPosition * 0x10000) / 0x10000;
        };
        StateManager.prototype.runFrame = function () {
            var controls = this.controller.update(this.currentPosToPosition());
            this.sanitizeVars();

            var canControl = this.craftState !== 4 && this.craftState !== 5;

            //LOC 2308
            this.logBP2308(controls); //DEAD

            /*
            if (this.currentZPosition >= 0x40 + 0x63a5 / 0x10000) {
            debugger;
            }*/
            var cell = this.level.getCell(this.currentXPosition, this.currentYPosition, this.currentZPosition);
            var isAboveNothing = cell.isEmpty();
            var touchEffect = 0 /* None */;

            this.isOnSlidingTile = false;
            this.isOnDecelPad = false;

            if (this.isOnGround) {
                var y = this.currentYPosition;
                if (Math.floor(y) == 0x2800 / 0x80 && cell.Tile != null) {
                    touchEffect = cell.Tile.Effect;
                } else if (Math.floor(y) > 0x2800 / 0x80 && cell.Cube != null && cell.Cube.Height == y) {
                    touchEffect = cell.Cube.Effect;
                }
                this.logBP2369(controls, touchEffect);
                this.applyTouchEffect(touchEffect);
                this.isOnSlidingTile = touchEffect === 4 /* Slide */;
                this.isOnDecelPad = touchEffect === 2 /* Decelerate */;
            }

            if (this.currentZPosition >= this.level.getLength()) {
                //TODO: Game ending.  Are we in a tunnel?
            }

            //LOC 2405
            if (Math.abs(this.expectedYPosition - this.currentYPosition) > 0.01) {
                if (this.slideAmount == 0 || this.offsetAtWhichNotInsideTile >= 2) {
                    var yvel = Math.abs(this.yVelocity);
                    if (yvel > (this.level.Gravity * 0x104 / 8 / 0x80)) {
                        if (this.yVelocity < 0) {
                            this.sounds[1].play();
                        }
                        this.yVelocity = -0.5 * this.yVelocity;
                    } else {
                        this.yVelocity = 0;
                    }
                } else {
                    this.yVelocity = 0;
                }
            }

            //LOC 249E
            this.zVelocity += (canControl ? controls.AccelInput : 0) * 0x4B / 0x10000;
            this.clampGlobalZVelocity();

            //LOC 250F
            if (!this.isOnSlidingTile) {
                var canControl1 = (this.isGoingUp || isAboveNothing) && this.xMovementBase === 0 && this.yVelocity > 0 && (this.currentYPosition - this.jumpedFromYPosition) < 30;
                var canControl2 = !this.isGoingUp && !isAboveNothing;
                if (canControl1 || canControl2) {
                    this.xMovementBase = (canControl ? controls.TurnInput * 0x1D / 0x80 : 0);
                }
            }

            //LOC 2554
            if (!this.isGoingUp && !isAboveNothing && controls.JumpInput && this.level.Gravity < 0x14 && canControl) {
                this.yVelocity = 0x480 / 0x80;
                this.isGoingUp = true;
                this.jumpedFromYPosition = this.currentYPosition;
                this.lastJumpZ = this.currentZPosition;
            }

            //LOC 2590
            //Something to do with the craft hitting max-height.
            if (this.isGoingUp && !this.hasRunJumpOMaster && this.currentYPosition >= 110) {
                this.runJumpOMaster(controls);
                this.hasRunJumpOMaster = true;
            }

            //LOC 25C9
            if (this.currentYPosition >= 0x28) {
                this.yVelocity += this.gravityAcceleration;
                this.yVelocity = sFloor(this.yVelocity * 0x80) / 0x80;
            } else if (this.yVelocity > -105 / 0x80) {
                this.yVelocity = -105 / 0x80;
            }

            //LOC 2619
            this.expectedZPosition = this.isDead ? this.currentZPosition : this.currentZPosition + this.zVelocity;
            var motionVel = this.zVelocity;
            if (!this.isOnDecelPad) {
                motionVel += 0x618 / 0x10000;
            }
            var xMotion = sFloor(this.xMovementBase * 0x80) * sFloor(motionVel * 0x10000) / 0x10000 + this.slideAmount;
            this.expectedXPosition = this.isDead ? this.currentXPosition : this.currentXPosition + xMotion;
            this.expectedYPosition = this.isDead ? this.currentYPosition : this.currentYPosition + this.yVelocity;

            //LOC 2699
            var minX = 0x2F80 / 0x80, maxX = 0xD080 / 0x80;
            var currentX = this.currentXPosition, newX = this.expectedXPosition;
            if ((currentX < minX && newX > maxX) || (newX < minX && currentX > maxX)) {
                this.expectedXPosition = currentX;
            }

            //LOC 26BE
            this.sanitizeVars();
            this.logBP26C7(controls); //CAFE
            this.moveShipAndConstraint();
            this.sanitizeVars();
            this.logBP26CD(controls); //FEED

            if (this.currentZPosition != this.expectedZPosition && this.isInsideTile(this.currentXPosition, this.currentYPosition, this.expectedZPosition)) {
                var bumpOff = 0x3a0 / 0x80;
                if (!this.isInsideTile(this.currentXPosition - bumpOff, this.currentYPosition, this.expectedZPosition)) {
                    this.currentXPosition -= bumpOff;
                    this.expectedZPosition = this.currentZPosition;
                    this.sounds[2].play();
                } else if (!this.isInsideTile(this.currentXPosition + bumpOff, this.currentYPosition, this.expectedZPosition)) {
                    this.currentXPosition += bumpOff;
                    this.expectedZPosition = this.currentZPosition;
                    this.sounds[2].play();
                }
            }

            //LOC 2787
            if (Math.abs(this.currentZPosition - this.expectedZPosition) > 0.01) {
                if (this.zVelocity < 1.0 / 3.0 * 0x2aaa / 0x10000) {
                    this.zVelocity = 0.0;
                    this.sounds[2].play();
                } else if (!this.isDead) {
                    this.isDead = true;
                    this.craftState = 1; //Exploded
                    this.sounds[0].play();
                }
            }

            //LOC 2820
            if (Math.abs(this.currentXPosition - this.expectedXPosition) > 0.01) {
                this.xMovementBase = 0.0;
                if (this.slideAmount !== 0.0) {
                    this.expectedXPosition = this.currentXPosition;
                    this.slideAmount = 0.0;
                }
                this.zVelocity -= 0x97 / 0x10000;
                this.clampGlobalZVelocity();
            }

            //LOC 28BB
            this.isOnGround = false;
            if (this.yVelocity < 0 && this.expectedYPosition != this.currentYPosition) {
                this.zVelocity += this.jumpOMasterVelocityDelta;
                this.jumpOMasterVelocityDelta = 0.0;
                this.hasRunJumpOMaster = false;
                this.jumpOMasterInUse = false;

                this.isGoingUp = false;
                this.isOnGround = true;
                this.slidingAccel = 0;

                for (var i = 1; i <= 0xE; i++) {
                    if (!this.isInsideTile(this.currentXPosition + i, this.currentYPosition - 1.0 / 0x80, this.currentZPosition)) {
                        this.slidingAccel++;
                        this.offsetAtWhichNotInsideTile = i;
                        break;
                    }
                }

                for (var i = 1; i <= 0xE; i++) {
                    if (!this.isInsideTile(this.currentXPosition - i, this.currentYPosition - 1.0 / 0x80, this.currentZPosition)) {
                        this.slidingAccel--;
                        this.offsetAtWhichNotInsideTile = i;
                        break;
                    }
                }

                if (this.slidingAccel != 0) {
                    this.slideAmount += 0x11 * this.slidingAccel / 0x80;
                } else {
                    this.slideAmount = 0;
                }
            }

            //LOC 2A23 -- Deplete Oxygen
            this.oxygenRemaining -= 0x7530 / (0x24 * this.level.Oxygen);
            if (this.oxygenRemaining <= 0) {
                this.oxygenRemaining = 0;
                this.craftState = 5;
            }

            //LOC 2A4E -- Deplete fuel
            this.fuelRemaining -= this.zVelocity * 0x7530 / this.level.Fuel;
            if (this.fuelRemaining <= 0) {
                this.fuelRemaining = 0;
                this.craftState = 4;
            }

            if (this.currentZPosition >= this.level.getLength() - 0.5 && this.isInsideTunnel(this.currentXPosition, this.currentYPosition, this.currentZPosition)) {
                this.didWin = true;
            }
        };

        StateManager.prototype.applyTouchEffect = function (effect) {
            switch (effect) {
                case 1 /* Accelerate */:
                    this.zVelocity += 0x12F / 0x10000;
                    break;
                case 2 /* Decelerate */:
                    this.zVelocity -= 0x12F / 0x10000;
                    break;
                case 3 /* Kill */:
                    this.isDead = true;
                    break;
                case 5 /* RefillOxygen */:
                    if (this.craftState === 0) {
                        if (this.fuelRemaining < 0x6978 || this.oxygenRemaining < 0x6978) {
                            this.sounds[4].play();
                        }

                        this.fuelRemaining = 0x7530;
                        this.oxygenRemaining = 0x7530;
                    }
                    break;
            }
            this.clampGlobalZVelocity();
        };

        StateManager.prototype.clampGlobalZVelocity = function () {
            this.zVelocity = this.clampZVelocity(this.zVelocity);
        };

        StateManager.prototype.clampZVelocity = function (z) {
            return Math.min(Math.max(0.0, z), 0x2AAA / 0x10000);
        };

        StateManager.prototype.isInsideTileY = function (yPos, distFromCenter, cell) {
            distFromCenter = Math.round(distFromCenter);
            if (distFromCenter > 37) {
                return false;
            }

            var tunCeils = [
                0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
                0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
                0x20, 0x1F, 0x1F, 0x1F, 0x1F, 0x1F, 0x1E, 0x1E,
                0x1E, 0x1D, 0x1D, 0x1D, 0x1C, 0x1B, 0x1A, 0x19,
                0x18, 0x16, 0x14, 0x12, 0x11, 0xE];
            var tunLows = [
                0x10, 0x10, 0x10, 0x10, 0x0F, 0x0E, 0x0D, 0x0B,
                0x08, 0x07, 0x06, 0x05, 0x03, 0x03, 0x03, 0x03,
                0x03, 0x03, 0x02, 0x01, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

            var y2 = yPos - 68;
            if (cell.Tunnel != null && cell.Cube == null) {
                return y2 > tunLows[distFromCenter] && y2 < tunCeils[distFromCenter];
            } else if (cell.Tunnel == null && cell.Cube != null) {
                return yPos < cell.Cube.Height;
            } else if (cell.Tunnel != null && cell.Cube != null) {
                return y2 > tunLows[distFromCenter] && yPos < cell.Cube.Height;
            } else {
                return false;
            }
        };

        StateManager.prototype.isInsideTile = function (xPos, yPos, zPos) {
            var leftTile = this.level.getCell(xPos - 14, yPos, zPos);
            var rightTile = this.level.getCell(xPos + 14, yPos, zPos);

            if (!leftTile.isEmpty() || !rightTile.isEmpty()) {
                if (yPos < 80 && yPos > 0x1e80 / 0x80) {
                    return true;
                }

                if (yPos < 0x2180 / 0x80) {
                    return false;
                }

                var centerTile = this.level.getCell(xPos, yPos, zPos);
                var distanceFromCenter = 23 - (xPos - 49) % 46;
                var var_A = -46;
                if (distanceFromCenter < 0) {
                    distanceFromCenter = 1 - distanceFromCenter;
                    var_A = -var_A;
                }

                if (this.isInsideTileY(yPos, distanceFromCenter, centerTile)) {
                    return true;
                }

                centerTile = this.level.getCell(xPos + var_A, yPos, zPos);
                if (this.isInsideTileY(yPos, 47 - distanceFromCenter, centerTile)) {
                    return true;
                }
            }
            return false;
        };

        StateManager.prototype.isInsideTunnelY = function (yPos, distFromCenter, cell) {
            distFromCenter = Math.round(distFromCenter);
            if (distFromCenter > 37) {
                return false;
            }

            var tunCeils = [
                0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
                0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
                0x20, 0x1F, 0x1F, 0x1F, 0x1F, 0x1F, 0x1E, 0x1E,
                0x1E, 0x1D, 0x1D, 0x1D, 0x1C, 0x1B, 0x1A, 0x19,
                0x18, 0x16, 0x14, 0x12, 0x11, 0xE];
            var tunLows = [
                0x10, 0x10, 0x10, 0x10, 0x0F, 0x0E, 0x0D, 0x0B,
                0x08, 0x07, 0x06, 0x05, 0x03, 0x03, 0x03, 0x03,
                0x03, 0x03, 0x02, 0x01, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

            var y2 = yPos - 68;
            return cell.Tunnel != null && cell.Tile != null && y2 < tunLows[distFromCenter] && yPos >= 80;
        };

        StateManager.prototype.isInsideTunnel = function (xPos, yPos, zPos) {
            var leftTile = this.level.getCell(xPos - 14, yPos, zPos);
            var rightTile = this.level.getCell(xPos + 14, yPos, zPos);

            if (!leftTile.isEmpty() || !rightTile.isEmpty()) {
                var centerTile = this.level.getCell(xPos, yPos, zPos);
                var distanceFromCenter = 23 - (xPos - 49) % 46;
                var var_A = -46;
                if (distanceFromCenter < 0) {
                    distanceFromCenter = 1 - distanceFromCenter;
                    var_A = -var_A;
                }

                if (this.isInsideTunnelY(yPos, distanceFromCenter, centerTile)) {
                    return true;
                }

                centerTile = this.level.getCell(xPos + var_A, yPos, zPos);
                if (this.isInsideTunnelY(yPos, 47 - distanceFromCenter, centerTile)) {
                    return true;
                }
            }
            return false;
        };

        StateManager.prototype.moveShipAndConstraint = function () {
            var _this = this;
            if (this.currentXPosition == this.expectedXPosition && this.currentYPosition == this.expectedYPosition && this.currentZPosition == this.expectedZPosition) {
                return;
            }

            var iter = 1;
            var interp16 = function (a, b) {
                return _this.sanitizeFP16((b - a) * iter / 5 + a);
            };
            var interp32 = function (a, b) {
                return _this.sanitizeFP32((b - a) * iter / 5 + a);
            };
            for (iter = 1; iter <= 5; iter++) {
                if (this.isInsideTile(interp16(this.currentXPosition, this.expectedXPosition), interp16(this.currentYPosition, this.expectedYPosition), interp32(this.currentZPosition, this.expectedZPosition))) {
                    break;
                }
            }

            iter--; //We care about the list iter we were *NOT* inside a tile
            this.currentXPosition = interp16(this.currentXPosition, this.expectedXPosition);
            this.currentYPosition = interp16(this.currentYPosition, this.expectedYPosition);
            this.currentZPosition = interp32(this.currentZPosition, this.expectedZPosition);

            var zGran = 0x1000 / 0x10000;

            while (zGran != 0) {
                //LOC 18F2
                if (this.expectedZPosition - this.currentZPosition >= zGran && !this.isInsideTile(this.currentXPosition, this.currentYPosition, this.currentZPosition + zGran)) {
                    this.currentZPosition += zGran;
                } else {
                    zGran /= 0x10;
                    zGran = Math.floor(zGran * 0x10000) / 0x10000;
                }
            }

            this.currentZPosition = this.sanitizeFP32(this.currentZPosition);

            var xGran = this.expectedXPosition > this.currentXPosition ? (0x7D / 0x80) : (-0x7D / 0x80);
            while (Math.abs(xGran) > 0) {
                if (Math.abs(this.expectedXPosition - this.currentXPosition) >= Math.abs(xGran) && !this.isInsideTile(this.currentXPosition + xGran, this.currentYPosition, this.currentZPosition)) {
                    this.currentXPosition += xGran;
                } else {
                    xGran = sFloor(xGran / 5.0 * 0x80) / 0x80;
                }
            }

            this.currentXPosition = this.sanitizeFP16(this.currentXPosition);

            var yGran = this.expectedYPosition > this.currentYPosition ? (0x7D / 0x80) : (-0x7D / 0x80);
            while (Math.abs(yGran) > 0) {
                if (Math.abs(this.expectedYPosition - this.currentYPosition) >= Math.abs(yGran) && !this.isInsideTile(this.currentXPosition, this.currentYPosition + yGran, this.currentZPosition)) {
                    this.currentYPosition += yGran;
                } else {
                    yGran = sFloor(yGran / 5.0 * 0x80) / 0x80;
                }
            }

            this.currentYPosition = this.sanitizeFP16(this.currentYPosition);
        };

        StateManager.prototype.runJumpOMaster = function (controls) {
            if (this.willLandOnTile(controls, this.currentXPosition, this.currentYPosition, this.currentZPosition, this.xMovementBase, this.yVelocity, this.zVelocity)) {
                return;
            }

            var zVelocity = this.zVelocity;
            var xMov = this.xMovementBase;
            var i;
            for (i = 1; i <= 6; i++) {
                this.xMovementBase = this.sanitizeFP16(xMov + xMov * i / 10);
                if (this.willLandOnTile(controls, this.currentXPosition, this.currentYPosition, this.currentZPosition, this.xMovementBase, this.yVelocity, this.zVelocity)) {
                    break;
                }

                this.xMovementBase = this.sanitizeFP16(xMov - xMov * i / 10);
                if (this.willLandOnTile(controls, this.currentXPosition, this.currentYPosition, this.currentZPosition, this.xMovementBase, this.yVelocity, this.zVelocity)) {
                    break;
                }

                this.xMovementBase = xMov;

                var zv2 = this.sanitizeFP32(zVelocity + zVelocity * i / 10);
                this.zVelocity = this.clampZVelocity(zv2);
                if (this.zVelocity == zv2) {
                    if (this.willLandOnTile(controls, this.currentXPosition, this.currentYPosition, this.currentZPosition, this.xMovementBase, this.yVelocity, this.zVelocity)) {
                        break;
                    }
                }

                zv2 = this.sanitizeFP32(zVelocity - zVelocity * i / 10);
                this.zVelocity = this.clampZVelocity(zv2);
                if (this.zVelocity == zv2) {
                    if (this.willLandOnTile(controls, this.currentXPosition, this.currentYPosition, this.currentZPosition, this.xMovementBase, this.yVelocity, this.zVelocity)) {
                        break;
                    }
                }

                this.zVelocity = zVelocity;
            }

            this.jumpOMasterVelocityDelta = zVelocity - this.zVelocity;
            if (i <= 6) {
                this.jumpOMasterInUse = true;
            }
        };

        StateManager.prototype.isOnNothing = function (xPosition, zPosition) {
            var cell = this.level.getCell(xPosition, 0, zPosition);
            return cell.isEmpty() || (cell.Tile != null && cell.Tile.Effect == 3 /* Kill */);
        };

        StateManager.prototype.willLandOnTile = function (controls, xPos, yPos, zPos, xVelocity, yVelocity, zVelocity) {
            while (true) {
                var currentX = xPos;
                var currentSlideAmount = this.slideAmount;
                var currentZ = zPos;

                yVelocity += this.gravityAcceleration;
                zPos += zVelocity;

                var xRate = zVelocity + 0x618 / 0x10000;
                var xMov = xVelocity * xRate * 128 + currentSlideAmount;
                xPos += xMov;
                if (xPos < 0x2F80 / 0x80 || xPos > 0xD080 / 0x80) {
                    return false;
                }

                yPos += yVelocity;
                zVelocity = this.clampZVelocity(zVelocity + controls.AccelInput * 0x4B / 0x10000);

                if (yPos <= 0x2800 / 0x80) {
                    return !this.isOnNothing(currentX, currentZ) && !this.isOnNothing(xPos, zPos);
                }
            }
        };

        StateManager.prototype.logBP2308 = function (controls) {
            this.logString('BP2308_IDENT=dead');
            this.logLongList(controls);
        };

        StateManager.prototype.logBP2369 = function (controls, te) {
            this.logString('BP2369_IDENT=beef');
        };

        StateManager.prototype.logBP26C7 = function (controls) {
            this.logString('BP26C7_IDENT=cafe');
            this.logLongList(controls);
        };

        StateManager.prototype.logBP26CD = function (controls) {
            this.logString('BP26CD_IDENT=feed');
            this.logLongList(controls);
        };

        StateManager.prototype.logLongList = function (controls) {
            this.logInt('InAccel', controls.AccelInput);
            this.logInt('InTurn', controls.TurnInput);
            this.logInt('InJump', controls.JumpInput ? 1 : 0);
            this.logFP16('CurrentX', this.currentXPosition);
            this.logFP16('CurrentY', this.currentYPosition);
            this.logFP32('CurrentZHigh', 'CurrentZLow', this.currentZPosition);
            this.logFP16('XMovementBase', this.xMovementBase); //Should this be FP 16?
            this.logFP16('YVelocity', this.yVelocity);
            this.logFP32LH('ZVelocity', this.zVelocity);
            this.logFP16('ExpectedX', this.expectedXPosition);
            this.logFP16('ExpectedY', this.expectedYPosition);
            this.logFP32('ExpectedZHigh', 'ExpectedZLow', this.expectedZPosition);
        };

        StateManager.prototype.toHexBytes = function (n) {
            return n.toString(16).toLowerCase();
        };

        StateManager.prototype.logFP16 = function (name, n) {
            n = Math.floor(n * 0x80);
            if (n < 0) {
                n = 0x10000 + n;
            }
            this.logString(name.toUpperCase() + '=' + this.toHexBytes(n));
        };

        StateManager.prototype.logFP32 = function (nameHigh, nameLow, n) {
            var high = Math.floor(n), low = Math.floor((n - high) * 0x10000);
            this.logString(nameHigh.toUpperCase() + '=' + this.toHexBytes(high));
            this.logString(nameLow.toUpperCase() + '=' + this.toHexBytes(low));
        };

        StateManager.prototype.logFP32LH = function (name, n) {
            n = Math.floor(n * 0x10000);
            this.logString(name.toUpperCase() + '=' + this.toHexBytes(n));
        };

        StateManager.prototype.logInt = function (name, n) {
            if (n < 0) {
                n = 0xffff;
            }
            this.logString(name.toUpperCase() + '=' + this.toHexBytes(n));
        };

        StateManager.prototype.logString = function (s) {
            this.Log += s + '\n';
        };
        return StateManager;
    })();
    RefPhysics.StateManager = StateManager;
})(RefPhysics || (RefPhysics = {}));
var Shaders;
(function (Shaders) {
    var ClassicShaderProvider = (function () {
        function ClassicShaderProvider() {
        }
        ClassicShaderProvider.prototype.get2DSprite = function (gl, managers, texture) {
            return new Drawing.Sprite(gl, managers, texture);
        };

        ClassicShaderProvider.prototype.get3DSprite = function (gl, managers, texture) {
            return new Drawing.Sprite(gl, managers, texture);
        };

        ClassicShaderProvider.prototype.getMesh = function (gl, managers, vertices) {
            return new Drawing.Mesh(gl, managers, vertices);
        };

        ClassicShaderProvider.prototype.getState2DDrawer = function (gl) {
            return new Engine.ClassicState2DDrawer();
        };

        ClassicShaderProvider.prototype.getState3DDrawer = function (gl) {
            return new Engine.ClassicState3DDrawer();
        };
        return ClassicShaderProvider;
    })();
    Shaders.ClassicShaderProvider = ClassicShaderProvider;
})(Shaders || (Shaders = {}));
var Shaders;
(function (Shaders) {
    var VRShaderProvider = (function () {
        function VRShaderProvider() {
        }
        VRShaderProvider.prototype.get2DSprite = function (gl, managers, texture) {
            return new Drawing.Sprite(gl, managers, texture);
        };

        VRShaderProvider.prototype.get3DSprite = function (gl, managers, texture) {
            return new Drawing.Sprite(gl, managers, texture, managers.Shaders.getShader(gl, managers.Shaders.Shaders.Sprite3D));
        };

        VRShaderProvider.prototype.getMesh = function (gl, managers, vertices) {
            return new Drawing.Mesh(gl, managers, vertices, managers.Shaders.getShader(gl, managers.Shaders.Shaders.TexturedPerspective));
        };

        VRShaderProvider.prototype.getState2DDrawer = function (gl, managers) {
            return new Engine.VRState2DDrawer(managers);
        };

        VRShaderProvider.prototype.getState3DDrawer = function (gl, managers) {
            return new Engine.VRState3DDrawer(managers);
        };
        return VRShaderProvider;
    })();
    Shaders.VRShaderProvider = VRShaderProvider;
})(Shaders || (Shaders = {}));
var Sounds;
(function (Sounds) {
    var InThreadAudioProvider = (function () {
        function InThreadAudioProvider(base, player) {
            this.base = base;
            this.player = player;
        }
        InThreadAudioProvider.prototype.createPlayable = function (buffer) {
            return this.base.createPlayable(buffer);
        };

        InThreadAudioProvider.prototype.playSong = function (n) {
            this.player.loadSong(n);
        };

        InThreadAudioProvider.prototype.setGain = function (gain) {
            this.base.setGain(gain);
        };
        return InThreadAudioProvider;
    })();
    Sounds.InThreadAudioProvider = InThreadAudioProvider;
})(Sounds || (Sounds = {}));
var Sounds;
(function (Sounds) {
    var PortAudioPlayer = (function () {
        function PortAudioPlayer(audio, buffer) {
            this.position = 0;
            this.audio = audio;
            this.buffer = buffer;
            this.audio.runPlayer(this);
        }
        PortAudioPlayer.prototype.fillAudioBuffer = function (buff) {
            var start = this.position, end = start + buff.length, readEnd = Math.min(end, this.buffer.length);
            for (var i = start; i < readEnd; i++) {
                buff[i - start] = this.buffer[i];
            }
            this.position += buff.length;
            if (end === readEnd) {
                return this.position < this.buffer.length;
            } else {
                for (var i = readEnd; i < end; i++) {
                    buff[i - start] = 0;
                }
                return false;
            }
        };
        return PortAudioPlayer;
    })();

    var PortAudioPlayable = (function () {
        function PortAudioPlayable(audio, buffer) {
            this.audio = audio;
            this.buffer = buffer;
        }
        PortAudioPlayable.prototype.play = function () {
            new PortAudioPlayer(this.audio, this.buffer);
        };
        return PortAudioPlayable;
    })();
    var PortAudioAudioProvider = (function () {
        function PortAudioAudioProvider() {
            var _this = this;
            this.players = [];
            this.gain = 0;
            this.buffer = null;
            var audio = require('./Node/node_modules/node-core-audio');
            this.engine = audio.createNewAudioEngine();
            this.engine.setOptions({ inputChannels: 1, outputChannels: 1, interleaved: true, numSamples: 1024, numBuffers: 4, useMicrophone: false });
            this.engine.addAudioCallback(function (chans) {
                return _this.fillBuffer(chans);
            });
        }
        PortAudioAudioProvider.prototype.createPlayable = function (buffer) {
            return new PortAudioPlayable(this, buffer);
        };

        PortAudioAudioProvider.prototype.runPlayer = function (player) {
            this.players.push(player);
        };

        PortAudioAudioProvider.prototype.setGain = function (gain) {
            this.gain = gain;
        };

        PortAudioAudioProvider.prototype.fillBuffer = function (inBuf) {
            if (this.buffer === null) {
                this.buffer = new Float32Array(inBuf.length);
            }

            var out = inBuf;
            var len = out.length;
            var gain = this.gain;
            var buff = this.buffer;
            var players = this.players;

            for (var i = 0; i < len; i++) {
                out[i] = 0;
            }

            for (var i = 0; i < players.length; i++) {
                var p = players[i];
                if (!p.fillAudioBuffer(buff)) {
                    players.splice(i, 1);
                    i--;
                }

                for (var j = 0; j < len; j++) {
                    out[j] += Math.max(-1.0, Math.min(1.0, buff[j] * this.gain));
                }
            }

            return out;
        };
        return PortAudioAudioProvider;
    })();
    Sounds.PortAudioAudioProvider = PortAudioAudioProvider;
    ;
})(Sounds || (Sounds = {}));
var Sounds;
(function (Sounds) {
    var SoundEffect = (function () {
        function SoundEffect(managers, stream, start, end) {
            if (typeof start === "undefined") { start = 0; }
            if (typeof end === "undefined") { end = 0; }
            this.managers = managers;

            var numBytes = (end || stream.getLength() / 8) - start;
            stream.setPosition(start * 8);
            var reader = new Data.BinaryReader(stream);

            var scaledLength = Math.floor(numBytes * 44100 / 8000);

            var bufferArr = new Float32Array(numBytes);
            for (var i = 0; i < numBytes; i++) {
                bufferArr[i] = (reader.getUint8() - 127) / 128.0;
            }

            var scaledBufferArr = new Float32Array(scaledLength);
            for (var i = 0; i < scaledBufferArr.length; i++) {
                scaledBufferArr[i] = bufferArr[Math.floor(i * numBytes / scaledLength)];
            }

            this.playable = managers.Audio.createPlayable(scaledBufferArr);
        }
        SoundEffect.prototype.play = function () {
            this.playable.play();
        };
        return SoundEffect;
    })();
    Sounds.SoundEffect = SoundEffect;
})(Sounds || (Sounds = {}));
var Sounds;
(function (Sounds) {
    var WebAPIPlayable = (function () {
        function WebAPIPlayable(ctx, buff, dst) {
            if (ctx) {
                var buffer = ctx.createBuffer(1, buff.length, 44100);
                buffer.getChannelData(0).set(buff);

                this.ctx = ctx;
                this.buffer = buffer;
                this.dst = dst;
            }
        }
        WebAPIPlayable.prototype.play = function () {
            if (this.ctx) {
                var source = this.ctx.createBufferSource();
                source.buffer = this.buffer;
                source.connect(this.dst);
                source.start(0);
            }
        };
        return WebAPIPlayable;
    })();

    var WebAPIAudioProvider = (function () {
        function WebAPIAudioProvider(ctx) {
            this.players = [];
            this.playerNodes = [];
            this.ctx = ctx;
            if (this.ctx) {
                this.dest = ctx.createGain();
                this.dest.gain.value = 0.0;
                this.dest.connect(ctx.destination);
            }
        }
        WebAPIAudioProvider.prototype.createPlayable = function (buffer) {
            return new WebAPIPlayable(this.ctx, buffer, this.dest);
        };

        WebAPIAudioProvider.prototype.runPlayer = function (player) {
            if (this.ctx) {
                var node = this.ctx.createScriptProcessor(1024, 1, 1);
                node.onaudioprocess = function (evt) {
                    return player.fillAudioBuffer(evt.outputBuffer.getChannelData(0));
                };
                node.connect(this.dest);
                this.players.push(player);
                this.playerNodes.push(node);
            }
        };

        WebAPIAudioProvider.prototype.setGain = function (gain) {
            if (this.ctx) {
                this.dest.gain.value = gain;
            }
        };
        return WebAPIAudioProvider;
    })();
    Sounds.WebAPIAudioProvider = WebAPIAudioProvider;
    ;
})(Sounds || (Sounds = {}));
var Sounds;
(function (Sounds) {
    var playSongCommand = 'PlaySong';
    var createPlayableCommand = 'CreatePlayable';
    var playPlayableCommand = 'PlayPlayable';
    var setGainCommand = 'SetGain';

    var SetGainCommand = (function () {
        function SetGainCommand(gain) {
            this.Command = setGainCommand;
            this.Gain = gain;
        }
        return SetGainCommand;
    })();
    Sounds.SetGainCommand = SetGainCommand;

    var PlaySongCommand = (function () {
        function PlaySongCommand(songNumber) {
            this.Command = playSongCommand;
            this.SongNumber = 0;
            this.SongNumber = songNumber;
        }
        return PlaySongCommand;
    })();
    Sounds.PlaySongCommand = PlaySongCommand;

    var CreatePlayableCommand = (function () {
        function CreatePlayableCommand(id, buffer) {
            this.Command = createPlayableCommand;
            this.Id = id;
            this.Buffer = buffer;
        }
        return CreatePlayableCommand;
    })();
    Sounds.CreatePlayableCommand = CreatePlayableCommand;

    var PlayPlayableCommand = (function () {
        function PlayPlayableCommand(id) {
            this.Command = playPlayableCommand;
            this.Id = id;
        }
        return PlayPlayableCommand;
    })();
    Sounds.PlayPlayableCommand = PlayPlayableCommand;

    var ChildProcessAudioServer = (function () {
        function ChildProcessAudioServer(baseProvider, musicPlayer) {
            var _this = this;
            this.playables = {};
            this.provider = baseProvider;
            this.musicPlayer = musicPlayer;

            process.on('message', function (evt) {
                switch (evt.Command) {
                    case playSongCommand:
                        var psEvt = evt;
                        _this.musicPlayer.loadSong(psEvt.SongNumber);
                        break;
                    case createPlayableCommand:
                        var cpEvt = evt;
                        var p = _this.provider.createPlayable(cpEvt.Buffer);
                        _this.playables[cpEvt.Id] = p;
                        break;
                    case playPlayableCommand:
                        var ppEvt = evt;
                        if (ppEvt.Id in _this.playables) {
                            _this.playables[ppEvt.Id].play();
                        }
                        break;
                    case setGainCommand:
                        var sgEvt = evt;
                        _this.provider.setGain(sgEvt.Gain);
                }
            });
        }
        return ChildProcessAudioServer;
    })();
    Sounds.ChildProcessAudioServer = ChildProcessAudioServer;
})(Sounds || (Sounds = {}));
var Sounds;
(function (Sounds) {
    var ChildProcessPlayable = (function () {
        function ChildProcessPlayable(id, worker) {
            this.id = id;
            this.worker = worker;
        }
        ChildProcessPlayable.prototype.play = function () {
            try  {
                this.worker.send(new Sounds.PlayPlayableCommand(this.id));
            } catch (ex) {
                console.log('Audio exception on play');
                console.log(ex);
            }
        };
        return ChildProcessPlayable;
    })();

    var ChildProcessDummyPlayable = (function () {
        function ChildProcessDummyPlayable() {
        }
        ChildProcessDummyPlayable.prototype.play = function () {
        };
        return ChildProcessDummyPlayable;
    })();

    var ChildProcessAudioProvider = (function () {
        function ChildProcessAudioProvider(worker) {
            this.worker = worker;
        }
        ChildProcessAudioProvider.prototype.createPlayable = function (buffer) {
            var id = ChildProcessAudioProvider.pId;
            ChildProcessAudioProvider.pId++;

            try  {
                var playable = new ChildProcessPlayable(id, this.worker);
                this.worker.send(new Sounds.CreatePlayableCommand(id, buffer));
                return playable;
            } catch (ex) {
                console.log('Audio exception on  createPlayable');
                console.log(ex);
                return new ChildProcessDummyPlayable();
            }
        };

        ChildProcessAudioProvider.prototype.playSong = function (n) {
            try  {
                this.worker.send(new Sounds.PlaySongCommand(n));
            } catch (ex) {
                console.log('Audio exception on playSong');
                console.log(n);
            }
        };

        ChildProcessAudioProvider.prototype.setGain = function (gain) {
            try  {
                this.worker.send(new Sounds.SetGainCommand(gain));
            } catch (ex) {
                console.log('Audio exception on setGain');
                console.log(ex);
            }
        };
        ChildProcessAudioProvider.pId = 0;
        return ChildProcessAudioProvider;
    })();
    Sounds.ChildProcessAudioProvider = ChildProcessAudioProvider;
})(Sounds || (Sounds = {}));
var States;
(function (States) {
    var ControlsMenu = (function (_super) {
        __extends(ControlsMenu, _super);
        function ControlsMenu(managers) {
            _super.call(this, managers);
            this.watchers = [];
            this.myManagers = managers;
        }
        ControlsMenu.prototype.load = function (gl) {
            var _this = this;
            _super.prototype.load.call(this, gl);
            var managers = this.myManagers;
            this.menu = managers.Textures.getTextures(gl, "SETMENU.LZS").map(function (tf) {
                return new Drawing.Sprite(gl, managers, tf);
            });
            var controls = managers.Controls;
            this.watchers.push(new Controls.ConditionWatcher(function () {
                return controls.getLeft();
            }, function () {
                return _this.updateMenu(false);
            }));
            this.watchers.push(new Controls.ConditionWatcher(function () {
                return controls.getRight();
            }, function () {
                return _this.updateMenu(true);
            }));
            this.watchers.push(new Controls.ConditionWatcher(function () {
                return controls.getExit();
            }, function () {
                return _this.exitMenu();
            }));
            this.myManagers.Audio.playSong(1);
        };

        ControlsMenu.prototype.unload = function () {
        };

        ControlsMenu.prototype.updateMenu = function (mute) {
            this.myManagers.Settings.setMuted(mute);
        };

        ControlsMenu.prototype.exitMenu = function () {
            this.myManagers.Frames.popState();
        };

        ControlsMenu.prototype.updatePhysics = function (frameManager, frameTimeInfo) {
            for (var i = 0; i < this.watchers.length; i++) {
                this.watchers[i].update(frameTimeInfo);
            }
        };

        ControlsMenu.prototype.drawFrame2D = function (gl, canvas, frameManager, frameTimeInfo) {
            this.menu[0].draw();
            this.menu[this.myManagers.Settings.getMuted() ? 5 : 4].draw();
        };
        return ControlsMenu;
    })(Engine.State2D);
    States.ControlsMenu = ControlsMenu;
})(States || (States = {}));
var States;
(function (States) {
    var EmptyState = (function () {
        function EmptyState(managers) {
            this.managers = managers;
        }
        EmptyState.prototype.load = function (gl) {
            var managers = this.managers;
        };

        EmptyState.prototype.unload = function () {
        };

        EmptyState.prototype.updatePhysics = function (frameManager, frameTimeInfo) {
        };

        EmptyState.prototype.drawFrame = function (gl, canvas, frameManager, frameTimeInfo) {
            var helper = new States.ClassicGLStateHelper();
            helper.startFrame(gl, canvas);
        };
        return EmptyState;
    })();
    States.EmptyState = EmptyState;
})(States || (States = {}));
var States;
(function (States) {
    var Fade2D = (function (_super) {
        __extends(Fade2D, _super);
        function Fade2D(managers, start, drawState, runPhysicsFirst) {
            _super.call(this, managers);
            this.myManagers = managers;
            this.position = start;
            this.direction = start > 0.5 ? -1.0 : 1.0;
            this.drawState = drawState;
            this.firstFrame = runPhysicsFirst;
        }
        Fade2D.prototype.load = function (gl) {
            _super.prototype.load.call(this, gl);

            var blackTex = new WGL.Texture(gl);
            var cvs = this.myManagers.Canvas.getCanvas();
            cvs.width = 32;
            cvs.height = 32;

            var ctx = cvs.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, cvs.width, cvs.height);

            blackTex.loadData(cvs);
            blackTex.setFilters(gl.NEAREST, gl.NEAREST);

            var blackFrag = new Drawing.TextureFragment(blackTex, 0, 0, 320, 200);
            this.back = new Drawing.Sprite(gl, this.myManagers, blackFrag);
            this.back.Alpha = 1.0 - this.position;
        };

        Fade2D.prototype.unload = function () {
        };

        Fade2D.prototype.updatePhysics = function (frameManager, frameTimeInfo) {
            this.position += this.direction * frameTimeInfo.getPhysicsStep();
            if (this.position <= 0.0 || this.position >= 1.0) {
                frameManager.popState();
            } else {
                this.back.Alpha = 1.0 - this.position;
            }
            if (this.firstFrame) {
                this.drawState.updatePhysics(frameManager, frameTimeInfo);
                this.firstFrame = false;
            }
        };

        Fade2D.prototype.drawFrame2D = function (gl, canvas, frameManager, frameTimeInfo, cam) {
            this.drawState.drawFrame2D(gl, canvas, frameManager, frameTimeInfo, cam);
            this.back.draw();
        };
        return Fade2D;
    })(Engine.State2D);
    States.Fade2D = Fade2D;
})(States || (States = {}));
var States;
(function (States) {
    //TODO: Refactor out the common logic between Fade3D and Fade2D
    var Fade3D = (function (_super) {
        __extends(Fade3D, _super);
        function Fade3D(managers, start, drawState, runPhysicsFirst) {
            _super.call(this, managers);
            this.myManagers = managers;
            this.position = start;
            this.direction = start > 0.5 ? -1.0 : 1.0;
            this.drawState = drawState;
            this.firstFrame = runPhysicsFirst;
        }
        Fade3D.prototype.load = function (gl) {
            _super.prototype.load.call(this, gl);

            var blackTex = new WGL.Texture(gl);
            var cvs = this.myManagers.Canvas.getCanvas();
            cvs.width = 32;
            cvs.height = 32;

            var ctx = cvs.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, cvs.width, cvs.height);

            blackTex.loadData(cvs);
            blackTex.setFilters(gl.NEAREST, gl.NEAREST);

            var blackFrag = new Drawing.TextureFragment(blackTex, 0, 0, 320, 200);
            this.back = new Drawing.Sprite(gl, this.myManagers, blackFrag);
            this.back.Alpha = 1.0 - this.position;
        };

        Fade3D.prototype.unload = function () {
        };

        Fade3D.prototype.updatePhysics = function (frameManager, frameTimeInfo) {
            this.position += this.direction * frameTimeInfo.getPhysicsStep();
            if (this.position <= 0.0 || this.position >= 1.0) {
                frameManager.popState();
            } else {
                this.back.Alpha = 1.0 - this.position;
            }
            if (this.firstFrame) {
                this.drawState.updatePhysics(frameManager, frameTimeInfo);
                this.firstFrame = false;
            }
        };

        Fade3D.prototype.drawFrame3D = function (gl, canvas, frameManager, frameTimeInfo, cam) {
            this.drawState.drawFrame3D(gl, canvas, frameManager, frameTimeInfo, cam);
            this.back.draw();
        };
        return Fade3D;
    })(Engine.State3D);
    States.Fade3D = Fade3D;
})(States || (States = {}));
var States;
(function (States) {
    var GameState = (function (_super) {
        __extends(GameState, _super);
        function GameState(managers, levelNum, controller) {
            _super.call(this, managers);
            this.timeBeforeFade = 1.0;
            this.resourcesLoaded = false;
            this.myManagers = managers;
            this.frame = 0;
            this.levelNum = levelNum;
            this.controller = controller;
        }
        GameState.prototype.load = function (gl) {
            _super.prototype.load.call(this, gl);
            this.gl = gl; //TODO: Nasty hack to hold onto this just to load resources from physics step
        };

        GameState.prototype.loadResources = function (gl) {
            var managers = this.myManagers;
            var backgroundName = "WORLD" + Math.floor(Math.max(0, (this.levelNum - 1)) / 3) + ".LZS";
            this.background = managers.Graphics.get3DSprite(gl, managers, managers.Textures.getTexture(gl, backgroundName));
            this.dash = new Game.Dashboard(gl, managers);
            var ll = new Levels.MultiLevelLoader(managers.Streams.getStream("ROADS.LZS"));
            var level = ll.Levels[this.levelNum];

            var sounds = managers.Sounds.getMultiEffect('SFX.SND');
            this.eventBus = new Events.EventBus();
            this.eventBus.register(new Game.ShipEvents.ShipBumpedWallEvent(), function (evt) {
                return sounds[2].play();
            });
            this.eventBus.register(new Game.ShipEvents.ShipExplodedEvent(), function (evt) {
                return sounds[0].play();
            });
            this.eventBus.register(new Game.ShipEvents.ShipBouncedEvent(), function (evt) {
                return sounds[1].play();
            });
            this.eventBus.register(new Game.ShipEvents.ShipRefilledEvent(), function (evt) {
                return sounds[4].play();
            });

            this.game = new Game.StateManager(managers, level, this.controller);
            managers.SnapshotProvider.reset();
            managers.SnapshotProvider.pushSnapshot(this.game.runFrame(this.eventBus));

            var meshBuilder = new Levels.MeshBuilder();
            var meshVerts = meshBuilder.buildMesh(level, managers.VR !== null, managers.Textures.getImage(backgroundName));
            this.mesh = managers.Graphics.getMesh(gl, managers, meshVerts);

            this.carSprite = new Game.CarSprite(gl, managers);

            this.roadCompleted = new Drawing.TextHelper(managers).getSpriteFromText(gl, managers, "Road Completed", "16pt Arial", 24);
            this.roadCompleted.Position.x = 320 / 2 - this.roadCompleted.Size.x / 2;
            this.roadCompleted.Position.y = 200 / 2 - this.roadCompleted.Size.y / 2;
        };

        GameState.prototype.unload = function () {
        };

        GameState.prototype.updatePhysics = function (frameManager, frameTimeInfo) {
            if (!this.resourcesLoaded) {
                this.loadResources(this.gl);
                this.resourcesLoaded = true;
            }
            var fps = frameTimeInfo.getFPS();
            this.frame++;
            var level = this.game.getLevel();
            var snap = this.game.runFrame(this.eventBus);
            this.myManagers.SnapshotProvider.pushSnapshot(snap);
            if ((snap.Position.z >= level.length() && this.game.didWin) || this.myManagers.Controls.getExit()) {
                this.myManagers.Frames.popState();
                this.myManagers.Frames.addState(new States.Fade3D(this.myManagers, 1.0, this, false));

                if (this.game.didWin) {
                    this.myManagers.Settings.incrementWonLevelCount(this.levelNum);
                }
            }

            this.carSprite.updateAnimation(snap, level);
            this.dash.update(snap, level);

            if (this.carSprite.hasAnimationFinished() || snap.Position.y < -10 || (snap.Position.z >= level.length() && !this.game.didWin)) {
                this.timeBeforeFade = 0;
            } else if (snap.CraftState === 2 /* OutOfFuel */ || snap.CraftState === 3 /* OutOfOxygen */) {
                this.timeBeforeFade -= frameTimeInfo.getPhysicsStep();
            }

            if (this.timeBeforeFade <= 0) {
                var gameState = new GameState(this.myManagers, this.levelNum, this.controller);
                frameManager.popState();
                this.myManagers.Frames.addState(gameState);
                this.myManagers.Frames.addState(new States.Fade3D(this.myManagers, 0.0, gameState, true));
                this.myManagers.Frames.addState(new States.Fade3D(this.myManagers, 1.0, this, false));
            }
        };

        GameState.prototype.drawFrame3D = function (gl, canvas, frameManager, frameTimeInfo, cam) {
            if (!this.resourcesLoaded) {
                this.loadResources(gl);
                this.resourcesLoaded = true;
            }

            var snap = this.myManagers.SnapshotProvider.getSnapshot();
            var level = this.game.getLevel();
            this.carSprite.updatePosition(snap, level);

            var isVR = this.myManagers.VR !== null;
            var scaleXY = 6.5 / 46.0;
            var scaleZ = 26.0 / 46.0;
            if (this.myManagers.VR === null) {
                scaleZ = scaleXY = 1.0;
            }

            var scaleVec = new TSM.vec3([scaleXY, scaleXY, scaleZ]);
            this.background.ModelMatrix.setIdentity();
            if (this.myManagers.VR !== null) {
                this.background.Size.x = 1920.0;
                this.background.Size.y = 1200.0;
                this.background.ModelMatrix.translate(new TSM.vec3([-450, 800.0 * 200.0 / this.background.Size.y, 1280.0 * -1200.0 / this.background.Size.x]));
            }

            cam.HeadOrientation.inverse();

            this.background.ViewMatrix.setIdentity();
            this.background.ViewMatrix.multiply(cam.HeadOrientation.toMat4());

            this.background.ProjectionMatrix = cam.ProjectionMatrix;
            this.background.draw();
            gl.clear(gl.DEPTH_BUFFER_BIT);

            var headPos = cam.HeadPosition.copy();
            headPos.add(new TSM.vec3([0.0, 130.0, -(snap.Position.z - (isVR ? 1 : 3)) * 46.0]).multiply(scaleVec));
            this.mesh.ViewMatrix.setIdentity();
            this.mesh.ViewMatrix.translate(cam.EyeOffset);
            this.mesh.ViewMatrix.multiply(cam.HeadOrientation.toMat4());
            this.mesh.ViewMatrix.translate(headPos.scale(-1.0));
            this.mesh.ViewMatrix.scale(scaleVec);

            this.mesh.ProjectionMatrix = cam.ProjectionMatrix;
            this.mesh.draw();
            this.carSprite.draw(this.mesh.ViewMatrix, cam);

            this.dash.draw(gl, cam, scaleVec);

            if (this.game.didWin) {
                this.roadCompleted.ModelMatrix.setIdentity();
                this.roadCompleted.ModelMatrix.translate(new TSM.vec3([0.0, -100.0, -150.0]));
                this.roadCompleted.ViewMatrix.copy(cam.HeadOrientation.toMat4());
                this.roadCompleted.ProjectionMatrix = cam.ProjectionMatrix;
                this.roadCompleted.draw();
            }
        };
        return GameState;
    })(Engine.State3D);
    States.GameState = GameState;
})(States || (States = {}));
var States;
(function (States) {
    var ClassicGLStateHelper = (function () {
        function ClassicGLStateHelper() {
        }
        ClassicGLStateHelper.prototype.startFrame = function (gl, canvas) {
            var bw = canvas.width, bh = canvas.height;
            var w = 320, h = 200, ratio = w / h;
            var cw = Math.min(bw, bh * ratio), ch = cw / ratio;
            var ox = bw / 2 - cw / 2, oy = bh / 2 - ch / 2;
            gl.viewport(Math.floor(ox), Math.floor(oy), Math.floor(cw), Math.floor(ch));
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        };
        return ClassicGLStateHelper;
    })();
    States.ClassicGLStateHelper = ClassicGLStateHelper;

    var VRGLStateHelper = (function () {
        function VRGLStateHelper(vrProvider) {
            this.vr = vrProvider;
        }
        VRGLStateHelper.prototype.startFrame = function (gl) {
            var fb = this.vr.getTargetFboId(gl);
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            var sz = this.vr.getTargetResolution();
            gl.viewport(0, 0, sz.x, sz.y);
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        };

        VRGLStateHelper.prototype.startEye = function (gl, eyeNum) {
            this.vr.startEye(eyeNum);
            var vp = this.vr.getEyeViewport(eyeNum);
            gl.viewport(vp.x, vp.y, vp.z, vp.w);
        };

        VRGLStateHelper.prototype.endEye = function (gl, eyeNum) {
            this.vr.endEye(eyeNum);
        };
        return VRGLStateHelper;
    })();
    States.VRGLStateHelper = VRGLStateHelper;
})(States || (States = {}));
var States;
(function (States) {
    var GoMenu = (function (_super) {
        __extends(GoMenu, _super);
        function GoMenu(managers) {
            _super.call(this, managers);
            this.watchers = [];
            this.myManagers = managers;
            this.selLevel = 1;
        }
        GoMenu.prototype.load = function (gl) {
            var _this = this;
            _super.prototype.load.call(this, gl);
            var managers = this.myManagers;
            var menuParts = managers.Textures.getTextures(gl, "GOMENU.LZS");
            var menu = menuParts.map(function (tf) {
                return new Drawing.Sprite(gl, managers, tf);
            });
            this.background = menu[0];
            this.dot = menu[1];

            var selCvs = this.myManagers.Canvas.getCanvas();
            selCvs.width = 48;
            selCvs.height = 9;

            var ctx = selCvs.getContext('2d');
            ctx.translate(0.5, 0.5);
            ctx.lineWidth = 1.0;
            ctx.strokeStyle = '#B6B6B6';
            ctx.strokeRect(0, 0, selCvs.width - 1, selCvs.height - 1);

            var selTex = new WGL.Texture(gl);
            selTex.loadData(selCvs);
            selTex.setFilters(gl.NEAREST, gl.NEAREST);
            var selFrag = new Drawing.TextureFragment(selTex, 0, 0, selCvs.width, selCvs.height);
            this.selRect = new Drawing.Sprite(gl, managers, selFrag);

            var controls = managers.Controls;
            this.watchers.push(new Controls.ConditionWatcher(function () {
                return controls.getLeft();
            }, function () {
                return _this.updateLevel(-15);
            }));
            this.watchers.push(new Controls.ConditionWatcher(function () {
                return controls.getUp();
            }, function () {
                return _this.updateLevel(-1);
            }));
            this.watchers.push(new Controls.ConditionWatcher(function () {
                return controls.getDown();
            }, function () {
                return _this.updateLevel(1);
            }));
            this.watchers.push(new Controls.ConditionWatcher(function () {
                return controls.getRight();
            }, function () {
                return _this.updateLevel(15);
            }));

            this.watchers.push(new Controls.ConditionWatcher(function () {
                return controls.getEnter();
            }, function () {
                return _this.enterLevel();
            }));
            this.watchers.push(new Controls.ConditionWatcher(function () {
                return controls.getExit();
            }, function () {
                return managers.Frames.popState();
            }));

            this.myManagers.Audio.playSong(1);
        };

        GoMenu.prototype.unload = function () {
        };

        GoMenu.prototype.updateLevel = function (dir) {
            this.selLevel = Math.max(1.0, Math.min(30.0, this.selLevel + dir));
        };

        GoMenu.prototype.enterLevel = function () {
            var gameState = new States.GameState(this.myManagers, this.selLevel, new Game.ControlSourceController(this.myManagers.Controls));
            this.myManagers.Frames.addState(new States.Fade2D(this.myManagers, 0.0, this, false));
            this.myManagers.Frames.addState(gameState);
            this.myManagers.Frames.addState(new States.Fade3D(this.myManagers, 0.0, gameState, true));
            this.myManagers.Frames.addState(new States.Fade2D(this.myManagers, 1.0, this, false));
            this.myManagers.Audio.playSong(Math.round(Math.random() * 11) + 2);
        };

        GoMenu.prototype.updatePhysics = function (frameManager, frameTimeInfo) {
            for (var i = 0; i < this.watchers.length; i++) {
                this.watchers[i].update(frameTimeInfo);
            }
        };

        GoMenu.prototype.drawFrame2D = function (gl, canvas, frameManager, frameTimeInfo) {
            var _this = this;
            var dotCountForLevel = function (n) {
                return Math.min(7, _this.myManagers.Settings.wonLevelCount(n));
            };

            var posForLevel = function (n) {
                var lx = Math.floor((n - 1) / 15);
                var ly = (n - 1) % 15;

                return new TSM.vec2([62 + lx * 160, 12 + Math.floor(ly / 3) * 39 + (ly % 3) * 9]);
            };

            this.background.draw();

            for (var i = 1; i <= 30; i++) {
                for (var j = 0; j < dotCountForLevel(i); j++) {
                    this.dot.Position.xy = (posForLevel(i).add(new TSM.vec2([50 + 7 * j, 2]))).xy;
                    this.dot.draw();
                }
            }

            var selX = Math.floor((this.selLevel - 1) / 15);
            var selY = (this.selLevel - 1) % 15;

            this.selRect.Position.xy = posForLevel(this.selLevel).xy;
            this.selRect.draw();
        };
        return GoMenu;
    })(Engine.State2D);
    States.GoMenu = GoMenu;
})(States || (States = {}));
var States;
(function (States) {
    var Help = (function (_super) {
        __extends(Help, _super);
        function Help(managers) {
            _super.call(this, managers);
            this.watchers = [];
            this.frameNum = 0;
            this.fadeDir = 0;
            this.myManagers = managers;
        }
        Help.prototype.load = function (gl) {
            var _this = this;
            _super.prototype.load.call(this, gl);
            var managers = this.myManagers;
            this.frames = managers.Textures.getTextures(gl, "HELPMENU.LZS").map(function (tf) {
                return new Drawing.Sprite(gl, managers, tf);
            });

            var controls = this.myManagers.Controls;
            this.watchers.push(new Controls.ConditionWatcher(function () {
                return controls.getExit();
            }, function () {
                return _this.exit();
            }));
            this.watchers.push(new Controls.ConditionWatcher(function () {
                return controls.getEnter();
            }, function () {
                return _this.next();
            }));
        };

        Help.prototype.unload = function () {
        };

        Help.prototype.exit = function () {
            this.myManagers.Frames.popState();
        };

        Help.prototype.next = function () {
            if (this.frameNum === this.frames.length - 1) {
                this.myManagers.Frames.popState();
            } else {
                this.fadeDir = -1.0;
            }
        };

        Help.prototype.updatePhysics = function (frameManager, frameTimeInfo) {
            for (var i = 0; i < this.watchers.length; i++) {
                this.watchers[i].update(frameTimeInfo);
            }
            this.frames[this.frameNum].Brightness += this.fadeDir * frameTimeInfo.getPhysicsStep();
            if (this.frames[this.frameNum].Brightness <= 0.0) {
                this.frames[this.frameNum].Brightness = 0.0;
                this.frameNum++;
                this.frames[this.frameNum].Brightness = 0.0;
                this.fadeDir = 1.0;
            } else if (this.frames[this.frameNum].Brightness >= 1.0) {
                this.frames[this.frameNum].Brightness = 1.0;
                this.fadeDir = 0.0;
            }
        };

        Help.prototype.drawFrame2D = function (gl, canvas, frameManager, frameTimeInfo) {
            this.frames[this.frameNum].draw();
        };
        return Help;
    })(Engine.State2D);
    States.Help = Help;
})(States || (States = {}));
/* INTRO TODO:
* Music
* Demo level sequence
*/
var States;
(function (States) {
    var Intro = (function (_super) {
        __extends(Intro, _super);
        function Intro(managers) {
            _super.call(this, managers);
            this.hasPlayedSong = false;
            this.myManagers = managers;
            this.totalTime = 0.0;
            this.frame = 0;
            this.titleProgress = 0.0;
        }
        Intro.prototype.load = function (gl) {
            _super.prototype.load.call(this, gl);
            var managers = this.myManagers;
            var introParts = managers.Textures.getTextures(gl, "INTRO.LZS");
            var intro = introParts.map(function (tf) {
                return new Drawing.Sprite(gl, managers, tf);
            });
            this.anim = managers.Textures.getAnim(gl, "ANIM.LZS").map(function (f) {
                return f.map(function (tf) {
                    return new Drawing.Sprite(gl, managers, tf);
                });
            });
            this.background = intro[0];

            var titleShader = managers.Shaders.getShader(gl, managers.Shaders.Shaders.TitleEffect2D);
            this.titleLeft = new Drawing.Sprite(gl, managers, introParts[1], titleShader);
            this.titleLeft.Brightness = -1;
            this.titleRight = new Drawing.Sprite(gl, managers, introParts[1], titleShader);
            this.titleRight.Brightness = 1;

            this.introSound = managers.Sounds.getSound(managers.Sounds.Sounds.Intro);

            this.frames = intro.slice(2);
            this.animFrame = null;
            this.creditFrame = null;
        };

        Intro.prototype.unload = function () {
        };

        Intro.prototype.updatePhysics = function (frameManager, frameTimeInfo) {
            var managers = this.myManagers;

            var fps = frameTimeInfo.getFPS();
            this.enabled = this.myManagers.VR === null || !this.myManagers.VR.isVRSafetyWarningVisible();

            if (this.enabled && !this.hasPlayedSong) {
                managers.Audio.playSong(0);
                this.hasPlayedSong = true;
            }

            if (this.enabled && this.frame >= fps / 2 && (managers.Controls.getEnter() || managers.Controls.getExit())) {
                var menuState = new States.MainMenu(managers);
                managers.Frames.addState(menuState);
            }

            if (this.frame == fps / 2) {
                this.introSound.play();
            }

            if (this.enabled) {
                this.frame++;
            }

            this.background.Brightness = this.frame < fps ? this.frame / fps : 1.0;

            var animStartFrame = fps * 2, titleStartFrame = animStartFrame + this.anim.length, creditsStartFrame = titleStartFrame + fps * 4;

            var animFrame = this.frame - animStartFrame;
            this.animFrame = animFrame >= 0 && animFrame < this.anim.length ? this.anim[animFrame] : null;

            var titleFrame = this.frame - titleStartFrame;
            if (titleFrame < 0) {
                this.titleRight.Alpha = this.titleLeft.Alpha = 0;
                this.titleProgress = 0.0;
            } else if (titleFrame < fps * 3.5) {
                this.titleProgress = this.titleRight.Alpha = this.titleLeft.Alpha = titleFrame / (fps * 3.5);
            } else {
                this.titleRight.Alpha = this.titleLeft.Alpha = 1.0;
                this.titleProgress = 1.0;
            }

            var creditFrame = this.frame - creditsStartFrame;
            if (creditFrame > 0) {
                var creditIdx = (2 + Math.floor(creditFrame / (fps * 4))) % this.frames.length;
                this.creditFrame = this.frames[creditIdx];
                var seq = creditFrame % (fps * 4);
                if (seq < fps) {
                    this.creditFrame.Alpha = seq / fps;
                } else if (seq > fps * 3) {
                    this.creditFrame.Alpha = (fps * 4 - seq) / fps;
                    if (this.creditFrame.Alpha < 0.1 && creditIdx == this.frames.length - 1) {
                        var demoState = new States.GameState(managers, 0, new Game.DemoController(managers.Streams.getRawArray('DEMO.REC')));
                        managers.Frames.addState(new States.Fade2D(managers, 0.0, this, false));
                        managers.Frames.addState(demoState);
                        managers.Frames.addState(new States.Fade3D(managers, 0.0, demoState, true));
                        managers.Frames.addState(new States.Fade2D(managers, 1.0, this, false));
                        this.frame = 0;
                        this.creditFrame.Alpha = 0.0;
                        this.updatePhysics(frameManager, frameTimeInfo);
                    }
                } else {
                    this.creditFrame.Alpha = 1.0;
                }
            }
        };

        Intro.prototype.drawFrame2D = function (gl, canvas, frameManager, frameTimeInfo) {
            this.background.draw();

            if (this.animFrame != null) {
                for (var i = 0; i < this.animFrame.length; i++) {
                    this.animFrame[i].draw();
                }
            }

            if (this.creditFrame != null) {
                this.creditFrame.draw();
            }

            if (this.titleProgress > 0.0) {
                this.titleLeft.draw();
                if (this.titleProgress < 1.0) {
                    this.titleRight.draw();
                }
            }
        };
        return Intro;
    })(Engine.State2D);
    States.Intro = Intro;
})(States || (States = {}));
var States;
(function (States) {
    var MainMenu = (function (_super) {
        __extends(MainMenu, _super);
        function MainMenu(managers) {
            _super.call(this, managers);
            this.menuPos = 0;
            this.menuAlpha = 0;
            this.watchers = [];
            this.myManagers = managers;
        }
        MainMenu.prototype.load = function (gl) {
            var _this = this;
            _super.prototype.load.call(this, gl);

            var managers = this.myManagers;
            var introParts = managers.Textures.getTextures(gl, "INTRO.LZS");
            var intro = introParts.map(function (tf) {
                return new Drawing.Sprite(gl, managers, tf);
            });
            this.background = intro[0];
            this.title = new Drawing.Sprite(gl, managers, introParts[1]);
            this.menu = managers.Textures.getTextures(gl, "MAINMENU.LZS").map(function (tf) {
                return new Drawing.Sprite(gl, managers, tf);
            });

            var controls = managers.Controls;
            this.watchers.push(new Controls.ConditionWatcher(function () {
                return controls.getUp();
            }, function () {
                return _this.updateMenu(-1);
            }));
            this.watchers.push(new Controls.ConditionWatcher(function () {
                return controls.getDown();
            }, function () {
                return _this.updateMenu(1);
            }));
            this.watchers.push(new Controls.ConditionWatcher(function () {
                return controls.getEnter();
            }, function () {
                return _this.enterMenu();
            }));
            this.watchers.push(new Controls.ConditionWatcher(function () {
                return controls.getExit();
            }, function () {
                return _this.exit();
            }));

            //TODO: Way to exit NodeJS app
            this.myManagers.Audio.playSong(1);
        };

        MainMenu.prototype.unload = function () {
        };

        MainMenu.prototype.updateMenu = function (dir) {
            this.menuPos = Math.max(0, Math.min(2, this.menuPos + dir));
        };

        MainMenu.prototype.exit = function () {
            if (this.myManagers.VR !== null && this.menuAlpha >= 1.0) {
                this.myManagers.VR.exit();
            }
        };

        MainMenu.prototype.enterMenu = function () {
            if (this.menuAlpha < 1.0) {
                return;
            }
            switch (this.menuPos) {
                case 0:
                    var goState = new States.GoMenu(this.myManagers);
                    this.myManagers.Frames.addState(new States.Fade2D(this.myManagers, 0.0, this, false));
                    this.myManagers.Frames.addState(new States.Fade2D(this.myManagers, 1.0, goState, false));
                    this.myManagers.Frames.addState(goState);
                    this.myManagers.Frames.addState(new States.Fade2D(this.myManagers, 0.0, goState, true));
                    this.myManagers.Frames.addState(new States.Fade2D(this.myManagers, 1.0, this, false));
                    break;
                case 1:
                    var configState = new States.ControlsMenu(this.myManagers);
                    this.myManagers.Frames.addState(new States.Fade2D(this.myManagers, 0.0, this, false));
                    this.myManagers.Frames.addState(new States.Fade2D(this.myManagers, 1.0, configState, false));
                    this.myManagers.Frames.addState(configState);
                    this.myManagers.Frames.addState(new States.Fade2D(this.myManagers, 0.0, configState, true));
                    this.myManagers.Frames.addState(new States.Fade2D(this.myManagers, 1.0, this, false));
                    break;
                case 2:
                    var helpState = new States.Help(this.myManagers);
                    this.myManagers.Frames.addState(new States.Fade2D(this.myManagers, 0.0, this, false));
                    this.myManagers.Frames.addState(new States.Fade2D(this.myManagers, 1.0, helpState, false));
                    this.myManagers.Frames.addState(helpState);
                    this.myManagers.Frames.addState(new States.Fade2D(this.myManagers, 0.0, helpState, true));
                    this.myManagers.Frames.addState(new States.Fade2D(this.myManagers, 1.0, this, false));
                    break;
            }
        };

        MainMenu.prototype.updatePhysics = function (frameManager, frameTimeInfo) {
            for (var i = 0; i < this.watchers.length; i++) {
                this.watchers[i].update(frameTimeInfo);
            }
            this.menuAlpha += frameTimeInfo.getPhysicsStep();
        };

        MainMenu.prototype.drawFrame2D = function (gl, canvas, frameManager, frameTimeInfo) {
            this.background.draw();
            this.title.draw();

            this.menu[this.menuPos].Alpha = Math.min(1.0, this.menuAlpha);
            this.menu[this.menuPos].draw();
        };
        return MainMenu;
    })(Engine.State2D);
    States.MainMenu = MainMenu;
})(States || (States = {}));
var Stores;
(function (Stores) {
    var AJAXFileProvider = (function () {
        function AJAXFileProvider() {
        }
        AJAXFileProvider.prototype.load = function (filename, cb) {
            var oReq = new XMLHttpRequest();
            oReq.open("GET", filename, true);
            oReq.responseType = "arraybuffer";
            oReq.onload = function (oEvent) {
                var arrayBuffer = oReq.response;
                var result = new Uint8Array(arrayBuffer);
                cb(result);
            };
            oReq.send(null);
        };
        return AJAXFileProvider;
    })();
    Stores.AJAXFileProvider = AJAXFileProvider;
    ;
})(Stores || (Stores = {}));
var Stores;
(function (Stores) {
    ;
})(Stores || (Stores = {}));
var Stores;
(function (Stores) {
    var FSStore = (function () {
        function FSStore(prefix) {
            this.opts = {};
            this.filename = 'Data/settings-' + prefix + '.json';
            this.fs = require('fs');
            try  {
                this.opts = JSON.parse(this.fs.readFileSync(this.filename, 'utf-8'));
            } catch (e) {
            }
        }
        FSStore.prototype.getValue = function (k) {
            return (k in this.opts) ? this.opts[k] : null;
        };

        FSStore.prototype.setValue = function (k, v) {
            this.opts[k] = v;
            this.fs.writeFileSync(this.filename, JSON.stringify(this.opts));
        };
        return FSStore;
    })();
    Stores.FSStore = FSStore;
})(Stores || (Stores = {}));
var Stores;
(function (Stores) {
    var LocalFileProvider = (function () {
        function LocalFileProvider() {
            this.fs = require('fs');
        }
        LocalFileProvider.prototype.load = function (filename, cb) {
            this.fs.readFile(filename, function (err, data) {
                cb(data);
            });
        };
        return LocalFileProvider;
    })();
    Stores.LocalFileProvider = LocalFileProvider;
    ;
})(Stores || (Stores = {}));
var Stores;
(function (Stores) {
    var LocalStorageStore = (function () {
        function LocalStorageStore(prefix) {
            this.prefix = prefix;
        }
        LocalStorageStore.prototype.setValue = function (k, v) {
            localStorage.setItem(this.prefix + '-' + k, v);
        };
        LocalStorageStore.prototype.getValue = function (k) {
            return localStorage.getItem(this.prefix + '-' + k);
        };
        return LocalStorageStore;
    })();
    Stores.LocalStorageStore = LocalStorageStore;
})(Stores || (Stores = {}));
var TestRuns;
(function (TestRuns) {
    function TestCar() {
        var manager = new Managers.StreamManager(new Stores.AJAXFileProvider()), shaderManager = new Managers.ShaderManager(manager);
        var managers = new Managers.ManagerSet(manager, shaderManager);
        managers.Sounds = new Managers.SoundManager(managers);
        managers.Textures = new Managers.TextureManager(managers);

        manager.loadMultiple(["Data/CARS.LZS"]).done(function () {
            var cvs = document.getElementById('cvs');
            cvs.style.display = 'block';
            cvs.width = 320;
            cvs.height = 200;
            cvs.style.width = '640px';
            cvs.style.height = '400px';
            cvs.style.position = 'static';
            var isl = new Images.ImageSetLoader(managers);
            var car = isl.load(managers.Streams.getStream('Data/CARS.LZS'))[0];

            var ctx = cvs.getContext('2d');
            var ix = 0;
            var bin = document.createElement('input');
            bin.value = '0';
            document.body.appendChild(bin);
            var top = document.createElement('input');
            top.value = '3';
            document.body.appendChild(top);
            var f = 0;
            function drawFrame() {
                var base = parseInt(bin.value) || 0;
                var num = parseInt(top.value) || 3;
                f++;

                if (f % 2 == 0) {
                    ix = ((ix + 1) % num);
                }

                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, 1000, 1000);
                ctx.translate(160, 100);
                ctx.rotate(Math.PI / 2.0);
                ctx.drawImage(car.Canvas, car.XOffset, (ix + base) * 30, car.Canvas.width, 30, 0, 0, car.Canvas.width, 30);
                requestAnimationFrame(drawFrame);
            }
            requestAnimationFrame(drawFrame);
        });
    }
    TestRuns.TestCar = TestCar;
})(TestRuns || (TestRuns = {}));
var TestRuns;
(function (TestRuns) {
    function TestDats() {
        function loadStream(name, cb) {
            var oReq = new XMLHttpRequest();
            oReq.open("GET", name, true);
            oReq.responseType = "arraybuffer";
            oReq.onload = function (oEvent) {
                var arrayBuffer = oReq.response;
                cb(new Data.ArrayBitStream((new Uint8Array(arrayBuffer))));
            };
            oReq.send(null);
        }

        var managers = null;

        loadStream('Data/WORLD0.LZS', function (backBS) {
            loadStream('Data/DASHBRD.LZS', function (dashBS) {
                loadStream('Data/OXY_DISP.DAT', function (dat1BS) {
                    loadStream('Data/FUL_DISP.DAT', function (dat2BS) {
                        loadStream('Data/SPEED.DAT', function (dat3BS) {
                            var back = new Images.ImageSetLoader(managers).load(backBS)[0];
                            var dash = new Images.ImageSetLoader(managers).load(dashBS)[0];
                            var oxys = [new Images.DatLoader(managers).load(dat1BS), new Images.DatLoader(managers).load(dat2BS), new Images.DatLoader(managers).load(dat3BS)];

                            var canvas = document.createElement('canvas');
                            canvas.width = 320;
                            canvas.height = 200;

                            document.body.appendChild(canvas);

                            var ctx = canvas.getContext('2d');

                            var i = 0;
                            function drawFrame() {
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                ctx.drawImage(back.Canvas, 0, 0);
                                ctx.drawImage(dash.Canvas, dash.XOffset, dash.YOffset);

                                for (var k = 0; k < oxys.length; k++) {
                                    var oxy = oxys[k];
                                    for (var j = 0; j < (i % oxy.length + 1); j++) {
                                        ctx.drawImage(oxy[j].Canvas, oxy[j].XOffset, oxy[j].YOffset);
                                    }
                                }

                                requestAnimationFrame(drawFrame);
                            }
                            setInterval(function () {
                                i++;
                            }, 500);
                            requestAnimationFrame(drawFrame);
                        });
                    });
                });
            });
        });
    }
    TestRuns.TestDats = TestDats;
})(TestRuns || (TestRuns = {}));
var TestRuns;
(function (TestRuns) {
    function TestAnims() {
        function loadStream(name, cb) {
            var oReq = new XMLHttpRequest();
            oReq.open("GET", name, true);
            oReq.responseType = "arraybuffer";
            oReq.onload = function (oEvent) {
                var arrayBuffer = oReq.response;
                cb(new Data.ArrayBitStream((new Uint8Array(arrayBuffer))));
            };
            oReq.send(null);
        }

        var managers = null;
        var f = 'Data/SETMENU.LZS';
        loadStream(f, function (bsIntro) {
            loadStream(f, function (bsAnim) {
                var parts = new Images.ImageSetLoader(managers).load(bsIntro);
                var anim = new Images.ImageSetLoader(managers).load(bsAnim);
                var canvas = document.createElement('canvas');
                canvas.width = 320;
                canvas.height = 200;
                document.body.appendChild(canvas);

                var i = 0;
                var ctx = canvas.getContext('2d');

                function drawFrame() {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    document.title = 'IMG: ' + i;
                    ctx.drawImage(parts[i].Canvas, parts[i].XOffset, parts[i].YOffset);
                    requestAnimationFrame(drawFrame);
                }
                requestAnimationFrame(drawFrame);
                setInterval(function () {
                    i = (i + 1) % parts.length;
                }, 1000);
            });
        });
    }
    TestRuns.TestAnims = TestAnims;
    ;
})(TestRuns || (TestRuns = {}));
var TestRuns;
(function (TestRuns) {
    function TestLevel() {
        var oReq = new XMLHttpRequest();
        oReq.open("GET", "Data/ROADS.LZS", true);
        oReq.responseType = "arraybuffer";

        oReq.onload = function (oEvent) {
            var arrayBuffer = oReq.response;
            if (arrayBuffer) {
                var byteArray = new Uint8Array(arrayBuffer);
                var ll = new Levels.MultiLevelLoader(new Data.ArrayBitStream(byteArray));
                var lToT = new Levels.LevelToTableRenderer();
                var levels = ll.Levels;
                for (var i = 0; i < levels.length; i++) {
                    var l = levels[i];
                    var h = document.createElement('h1');
                    h.innerHTML = l.Name;
                    document.body.appendChild(h);
                    var h2 = document.createElement('h2');
                    h2.innerHTML = 'Gravity: ' + l.Gravity + '\tOxygen: ' + l.Oxygen + '\tFuel: ' + l.Fuel;
                    document.body.appendChild(h2);
                    document.body.appendChild(lToT.convertColors(l));
                    document.body.appendChild(lToT.convert(l));
                }
            }
        };

        oReq.send(null);
    }
    TestRuns.TestLevel = TestLevel;
    ;
})(TestRuns || (TestRuns = {}));
var TestRuns;
(function (TestRuns) {
    function TestSounds() {
        var manager = new Managers.StreamManager(new Stores.AJAXFileProvider()), shaderManager = new Managers.ShaderManager(manager);
        var managers = new Managers.ManagerSet(manager, shaderManager);
        managers.Sounds = new Managers.SoundManager(managers);
        manager.loadMultiple(["Data/SFX.SND"]).done(function () {
            var snd1 = managers.Sounds.getMultiEffect('SFX.SND');
            snd1[1].play();
            //0 - Mild bump but didn't explode?
            //1 - Bounce
            //2 - Explosion?
            //3 - Out of oxygen (or fuel)
            //4 - Re-fueled
            //5 - Nothin
        });
    }
    TestRuns.TestSounds = TestSounds;
})(TestRuns || (TestRuns = {}));
var TestRuns;
(function (TestRuns) {
    function TestTrekDat() {
        var manager = new Managers.StreamManager(new Stores.AJAXFileProvider()), shaderManager = new Managers.ShaderManager(manager);
        var managers = new Managers.ManagerSet(manager, shaderManager);
        managers.Sounds = new Managers.SoundManager(managers);
        managers.Textures = new Managers.TextureManager(managers);

        manager.loadMultiple(["Data/TREKDAT.LZS"]).done(function () {
            var stream = manager.getStream("Data/TREKDAT.LZS");
            var reader = new Data.BinaryReader(stream);

            var cvs = document.getElementById('cvs');
            cvs.width = 320;
            cvs.height = 200;
            cvs.style.width = '640px';
            cvs.style.height = '400px';
            cvs.style.display = 'block';

            var ctx = cvs.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 320, 200);
            ctx.fillStyle = '#FF0000';

            var idx = 0;
            while (!reader.eof()) {
                idx++;
                var loadBuffEnd = reader.getUint16();
                var bytesToRead = reader.getUint16();
                var loadOffset = loadBuffEnd - bytesToRead;

                var reader2 = new Data.BinaryReader(new Data.CompressedByteStream(reader));
                var arr = [];
                for (var i = 0; i < loadOffset; i++) {
                    arr.push(0);
                }

                for (var i = 0; i < bytesToRead; i++) {
                    arr.push(reader2.getUint8());
                }

                var srcPtr = loadOffset;
                var dstPtr = 0;
                var dx = 0x410;
                for (var i = 0; i < 0x138 * 2; i++) {
                    arr[dstPtr] = arr[srcPtr];
                    dstPtr++;
                    srcPtr++;
                }

                while (dx > 0) {
                    arr[dstPtr] = arr[srcPtr];
                    dstPtr++;
                    srcPtr++;
                    arr[dstPtr] = arr[srcPtr];
                    dstPtr++;
                    srcPtr++;
                    arr[dstPtr] = arr[srcPtr];
                    dstPtr++;
                    srcPtr++;

                    while (true) {
                        var bt = arr[srcPtr];
                        arr[dstPtr] = bt;
                        srcPtr++;
                        dstPtr++;

                        if (bt == 0xFF)
                            break;

                        arr[dstPtr] = arr[srcPtr];
                        dstPtr++;
                        srcPtr++;
                        arr[dstPtr] = 0;
                        dstPtr++;
                    }

                    dx--;
                }

                stream.setPosition(Math.ceil(stream.getPosition() / 8) * 8);

                function drawShape(startIdx) {
                    var stream = new Data.ArrayBitStream(arr);
                    stream.setPosition(startIdx * 8);

                    var reader = new Data.BinaryReader(stream);

                    var color = reader.getUint8();
                    var ptr = 10240 + reader.getUint16();
                    console.log('X: ' + (ptr % 320), 'Y: ' + Math.floor(ptr / 320));
                    var xs = [];
                    while (true) {
                        var v = reader.getUint8();
                        if (v == 0xFF) {
                            break;
                        }

                        var ptr2 = ptr - v;

                        var ct = reader.getUint8();
                        reader.getUint8();

                        ctx.fillRect(ptr2 % 320, ptr2 / 320, ct, 1);
                        xs.push((ptr2 % 320) + '-' + ct);
                        ptr += 320;
                    }

                    console.log(xs);
                }

                var i = 0;
                var inp = document.createElement('input');
                inp.value = '0';
                inp.style.display = 'block';
                inp.style.position = 'absolute';
                inp.style.right = '0px';
                document.body.appendChild(inp);
                inp.onchange = function () {
                    var ibx = parseInt(inp.value);

                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, 320, 200);
                    var ib = 0;
                    for (var i = 0; i < 10; i++) {
                        var colors = ['#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#00FFFF', '#FFFF00', '#FFFFFF', '#FFAA00'];
                        var color = colors[(i) % colors.length];
                        console.log('ShapeBase: ' + ib + ', ShapeNum: ' + i + ', Color: ' + color);
                        var idx = 48 * i + ib * 2 + ibx * 2;
                        ctx.fillStyle = color;
                        drawShape(arr[idx + 0] + (arr[idx + 1] << 8));
                    }

                    i++;
                };

                var btn = document.createElement('input');
                btn.type = 'button';
                btn.value = 'Cycle';
                btn.style.display = 'block';
                btn.style.position = 'absolute';
                btn.style.right = '200px';
                document.body.appendChild(btn);

                var ivl = null;
                btn.onclick = function () {
                    if (ivl) {
                        clearInterval(ivl);
                        ivl = null;
                    } else {
                        ivl = setInterval(function () {
                            inp.onchange(null);
                            inp.value = '' + (parseInt(inp.value) + 1);
                        }, 1000);
                    }
                };

                inp.value = '0';
                inp.onchange(null);
                return;
            }
        });
    }
    TestRuns.TestTrekDat = TestTrekDat;
})(TestRuns || (TestRuns = {}));
var Vertices;
(function (Vertices) {
    var Vertex2D = (function () {
        function Vertex2D(x, y) {
            this.X = x;
            this.Y = y;
        }
        Vertex2D.getDescriptor = function (gl) {
            return new WGL.VertexDescriptor([
                new WGL.VertexAttributeDescription(gl, "aPos", 2, gl.FLOAT, true, 8, 0)
            ]);
        };

        Vertex2D.prototype.getComponent = function (name) {
            if (name == "aPos") {
                return [this.X, this.Y];
            } else {
                throw "Bad component: " + name;
            }
        };
        return Vertex2D;
    })();
    Vertices.Vertex2D = Vertex2D;
})(Vertices || (Vertices = {}));
var Vertices;
(function (Vertices) {
    var Vertex3DC = (function () {
        function Vertex3DC(pos, color, uv) {
            if (typeof uv === "undefined") { uv = new TSM.vec2([0.0, 0.0]); }
            this.Position = pos;
            this.Color = color;
            this.UV = new TSM.vec3([uv.x, uv.y, 0.0]);
        }
        Vertex3DC.getDescriptor = function (gl) {
            return new WGL.VertexDescriptor([
                new WGL.VertexAttributeDescription(gl, "aPos", 3, gl.FLOAT, true, 32, 0),
                new WGL.VertexAttributeDescription(gl, "aColor", 3, gl.FLOAT, true, 32, 12),
                new WGL.VertexAttributeDescription(gl, "aTexCoord", 3, gl.FLOAT, true, 36, 24)
            ]);
        };

        Vertex3DC.prototype.getComponent = function (name) {
            if (name == "aPos") {
                return this.Position.xyz;
            } else if (name == "aColor") {
                return this.Color.xyz;
            } else if (name === "aTexCoord") {
                return this.UV.xyz;
            } else {
                throw "Bad component: " + name;
            }
        };
        return Vertex3DC;
    })();
    Vertices.Vertex3DC = Vertex3DC;
})(Vertices || (Vertices = {}));
var VR;
(function (VR) {
    var NodeVRProvider = (function () {
        function NodeVRProvider(glfw) {
            this.glfw = glfw;
        }
        NodeVRProvider.prototype.enable = function () {
            return this.glfw.enableHMD();
        };

        NodeVRProvider.prototype.getTargetResolution = function () {
            return new TSM.vec2(this.glfw.getHMDTargetSize());
        };

        NodeVRProvider.prototype.getTargetFboId = function (gl) {
            return this.glfw.getHMDFboId(gl);
        };

        NodeVRProvider.prototype.getHeadCameraState = function (eyeNum) {
            return new Engine.CameraState(this.getHeadPosition(eyeNum), this.getHeadOrientation(eyeNum), this.getEyeViewAdjust(eyeNum), this.getEyeProjectionMatrix(eyeNum));
        };

        NodeVRProvider.prototype.getEyeViewport = function (eyeNum) {
            return new TSM.vec4(this.glfw.getEyeViewport(eyeNum));
        };

        NodeVRProvider.prototype.startEye = function (eyeNum) {
            this.glfw.startVREye(eyeNum);
        };

        //Went away with Oculus SDK 0.4 but may come back...
        NodeVRProvider.prototype.endEye = function (eyeNum) {
        };

        NodeVRProvider.prototype.isVRSafetyWarningVisible = function () {
            return this.glfw.isVRSafetyWarningVisible();
        };

        NodeVRProvider.prototype.exit = function () {
            process.exit();
        };

        NodeVRProvider.prototype.resetOrientation = function () {
            this.glfw.resetVROrientation();
        };

        NodeVRProvider.prototype.getEyeViewAdjust = function (n) {
            return new TSM.vec3(this.glfw.getEyeViewAdjust(n));
        };

        NodeVRProvider.prototype.getEyeProjectionMatrix = function (n) {
            return new TSM.mat4(this.glfw.getProjectionMatrix(n));
        };

        NodeVRProvider.prototype.getHeadPosition = function (n) {
            return new TSM.vec3(this.glfw.getHeadPosition(n));
            //var stick = this.getJoystickValues();
            //return new TSM.vec3([stick[4] * 6, stick[2] * 6, stick[3] * 6]);
        };

        NodeVRProvider.prototype.getHeadOrientation = function (n) {
            return new TSM.quat(this.glfw.getHeadOrientation(n));
            //var stick = this.getJoystickValues();
            //return TSM.quat.fromAxis(new TSM.vec3([0.0, 1.0, 0.0]), stick[0] * 0.5)
            //    .multiply(TSM.quat.fromAxis(new TSM.vec3([0.0, 0.0, 1.0]), stick[1] * 1.5));
        };

        NodeVRProvider.prototype.getJoystickValues = function () {
            var s = this.glfw.getJoystickAxes();
            return s.split(',').map(function (v) {
                return parseFloat(v);
            });
        };

        NodeVRProvider.prototype.getJoystickButtons = function () {
            var s = this.glfw.getJoystickButtons();
            return s.split(',').map(function (v) {
                return parseFloat(v) > 0;
            });
        };
        return NodeVRProvider;
    })();
    VR.NodeVRProvider = NodeVRProvider;
})(VR || (VR = {}));
var WGL;
(function (WGL) {
    var VertexAttribute = (function () {
        function VertexAttribute(gl, location) {
            if (location == -1) {
                throw "Invalid attrib";
            }

            this.gl = gl;
            this.location = location;
        }
        VertexAttribute.prototype.enable = function () {
            this.gl.enableVertexAttribArray(this.location);
        };

        VertexAttribute.prototype.disable = function () {
            this.gl.disableVertexAttribArray(this.location);
        };

        VertexAttribute.prototype.attribPointer = function (size, type, normalized, stride, offset) {
            this.gl.vertexAttribPointer(this.location, size, type, normalized, stride, offset);
        };
        return VertexAttribute;
    })();
    WGL.VertexAttribute = VertexAttribute;
})(WGL || (WGL = {}));
var WGL;
(function (WGL) {
    var Buffer = (function () {
        function Buffer(gl, bufferType) {
            if (typeof bufferType === "undefined") { bufferType = -1; }
            if (bufferType === -1) {
                bufferType = gl.ARRAY_BUFFER;
            }
            this.gl = gl;
            this.buffer = gl.createBuffer();
            this.bufferType = bufferType;
            this.size = -1;
        }
        Buffer.prototype.bind = function () {
            this.gl.bindBuffer(this.bufferType, this.buffer);
        };

        Buffer.prototype.loadData = function (data, usage) {
            if (typeof usage === "undefined") { usage = -1; }
            if (usage === -1) {
                usage = this.gl.STATIC_DRAW;
            }
            this.bind();
            this.gl.bufferData(this.bufferType, data, usage);
            this.size = data.length;
        };

        Buffer.prototype.getNumElements = function () {
            return this.size;
        };
        return Buffer;
    })();
    WGL.Buffer = Buffer;
})(WGL || (WGL = {}));
var WGL;
(function (WGL) {
    var Framebuffer = (function () {
        function Framebuffer(gl) {
            this.buffer = gl.createFramebuffer();
            this.gl = gl;
        }
        Framebuffer.prototype.bind = function () {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.buffer);
        };

        Framebuffer.prototype.unbind = function () {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        };

        Framebuffer.prototype.setTexture = function (tex) {
            this.bind();
            tex.bind();

            var gl = this.gl;
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.getGLTexture(), 0);
        };

        Framebuffer.prototype.setRenderbuffer = function (rb) {
            this.bind();
            rb.bind();

            var gl = this.gl;
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb.getGLRenderbuffer());
        };
        return Framebuffer;
    })();
    WGL.Framebuffer = Framebuffer;
})(WGL || (WGL = {}));
var WGL;
(function (WGL) {
    var RenderableTexture = (function () {
        function RenderableTexture(fb, tex) {
            this.Framebuffer = fb;
            this.Texture = tex;
        }
        RenderableTexture.Create = function (gl, width, height) {
            var fb = new WGL.Framebuffer(gl);
            fb.bind();

            var tex = new WGL.Texture(gl);
            tex.createEmpty(width, height);
            tex.setFilters(gl.LINEAR, gl.LINEAR);
            tex.generateMipmap();

            var rb = new WGL.Renderbuffer(gl);
            rb.setSize(width, height);

            fb.setTexture(tex);
            fb.setRenderbuffer(rb);

            rb.unbind();
            tex.unbind();
            fb.unbind();

            return new RenderableTexture(fb, tex);
        };

        RenderableTexture.prototype.bindForDrawing = function () {
            this.Framebuffer.bind();
        };

        RenderableTexture.prototype.unbindForDrawing = function () {
            this.Framebuffer.unbind();
        };
        return RenderableTexture;
    })();
    WGL.RenderableTexture = RenderableTexture;
})(WGL || (WGL = {}));
var WGL;
(function (WGL) {
    var Renderbuffer = (function () {
        function Renderbuffer(gl) {
            this.buffer = gl.createRenderbuffer();
            this.gl = gl;
        }
        Renderbuffer.prototype.bind = function () {
            this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.buffer);
        };

        Renderbuffer.prototype.unbind = function () {
            this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
        };

        Renderbuffer.prototype.setSize = function (width, height) {
            var gl = this.gl;
            this.bind();
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        };

        Renderbuffer.prototype.getGLRenderbuffer = function () {
            return this.buffer;
        };
        return Renderbuffer;
    })();
    WGL.Renderbuffer = Renderbuffer;
})(WGL || (WGL = {}));
var WGL;
(function (WGL) {
    var Shader = (function () {
        function Shader(gl, vertexSource, fragmentSource) {
            this.attributes = {};
            this.uniforms = {};
            function getShader(src, type) {
                var shader = gl.createShader(type);

                gl.shaderSource(shader, src);
                gl.compileShader(shader);

                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    console.log(src);
                    console.log(gl.getShaderInfoLog(shader));
                    throw "Shader failed to compile.";
                }

                return shader;
            }

            var vertShader = getShader(vertexSource, gl.VERTEX_SHADER);
            var fragShader = getShader(fragmentSource, gl.FRAGMENT_SHADER);

            var program = gl.createProgram();
            gl.attachShader(program, vertShader);
            gl.attachShader(program, fragShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.log(vertexSource);
                console.log(fragmentSource);
                console.log(gl.getProgramInfoLog(program));
                throw "Shader failed to link.";
            }

            this.gl = gl;
            this.program = program;
        }
        Shader.prototype.use = function () {
            this.gl.useProgram(this.program);
        };

        Shader.prototype.getVertexAttribute = function (name) {
            if (!(name in this.attributes)) {
                var gl = this.gl;
                this.use();
                var attrib = gl.getAttribLocation(this.program, name);
                this.attributes[name] = attrib !== -1 ? new WGL.VertexAttribute(gl, attrib) : null;
            }
            return this.attributes[name];
        };

        Shader.prototype.getUniform = function (name) {
            if (!(name in this.uniforms)) {
                var gl = this.gl;
                this.use();
                var loc = gl.getUniformLocation(this.program, name);
                this.uniforms[name] = loc !== null ? new WGL.ShaderUniform(gl, loc) : null;
            }
            return this.uniforms[name];
        };
        return Shader;
    })();
    WGL.Shader = Shader;
})(WGL || (WGL = {}));
var WGL;
(function (WGL) {
    var ShaderUniform = (function () {
        function ShaderUniform(gl, location) {
            if (location == null) {
                throw "InvalidUniformName";
            }

            this.gl = gl;
            this.location = location;
        }
        ShaderUniform.prototype.set1i = function (i) {
            this.gl.uniform1i(this.location, i);
        };

        ShaderUniform.prototype.set1f = function (f) {
            this.gl.uniform1f(this.location, f);
        };

        ShaderUniform.prototype.setVec2 = function (v) {
            this.gl.uniform2f(this.location, v.x, v.y);
        };

        ShaderUniform.prototype.setVec3 = function (v) {
            this.gl.uniform3f(this.location, v.x, v.y, v.z);
        };

        ShaderUniform.prototype.setMat4 = function (m) {
            var nums = [];

            //Hack for node-webgl.  Should fix there instead.
            var marr = m.all();
            for (var i = 0; i < marr.length; i++) {
                nums.push(marr[i]);
            }
            this.gl.uniformMatrix4fv(this.location, false, marr);
        };
        return ShaderUniform;
    })();
    WGL.ShaderUniform = ShaderUniform;
})(WGL || (WGL = {}));
var WGL;
(function (WGL) {
    var Texture = (function () {
        function Texture(gl) {
            this.boundTo = -1;
            this.texture = gl.createTexture();
            this.gl = gl;
            this.setFilters(gl.NEAREST, gl.NEAREST);
        }
        Texture.prototype.bind = function () {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        };

        Texture.prototype.unbind = function () {
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        };

        Texture.prototype.loadData = function (image) {
            this.Width = image.width;
            this.Height = image.height;

            var gl = this.gl;
            this.bind();
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        };

        Texture.prototype.createEmpty = function (width, height) {
            this.Width = width;
            this.Height = height;
            var gl = this.gl;
            this.bind();

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        };

        Texture.prototype.setFilters = function (minFilter, magFilter) {
            var gl = this.gl;
            this.bind();
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        };

        Texture.prototype.generateMipmap = function () {
            var gl = this.gl;
            this.bind();
            gl.generateMipmap(gl.TEXTURE_2D);
        };

        Texture.prototype.attachToUniform = function (uniform) {
            for (var i = 0; i < Texture.textureUnitAvailable.length; i++) {
                if (Texture.textureUnitAvailable[i]) {
                    this.attachToUniformExplicit(uniform, i);
                    return;
                }
            }

            throw "All texture units in use";
        };

        Texture.prototype.attachToUniformExplicit = function (uniform, activeTextureNum) {
            var gl = this.gl;

            if (!Texture.textureUnitAvailable[activeTextureNum]) {
                throw "Texture unit " + activeTextureNum + "already in use!";
            }
            this.boundTo = activeTextureNum;
            Texture.textureUnitAvailable[activeTextureNum] = false;

            gl.activeTexture(activeTextureNum + gl.TEXTURE0);
            this.bind();
            uniform.set1i(activeTextureNum);
        };

        Texture.prototype.detachFromUniform = function () {
            if (this.boundTo == -1) {
                throw "Texture not currently bound";
            }

            Texture.textureUnitAvailable[this.boundTo] = true;
            this.boundTo = -1;
        };

        Texture.prototype.getGLTexture = function () {
            return this.texture;
        };
        Texture.textureUnitAvailable = [true, true, true, true];
        return Texture;
    })();
    WGL.Texture = Texture;
})(WGL || (WGL = {}));
var WGL;
(function (WGL) {
    var VertexAttributeDescription = (function () {
        function VertexAttributeDescription(gl, name, numComponents, typeOfData, normalize, stride, offset) {
            if (typeof typeOfData === "undefined") { typeOfData = -1; }
            if (typeof normalize === "undefined") { normalize = false; }
            if (typeof stride === "undefined") { stride = 0; }
            if (typeof offset === "undefined") { offset = 0; }
            this.Name = name;
            this.NumComponents = numComponents;
            this.TypeOfData = typeOfData >= 0 ? typeOfData : gl.FLOAT;
            this.Normalize = normalize;
            this.Stride = stride;
            this.Offset = offset;
            switch (typeOfData) {
                case gl.FLOAT:
                    this.Size = 4 * this.NumComponents;
                    break;
                default:
                    throw "Invalid typeOfData";
            }
        }
        return VertexAttributeDescription;
    })();
    WGL.VertexAttributeDescription = VertexAttributeDescription;

    var VertexDescriptor = (function () {
        function VertexDescriptor(attributes) {
            var _this = this;
            this.attributes = attributes;
            this.vertexSize = 0;
            attributes.forEach(function (a) {
                return _this.vertexSize += a.Size;
            });
        }
        VertexDescriptor.prototype.buildArray = function (verts, array) {
            if (typeof array === "undefined") { array = null; }
            if (array == null) {
                array = new Float32Array(verts.length * this.vertexSize / 4.0);
            }

            var attrs = this.attributes;
            var pos = 0;
            for (var i = 0; i < verts.length; i++) {
                for (var j = 0; j < attrs.length; j++) {
                    var comp = verts[i].getComponent(attrs[j].Name);
                    if (comp.length != attrs[j].NumComponents) {
                        throw "InvalidVertexFormat";
                    }
                    for (var k = 0; k < comp.length; k++) {
                        array[pos++] = comp[k];
                    }
                }
            }

            return array;
        };

        VertexDescriptor.prototype.enableAndConfigureVertexAttributes = function (shader) {
            shader.use();
            var attrs = this.attributes;
            var offset = 0;
            var stride = this.vertexSize;
            for (var i = 0; i < attrs.length; i++) {
                var attrDesc = attrs[i];
                var vertAttr = shader.getVertexAttribute(attrDesc.Name);
                if (vertAttr !== null) {
                    vertAttr.enable();
                    vertAttr.attribPointer(attrDesc.NumComponents, attrDesc.TypeOfData, attrDesc.Normalize, stride, offset);
                }
                offset += attrDesc.Size;
            }
        };

        VertexDescriptor.prototype.drawContiguous = function (gl, buffer) {
            gl.drawArrays(gl.TRIANGLES, 0, buffer.getNumElements() / (this.vertexSize / 4));
        };

        VertexDescriptor.prototype.disableVertexAttributes = function (shader) {
            shader.use();
            var attrs = this.attributes;
            for (var i = 0; i < attrs.length; i++) {
                var vertAttr = shader.getVertexAttribute(attrs[i].Name);
                if (vertAttr !== null) {
                    vertAttr.disable();
                }
            }
        };
        return VertexDescriptor;
    })();
    WGL.VertexDescriptor = VertexDescriptor;
})(WGL || (WGL = {}));
//# sourceMappingURL=RoadsLib.js.map
