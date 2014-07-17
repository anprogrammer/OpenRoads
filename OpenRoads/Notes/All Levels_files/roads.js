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
var WGL;
(function (WGL) {
    var GLState = (function () {
        function GLState() {
            this.EnableBlend = false;
            this.EnableDepthTest = false;
            this.BlendSrc = WebGLRenderingContext.SRC_ALPHA;
            this.BlendDst = WebGLRenderingContext.ONE_MINUS_SRC_ALPHA;
        }
        return GLState;
    })();
    WGL.GLState = GLState;

    var Renderable = (function () {
        function Renderable(gl, glState, vertexDescriptor, shader, buffer) {
            this.gl = gl;
            this.state = glState;
            this.vertex = vertexDescriptor;
            this.shader = shader;
            this.buffer = buffer;
        }
        Renderable.prototype.setShader = function (shader) {
            this.shader = shader;
        };

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
            this.configureState(this.state);
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
        function Mesh(gl, managers, vertices) {
            this.Position = new TSM.vec3();
            this.ProjectionMatrix = TSM.mat4.perspective(80.0, 320.0 / 200.0, 0.1, 1000.0);

            var shader = managers.Shaders.getShader(gl, managers.Shaders.Shaders.Color3D);
            var vertDesc = Vertices.Vertex3DC.getDescriptor();

            var state = new WGL.GLState();
            state.EnableBlend = false;
            state.EnableDepthTest = true;

            var buffer = new WGL.Buffer(gl);
            buffer.loadData(vertDesc.buildArray(vertices));

            this.setShader(shader);

            _super.call(this, gl, state, vertDesc, shader, buffer);
        }
        Mesh.prototype.setShader = function (shader) {
            this.uPos = shader.getUniform("uPos");
            this.uProjectionMatrix = shader.getUniform("uProjectionMatrix");
            _super.prototype.setShader.call(this, shader);
        };

        Mesh.prototype.preDraw = function (gl, shader) {
            this.uPos.setVec3(this.Position);
            this.uProjectionMatrix.setMat4(this.ProjectionMatrix);
        };

        Mesh.prototype.postDraw = function (gl, shader) {
        };
        return Mesh;
    })(WGL.Renderable);
    Drawing.Mesh = Mesh;
})(Drawing || (Drawing = {}));
var Game;
(function (Game) {
    var ControllerState = (function () {
        function ControllerState(turn, accel, jump) {
            if (turn === -1 || turn === 0 || turn === 1) {
                this.TurnInput = turn;
            } else {
                throw "Invalid TurnInput";
            }

            if (accel === -1 || accel === 0 || accel === 1) {
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
    var DemoController = (function () {
        function DemoController(demo) {
            this.demo = demo;
        }
        DemoController.prototype.update = function (ship) {
            var idx = Math.floor(ship.getZPosition() * DemoController.TilePositionToDemoPosition);
            if (idx >= this.demo.length)
                throw "OOB";
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
    Game.Ship = Ship;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var StateManager = (function () {
        function StateManager(level, controller) {
            this.level = null;
            this.controller = null;
            this.isGoingUp = false;
            this.hasRunJumpOMaster = false;
            this.jumpOMasterInUse = false;
            this.velocityBeforeJump = 0.0;
            this.level = level;
            this.controller = controller;

            this.resetStateVars();
        }
        StateManager.prototype.resetStateVars = function () {
            this.gravityAcceleration = -this.level.Gravity * 0x1680 / 0x190 / 0x80;
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

        StateManager.prototype.runFrame = function () {
            var controls = this.controller.update(this.currentPosToPosition());

            //LOC 2308
            var cell = this.level.getCell(this.currentPosToPosition());
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
                this.applyTouchEffect(touchEffect);
                this.isOnSlidingTile = touchEffect === 4 /* Slide */;
                this.isOnDecelPad = touchEffect === 2 /* Decelerate */;
            }

            if (this.currentZPosition >= this.level.getLength()) {
                //TODO: Game ending.  Are we in a tunnel?
            }

            //LOC 2405
            if (this.expectedYPosition != this.currentYPosition) {
                if (this.slideAmount == 0 || this.offsetAtWhichNotInsideTile >= 2) {
                    var yvel = Math.abs(this.yVelocity);
                    if (yvel > ((this.level.Gravity * 0x104 / 8) >> 8)) {
                        if (this.yVelocity < 0) {
                            //TODO: Play sound effect
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
            this.zVelocity += controls.AccelInput * 0x4B / 0x10000;
            this.clampGlobalZVelocity();

            //LOC 250F
            if (!this.isOnSlidingTile) {
                var canControl1 = (this.isGoingUp || isAboveNothing) && this.xMovementBase === 0 && this.yVelocity > 0 && (this.currentYPosition - this.jumpedFromYPosition) < 0xF;
                var canControl2 = !this.isGoingUp && !isAboveNothing;
                if (canControl1 || canControl2) {
                    this.xMovementBase = controls.TurnInput * 0x1D / 0x80;
                }
            }

            //LOC 2554
            if (!this.isGoingUp && !isAboveNothing && controls.JumpInput && this.level.Gravity < 0x14) {
                this.yVelocity = 0x480 / 0x80;
                this.isGoingUp = true;
                this.jumpedFromYPosition = this.currentYPosition;
            }

            //LOC 2590
            //Something to do with the craft hitting max-height.
            if (this.isGoingUp && !this.hasRunJumpOMaster && this.currentYPosition >= 11.0) {
                this.runJumpOMaster(controls);
                this.hasRunJumpOMaster = true;
            }

            //LOC 25C9
            if (this.currentYPosition >= 0x28) {
                this.yVelocity += this.gravityAcceleration;
            } else if (this.yVelocity > -105 / 0x80) {
                this.yVelocity = -105 / 0x80;
            }

            //LOC 2619
            this.expectedZPosition = this.currentZPosition + this.zVelocity;
            var motionVel = this.zVelocity;
            if (!this.isOnDecelPad) {
                motionVel += 0x618 / 0x10000;
            }
            var xMotion = this.xMovementBase * motionVel + this.slideAmount;
            this.expectedXPosition = this.currentXPosition + xMotion;
            this.expectedYPosition = this.currentYPosition + this.yVelocity;

            //LOC 2699
            var minX = 0x2F80 / 0x80, maxX = 0xD080 / 0x80;
            var currentX = this.currentXPosition, newX = this.expectedXPosition;
            if ((currentX < minX && newX > maxX) || (newX < minX && currentX > maxX)) {
                this.expectedXPosition = currentX;
            }

            //LOC 26BE
            this.moveShipAndConstraint();
            if (this.currentZPosition != this.expectedZPosition) {
                if (this.isInsideTile(this.currentXPosition, this.currentYPosition, this.currentZPosition)) {
                    for (var dir = -1; dir <= 1; dir += 2) {
                        var off = 0x3A0 / 0x80 * dir;
                        if (!this.isInsideTile(this.currentXPosition + off, this.currentYPosition, this.currentZPosition)) {
                            this.currentXPosition += off;
                            this.expectedZPosition = this.currentZPosition;
                            //TODO: Play SFX 2
                        }
                    }
                }
            }

            //LOC 2787
            if (Math.abs(this.currentZPosition - this.expectedZPosition) > 0.01) {
                if (this.zVelocity < 1.0 / 3.0) {
                    this.zVelocity = 0.0;
                    //TODO: Play SFX 2
                } else {
                    this.isDead = true;
                    this.craftState = 1; //Exploded
                }
            }

            //LOC 2820
            if (this.currentXPosition !== this.expectedXPosition) {
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
                if (this.jumpOMasterInUse) {
                    this.zVelocity = this.velocityBeforeJump;
                }
                this.hasRunJumpOMaster = false;
                this.jumpOMasterInUse = false;

                this.isGoingUp = false;
                this.isOnGround = true;
                this.slidingAccel = 0;

                for (var i = 1; i <= 0xE; i++) {
                    if (!this.isInsideTile(this.currentXPosition + i * 0.5, this.currentYPosition - 1.0 / 0x80, this.currentZPosition)) {
                        this.slidingAccel++;
                        this.offsetAtWhichNotInsideTile = i;
                        break;
                    }
                }

                for (var i = 1; i <= 0xE; i++) {
                    if (!this.isInsideTile(this.currentXPosition + i * 0.5, this.currentYPosition - 1.0 / 0x80, this.currentZPosition)) {
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
            this.oxygenRemaining -= 0x7530 / 0x24 * this.level.Oxygen;

            //LOC 2A4E -- Deplete fuel
            this.fuelRemaining -= 0x7530 / (this.zVelocity * this.level.Fuel);
            ///Handle death cases
        };

        StateManager.prototype.applyTouchEffect = function (effect) {
            switch (effect) {
                case 1 /* Accelerate */:
                    this.zVelocity += 0x12F / 0x10000;
                    break;
                case 2 /* Decelerate */:
                    this.zVelocity -= 0x12F / 0x10000;
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

            tunCeils = tunCeils.map(function (h) {
                return h / 0x80;
            });
            tunLows = tunLows.map(function (h) {
                return h / 0x80;
            });

            var inCube = function (c) {
                return yPos < c.Height;
            };
            var inTunnel = function (t) {
                return false;
            };
            var y2 = yPos - 68;
            if (cell.Tunnel != null && cell.Cube == null) {
                return yPos >= tunLows[distFromCenter] && yPos <= tunCeils[distFromCenter];
            } else if (cell.Tunnel == null && cell.Cube != null) {
                return yPos <= cell.Cube.Height;
            } else if (cell.Tunnel != null && cell.Cube != null) {
                return yPos >= tunLows[distFromCenter] && yPos <= cell.Cube.Height;
            } else {
                return false;
            }
        };
        StateManager.prototype.isInsideTile = function (xPos, yPos, zPos) {
            var leftTile = this.level.getCell(this.getPos(xPos - 7, yPos, zPos));
            var rightTile = this.level.getCell(this.getPos(xPos - 7, yPos, zPos));

            if (!leftTile.isEmpty() || !rightTile.isEmpty()) {
                if (yPos < 80 && yPos > 0x1e80 / 0x80) {
                    return true;
                }

                if (yPos < 0x2180 / 0x80) {
                    return false;
                }

                var centerTile = this.level.getCell(this.getPos(xPos, yPos, zPos));
                var distanceFromCenter = (xPos - 49) % 46 - 23;
                var var_A = -46;
                if (distanceFromCenter < 0) {
                    distanceFromCenter = 1 - distanceFromCenter;
                    var_A = -var_A;
                }

                if (this.isInsideTileY(yPos, distanceFromCenter, centerTile)) {
                    return true;
                }

                centerTile = this.level.getCell(this.getPos(xPos + var_A, yPos, zPos));
                if (this.isInsideTileY(yPos, 47 - distanceFromCenter, centerTile)) {
                    return true;
                }
            }
            return false;
        };

        StateManager.prototype.moveShipAndConstraint = function () {
            if (this.currentXPosition == this.expectedXPosition && this.currentYPosition == this.expectedYPosition && this.currentZPosition == this.expectedZPosition) {
                return;
            }

            var iter = 1;
            var interp = function (a, b) {
                return (b - a) * iter / 5 + a;
            };
            for (iter = 1; iter <= 5; iter++) {
                if (this.isInsideTile(interp(this.currentXPosition, this.expectedXPosition), interp(this.currentYPosition, this.expectedYPosition), interp(this.currentZPosition, this.expectedZPosition))) {
                    break;
                }
            }

            iter--; //We care about the list iter we were *NOT* inside a tile
            this.currentXPosition = interp(this.currentXPosition, this.expectedXPosition);
            this.currentYPosition = interp(this.currentYPosition, this.expectedYPosition);
            this.currentZPosition = interp(this.currentZPosition, this.expectedZPosition);

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

            var xGran = this.expectedXPosition > this.currentXPosition ? (0x7D / 0x80) : (-0x7D / 0x80);
            while (xGran > 0) {
                if (Math.abs(this.expectedXPosition - this.currentXPosition) >= Math.abs(xGran) && !this.isInsideTile(this.currentXPosition + xGran, this.currentYPosition, this.currentZPosition)) {
                    this.currentXPosition += xGran;
                } else {
                    xGran = Math.floor(xGran / 5.0 * 0x80) / 0x80;
                }
            }

            var yGran = this.expectedYPosition > this.currentYPosition ? (0x7D / 0x80) : (-0x7D / 0x80);
            while (yGran > 0) {
                if (Math.abs(this.expectedYPosition - this.currentYPosition) >= Math.abs(yGran) && !this.isInsideTile(this.currentXPosition, this.currentYPosition + yGran, this.currentZPosition)) {
                    this.currentYPosition += yGran;
                } else {
                    yGran = Math.floor(yGran / 5.0 * 0x80) / 0x80;
                }
            }
        };

        StateManager.prototype.runJumpOMaster = function (controls) {
            this.velocityBeforeJump = this.zVelocity;
            if (this.willLandOnTile(controls, this.currentXPosition, this.currentYPosition, this.currentZPosition, this.xMovementBase, this.yVelocity, this.zVelocity)) {
                return;
            }

            var zVelocity = this.zVelocity;
            var xMov = this.xMovementBase;
            var i;
            for (i = 1; i <= 6; i++) {
                this.xMovementBase = xMov + xMov * i / 10;
                if (this.willLandOnTile(controls, this.currentXPosition, this.currentYPosition, this.currentZPosition, this.xMovementBase, this.yVelocity, this.zVelocity)) {
                    break;
                }

                this.xMovementBase = xMov - xMov * i / 10;
                if (this.willLandOnTile(controls, this.currentXPosition, this.currentYPosition, this.currentZPosition, this.xMovementBase, this.yVelocity, this.zVelocity)) {
                    break;
                }

                this.xMovementBase = xMov;

                var zv2 = zVelocity + zVelocity * i / 10;
                this.zVelocity = this.clampZVelocity(zv2);
                if (this.zVelocity == zv2) {
                    if (this.willLandOnTile(controls, this.currentXPosition, this.currentYPosition, this.currentZPosition, this.xMovementBase, this.yVelocity, this.zVelocity)) {
                        break;
                    }
                }

                zv2 = zVelocity - zVelocity * i / 10;
                this.zVelocity = this.clampZVelocity(zv2);
                if (this.zVelocity == zv2) {
                    if (this.willLandOnTile(controls, this.currentXPosition, this.currentYPosition, this.currentZPosition, this.xMovementBase, this.yVelocity, this.zVelocity)) {
                        break;
                    }
                }

                this.zVelocity = zVelocity;
            }

            if (i <= 6) {
                this.jumpOMasterInUse = true;
            }
        };

        StateManager.prototype.isOnNothing = function (xPosition, zPosition) {
            var cell = this.level.getCell(this.getPos(xPosition, 0, zPosition));
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
                var xMov = xVelocity * xRate + currentSlideAmount;
                xPos += xMov;
                if (xPos < 0x2F80 / 0x80 || xPos > 0xD080 / 0x80) {
                    return false;
                }

                yPos += yVelocity;
                zVelocity = this.clampZVelocity(this.zVelocity + controls.AccelInput * 0x4B / 0x10000);

                if (yPos <= 0x2800 / 0x80) {
                    return !this.isOnNothing(currentX, currentZ) && !this.isOnNothing(xPos, currentZ);
                }
            }
        };
        return StateManager;
    })();
    Game.StateManager = StateManager;
})(Game || (Game = {}));
var Levels;
(function (Levels) {
    var MeshBuilder = (function () {
        function MeshBuilder() {
            this.CellLength = 46;
            this.CellWidth = 46;
        }
        MeshBuilder.prototype.buildMesh = function (level) {
            var _this = this;
            var verts = [];

            var addCube = function (colors, xLeft, xRight, yBottom, yTop, zStart, zEnd) {
                xLeft -= 3.5 * _this.CellWidth;
                xRight -= 3.5 * _this.CellWidth;

                var addQuad = function (color, p1, p2, p3, p4) {
                    var c = color.toVec3();
                    verts.push(new Vertices.Vertex3DC(p1, c));
                    verts.push(new Vertices.Vertex3DC(p2, c));
                    verts.push(new Vertices.Vertex3DC(p3, c));

                    verts.push(new Vertices.Vertex3DC(p3, c));
                    verts.push(new Vertices.Vertex3DC(p4, c));
                    verts.push(new Vertices.Vertex3DC(p1, c));
                };

                var ltf = new TSM.vec3([xLeft, yTop, -zStart]);
                var rtf = new TSM.vec3([xRight, yTop, -zStart]);
                var lbf = new TSM.vec3([xLeft, yBottom, -zStart]);
                var rbf = new TSM.vec3([xRight, yBottom, -zStart]);
                var ltb = new TSM.vec3([xLeft, yTop, -zEnd]);
                var rtb = new TSM.vec3([xRight, yTop, -zEnd]);
                var lbb = new TSM.vec3([xLeft, yBottom, -zEnd]);
                var rbb = new TSM.vec3([xRight, yBottom, -zEnd]);

                addQuad(colors.Front, ltf, rtf, rbf, lbf);
                addQuad(colors.Left, ltf, lbf, lbb, ltb);
                addQuad(colors.Right, rtf, rbf, rbb, rtb);
                addQuad(colors.Top, ltf, rtf, rtb, ltb);
            };

            for (var z = 0; z < level.getLength(); z++) {
                for (var x = 0; x < 7; x++) {
                    var c = level.Cells[x][z];
                    var xLeft = x * this.CellWidth;
                    var xRight = (x + 1) * this.CellWidth;
                    var zStart = z * this.CellLength;
                    var zEnd = (z + 1) * this.CellLength;
                    if (c.Tile != null) {
                        addCube(c.Tile.Colors, xLeft, xRight, 0x2400 / 0x80, 0x2800 / 0x80, zStart, zEnd);
                    }
                    if (c.Cube != null) {
                        addCube(c.Cube.Colors, xLeft, xRight, 0x2800, c.Cube.Height, zStart, zEnd);
                    }
                }
            }

            return verts;
        };
        return MeshBuilder;
    })();
    Levels.MeshBuilder = MeshBuilder;
})(Levels || (Levels = {}));
var Music;
(function (Music) {
    var Player = (function () {
        function Player(opl, songData, startPos) {
            this.opl = opl;
            this.data = songData;
            this.stream = new Data.ArrayBitStream(songData);
            this.stream.setPosition(startPos * 8);
            this.reader = new Data.BinaryReader(this.stream);
            this.paused = 0;
        }
        Player.prototype.readNote = function () {
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
                oscDesc.KeyScaling = (tremolo & 0x10) > 0;
                oscDesc.Multiplication = tremolo & 0xF;

                oscDesc.KeyScaleLevel = keyScaleLevel >> 6;
                oscDesc.OutputLevel = (keyScaleLevel & 0x3F) / 0x3F * -47.25;

                oscDesc.AttackRate = attackRate >> 4;
                oscDesc.DecayRate = attackRate & 0xF;

                oscDesc.SustainLevel = -45.0 * (sustainLevel >> 4) / 0xF;
                oscDesc.ReleaseRate = sustainLevel & 0xF;

                var waveForms = [0 /* Sine */, 1 /* HalfSine */, 2 /* AbsSign */, 3 /* PulseSign */, 4 /* SineEven */, 5 /* AbsSineEven */, 6 /* Square */, 7 /* DerivedSquare */];
                oscDesc.WaveForm = waveForms[waveForm & 7];

                var n = document.createElement('div');
                n.innerHTML = waveForm + ' - ' + JSON.stringify(oscDesc, undefined, 4);
                document.body.appendChild(n);

                return oscDesc;
            };

            var a = configureOSC(channel, 0);
            var b = configureOSC(channel, 1);
            var channelConfig = instrReader.getUint8();
            var additive = (channelConfig & 1) > 0;
            var feedback = (channelConfig >> 7) & 3;
            this.opl.setChannelConfig(channel, a, b, additive, feedback);
            var n = document.createElement('div');
            n.innerHTML = additive + ' ' + feedback;
            document.body.appendChild(n);
        };

        Player.prototype.pause = function (cmdHigh) {
            this.paused = cmdHigh;
        };

        Player.prototype.turnOffNoteOrPlayBase = function (cmdLow, cmdHigh) {
            var channelNum = cmdLow;
            if (channelNum < 6) {
                this.opl.stopNote(channelNum);
            }
        };

        Player.prototype.playNote = function (low, high) {
            var channels = [0, 1, 2, 3, 4, 5, 6, 7];
            var lowFreqs = [0xAC, 0xB6, 0xC1, 0xCD, 0xD9, 0xE6, 0xF3, 0x02, 0x11, 0x22, 0x33, 0x45];
            var highFreqs = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1];

            var channelNum = low, note = high % 12, octave = Math.floor(high / 12) + 2;
            if (channelNum < 6) {
                var blockNum = octave;
                var freqN = (highFreqs[note] << 8) | lowFreqs[note];

                this.opl.startNote(channelNum, freqN, blockNum);
            } else {
                //Drums
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
        }
        return OscState;
    })();
    Music.OscState = OscState;

    var Channel = (function () {
        function Channel() {
            this.A = new OscState();
            this.B = new OscState();
            this.Additive = false;
            this.FreqNum = 0.0;
            this.BlockNum = 0.0;
        }
        return Channel;
    })();

    var OPL = (function () {
        function OPL(audioContext) {
            var _this = this;
            this.sampleRate = 44100;
            this.src = null;
            this.timeSinceNote = 0;
            this.noteTickRate = 5 / 1000.0;
            this.time = 0.0;
            this.synthTime = 0.0;
            this.timePassed = 0.0;
            this.VMin = -96.0;
            this.VMax = 0.0;
            this.audioContext = audioContext;
            this.channels = [];
            for (var i = 0; i < 6; i++) {
                this.channels.push(new Channel());
            }

            this.sampleRate = audioContext.sampleRate;
            var node = audioContext.createScriptProcessor(4096, 0, 1);
            node.onaudioprocess = function (evt) {
                _this.handleTick(evt);
            };
            node.connect(audioContext.destination);
        }
        OPL.prototype.setSource = function (mp) {
            this.src = mp;
        };

        OPL.prototype.setChannelConfig = function (n, a, b, isAdditive, feedbackAmt) {
            this.channels[n].A.Config = a;
            this.channels[n].B.Config = b;
            this.channels[n].Additive = isAdditive;
        };

        OPL.prototype.startNote = function (channel, freqNum, blockNum) {
            var chan = this.channels[channel];
            function configureOSC(osc) {
                if (chan.FreqNum == freqNum && chan.BlockNum == blockNum && osc.State == 2 /* Sustain */) {
                    return;
                }

                osc.State = 1 /* Attack */;
                osc.Volume = this.VMin;
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

        OPL.prototype.handleTick = function (evt) {
            if (this.src == null) {
                return;
            }
            var dt = Date.now();
            var buffer = evt.outputBuffer.getChannelData(0);
            var synthOut = 0.0;
            for (var i = 0; i < buffer.length; i++) {
                this.timePassed = 1.0 / this.sampleRate;
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
                        synthOut += this.processChannelOutput(this.channels[j]) * 0.5;
                    }
                    this.synthTime -= Music.OPLConstants.SampleTime;
                }

                buffer[i] = synthOut;
            }
            var dt2 = Date.now();
        };

        OPL.prototype.processChannelOutput = function (c) {
            if (c.Additive) {
                var a = this.processOsc(c.A, c.FreqNum, c.BlockNum, 0.0);
                var b = this.processOsc(c.B, c.FreqNum, c.BlockNum, 0.0);
                return a + b;
            } else {
                var a = this.processOsc(c.A, c.FreqNum, c.BlockNum, 0.0);
                var b = this.processOsc(c.B, c.FreqNum, c.BlockNum, a);
                return b;
            }

            return 0.0;
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

            function getExponentialGrowthStep(ms, end) {
                var steps = Math.floor(1000.0 * ms / Music.OPLConstants.SampleTime);

                //x^steps = end
                //log(end) / log(x) = steps
                //log(x) = log(end)/steps
                //x = 10^(log(end)/steps)
                //x = log(end)/log(steps)
                return Math.log(end) / Math.log(steps);
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
                        var steps = Math.floor(timeToAttack / 1000.0 / Music.OPLConstants.SampleTime);
                        var stepConst = Math.exp(Math.log(96.0) / steps);
                        var cstepPow = Math.pow(stepConst, (steps - osc.EnvelopeStep));
                        osc.Volume = -cstepPow;
                        osc.EnvelopeStep++;
                        if (osc.EnvelopeStep == steps) {
                            osc.EnvelopeStep = 0;
                            osc.Volume = this.VMax;
                            osc.State = 3 /* Decay */;
                        }
                    }
                    break;
                case 3 /* Decay */:
                    var rate = getRate(conf.DecayRate);
                    var timeToDecay = Music.OPLConstants.DecayRates[rate];
                    if (timeToDecay == 0) {
                        osc.Volume = conf.SustainLevel;
                        osc.EnvelopeStep = 0;
                        osc.State = 2 /* Sustain */;
                    } else {
                        var steps = Math.floor(timeToDecay / 1000.0 / Music.OPLConstants.SampleTime);
                        var decreaseAmt = conf.SustainLevel / steps;
                        osc.Volume += decreaseAmt;
                        osc.EnvelopeStep++;
                        if (osc.EnvelopeStep == steps) {
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

            var freqStarts = [0.047, 0.094, 0.189, 0.379, 0.758, 1.517, 3.034, 6.068];
            var freqSteps = [0.048, 0.095, 0.190, 0.379, 0.759, 1.517, 3.034, 6.069];

            var freq = freqStarts[blockNum] + freqSteps[blockNum] * freqNum;
            freq *= (conf.Multiplication == 0 ? 0.5 : conf.Multiplication);

            var angle = this.time * 2 * Math.PI * freq + modulator;
            var s = Math.sin(angle);
            var wave = s;
            switch (conf.WaveForm) {
                case 1 /* HalfSine */:
                    wave = Math.max(s, 0.0);
                    break;
                case 2 /* AbsSign */:
                    wave = Math.abs(s);
                    break;
                case 3 /* PulseSign */:
                    wave = angle % 6.28 < 1.57 ? s : 0.0;
                    break;
                case 4 /* SineEven */:
                    wave = angle % 12.56 < 6.28 ? s : 0.0;
                    break;
                case 5 /* AbsSineEven */:
                    wave = angle % 12.56 < 6.28 ? Math.abs(s) : 0.0;
                    break;
                case 6 /* Square */:
                    wave = s > 1.0 ? 1.0 : 0.0;
                    break;
                case 7 /* DerivedSquare */:
                    wave = s > 1.0 ? 1.0 : 0.0;
                    break;
            }

            return wave * Math.pow(10.0, (osc.Volume + conf.OutputLevel) / 10.0);
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
        return OPLConstants;
    })();
    Music.OPLConstants = OPLConstants;
})(Music || (Music = {}));
var Sounds;
(function (Sounds) {
    var SoundEffect = (function () {
        function SoundEffect(audioContext, stream) {
            var numBytes = stream.getLength();
            var reader = new Data.BinaryReader(stream);
            var buffer = audioContext.createBuffer(1, numBytes, 8000);

            var bufferArr = new Float32Array(numBytes);
            for (var i = 0; i < numBytes; i++) {
                bufferArr[i] = (reader.getUint8() - 127) / 1280.0;
            }

            buffer.getChannelData(0).set(bufferArr);
            this.buffer = buffer;
            this.audioContext = audioContext;
        }
        SoundEffect.prototype.play = function () {
            var source = this.audioContext.createBufferSource();
            source.buffer = this.buffer;
            source.connect(this.audioContext.destination);
            source.start(0);
        };
        return SoundEffect;
    })();
    Sounds.SoundEffect = SoundEffect;
})(Sounds || (Sounds = {}));
/// <reference path="../WGL/Renderable.ts" />
var Drawing;
(function (Drawing) {
    var Sprite = (function (_super) {
        __extends(Sprite, _super);
        function Sprite(gl, managers, texture) {
            this.Texture = texture.Texture;
            this.Position = new TSM.vec2([texture.XOffset, texture.YOffset]);
            this.Size = new TSM.vec2([texture.Width, texture.Height]);
            this.Alpha = 1.0;
            this.Brightness = 1.0;

            var shader = managers.Shaders.getShader(gl, managers.Shaders.Shaders.Basic2D);
            var vertDesc = Vertices.Vertex2D.getDescriptor();
            var vertices = [
                new Vertices.Vertex2D(0.0, 0.0),
                new Vertices.Vertex2D(1.0, 0.0),
                new Vertices.Vertex2D(1.0, 1.0),
                new Vertices.Vertex2D(1.0, 1.0),
                new Vertices.Vertex2D(0.0, 1.0),
                new Vertices.Vertex2D(0.0, 0.0)
            ];

            var state = new WGL.GLState();
            state.EnableBlend = true;

            var buffer = new WGL.Buffer(gl);
            buffer.loadData(vertDesc.buildArray(vertices));

            this.setShader(shader);

            _super.call(this, gl, state, vertDesc, shader, buffer);
        }
        Sprite.prototype.setShader = function (shader) {
            this.uSampler = shader.getUniform("uSampler");
            this.uPos = shader.getUniform("uPos");
            this.uSize = shader.getUniform("uSize");
            this.uAlpha = shader.getUniform("uAlpha");
            this.uBrightness = shader.getUniform("uBrightness");
            _super.prototype.setShader.call(this, shader);
        };

        Sprite.prototype.preDraw = function (gl, shader) {
            this.Texture.attachToUniform(this.uSampler);
            this.uPos.setVec2(this.Position);
            this.uSize.setVec2(this.Size);
            this.uBrightness.set1f(this.Brightness);
            this.uAlpha.set1f(this.Alpha);
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
        function FrameManager(canvas, gs, clock) {
            var _this = this;
            this.physicsTime = 0;
            this.canvas = canvas;
            this.ctx = this.canvas.getContext('experimental-webgl');
            this.gameState = gs;
            gs.load(this.ctx);

            this.clock = clock;
            requestAnimationFrame(function () {
                return _this.onFrame();
            });
        }
        FrameManager.prototype.maintainCanvasSize = function () {
            var w = 320, h = 240, ratio = w / h;
            var bw = document.body.clientWidth, bh = document.body.clientHeight;
            var cw = Math.min(bw, bh * ratio), ch = cw / ratio;
            this.canvas.width = cw;
            this.canvas.height = ch;
            this.canvas.style.top = (bh / 2 - ch / 2) + 'px';
            this.canvas.style.left = (bw / 2 - cw / 2) + 'px';
        };

        FrameManager.prototype.onFrame = function () {
            var _this = this;
            this.maintainCanvasSize();

            var time = this.clock.nextFrame();
            var physStep = time.getPhysicsStep();
            this.physicsTime += time.getFrameTime();

            while (this.physicsTime >= physStep) {
                this.gameState.updatePhysics(this, time);
                this.physicsTime -= physStep;
            }

            this.gameState.drawFrame(this.ctx, this.canvas, this, time);

            requestAnimationFrame(function () {
                return _this.onFrame();
            });
        };
        return FrameManager;
    })();
    Engine.FrameManager = FrameManager;
})(Engine || (Engine = {}));
window.onload = function () {
    TestRuns.TestLevel();
    return;

    //TestRuns.TestAnims();
    //TestRuns.TestDats();
    //new TestRuns.TestPhysics();
    //return;
    var manager = new Managers.StreamManager(), shaderManager = new Managers.ShaderManager(manager), textureManager = new Managers.TextureManager(manager), soundManager = new Managers.SoundManager(manager, new webkitAudioContext());
    var managers = new Managers.ManagerSet(manager, shaderManager, textureManager, soundManager);

    manager.loadMultiple([
        "Shaders/basic_2d.fs", "Shaders/basic_2d.vs", 'Shaders/title_2d.fs', 'Shaders/title_2d.vs', 'Shaders/color_3d.vs', 'Shaders/color_3d.fs',
        "Data/INTRO.LZS", "Data/ANIM.LZS",
        "Data/INTRO.SND", "Data/SFX.SND",
        "Data/ROADS.LZS", "Data/WORLD0.LZS", "Data/DEMO.REC"]).done(function () {
        var cvs = document.getElementById('cvs');
        cvs.style.display = 'block';
        var demoCon = new Game.DemoController(manager.getRawArray('Data/DEMO.REC'));
        var fm = new Engine.FrameManager(cvs, new States.GameState(managers, 0, demoCon), new Engine.Clock());
    });
    /*
    var manager = new Managers.StreamManager(), shaderManager = new Managers.ShaderManager(manager),
    textureManager = new Managers.TextureManager(manager), soundManager = new Managers.SoundManager(manager, new webkitAudioContext());
    var managers = new Managers.ManagerSet(manager, shaderManager, textureManager, soundManager);
    
    manager.loadMultiple(["Shaders/basic_2d.fs", "Shaders/basic_2d.vs", 'Shaders/title_2d.fs', 'Shaders/title_2d.vs',
    "Data/INTRO.LZS", "Data/ANIM.LZS",
    "Data/INTRO.SND", "Data/SFX.SND"]).done(() => {
    var cvs = <HTMLCanvasElement>document.getElementById('cvs');
    cvs.style.display = 'block';
    var fm = new Engine.FrameManager(cvs, new States.Intro(managers), new Engine.Clock());
    });
    return;
    */
    /*
    var manager = new Managers.StreamManager();
    manager.load('Data/MUZAX.LZS').then(() => {
    var bs = manager.getStream('Data/MUZAX.LZS');
    
    
    var cvs = <HTMLCanvasElement>document.getElementById('cvs');
    cvs.width = 2000;
    cvs.height = 480;
    
    var ctx = cvs.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#F00';
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    ctx.lineWidth = 1;
    
    var actx: AudioContext = null;
    var w = <any>window;
    if (w['AudioContext']) {
    actx = new w['AudioContext']();
    } else {
    actx = new webkitAudioContext();
    }
    var source = actx.createBufferSource();
    
    bs.setPosition(0x78 * 8);
    
    var ds = new Data.CompressedByteStream(new Data.BinaryReader(bs));
    var br = new Data.BinaryReader(ds);
    var l = 0x301E;
    
    
    var buff = new Uint8Array(l);
    var dbg: number[] = [];
    for (var i = 0; i < l; i++) {
    var bt = br.getUint8();
    buff[i] = bt;
    dbg.push(bt);
    }
    
    var opl = new Music.OPL(actx);
    var mp = new Music.Player(opl, buff, 0x90);
    
    opl.setSource(mp);
    
    console.log(bs.getPosition() / 8);
    });
    */
};
var Managers;
(function (Managers) {
    var ManagerSet = (function () {
        function ManagerSet(streams, shaders, textures, sounds) {
            this.Streams = streams;
            this.Shaders = shaders;
            this.Textures = textures;
            this.Sounds = sounds;
        }
        return ManagerSet;
    })();
    Managers.ManagerSet = ManagerSet;
})(Managers || (Managers = {}));
var Managers;
(function (Managers) {
    var ShaderManager = (function () {
        function ShaderManager(streamManager) {
            this.shaders = {};
            this.Shaders = {
                Basic2D: 'Shaders/basic_2d.',
                TitleEffect2D: 'Shaders/title_2d.',
                Color3D: 'Shaders/color_3d.'
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
        function SoundManager(streamManager, audioContext) {
            this.sounds = {};
            this.Sounds = {
                Intro: 'Data/INTRO.SND'
            };
            this.streamManager = streamManager;
            this.audioContext = audioContext;
        }
        SoundManager.prototype.getSound = function (soundName) {
            soundName = soundName.toUpperCase();
            if (!(soundName in this.sounds)) {
                this.sounds[soundName] = new Sounds.SoundEffect(this.audioContext, this.streamManager.getStream(soundName));
            }
            return this.sounds[soundName];
        };
        return SoundManager;
    })();
    Managers.SoundManager = SoundManager;
})(Managers || (Managers = {}));
var Managers;
(function (Managers) {
    var StreamManager = (function () {
        function StreamManager() {
            this.streams = {};
        }
        StreamManager.prototype.load = function (filename) {
            var _this = this;
            var p = P.defer();

            var oReq = new XMLHttpRequest();
            oReq.open("GET", filename, true);
            oReq.responseType = "arraybuffer";
            oReq.onload = function (oEvent) {
                var arrayBuffer = oReq.response;
                var result = new Uint8Array(arrayBuffer);
                _this.streams[filename.toUpperCase()] = result;
                p.resolve(result);
            };
            oReq.send(null);

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
        function TextureManager(streamManager) {
            this.textures = {};
            this.streamManager = streamManager;
        }
        TextureManager.prototype.getTexture = function (gl, filename) {
            filename = filename.toUpperCase();
            return this.getTextures(gl, filename)[0];
        };

        TextureManager.prototype.getTextures = function (gl, filename) {
            filename = filename.toUpperCase();
            if (!(filename in this.textures)) {
                var images = null;

                var stream = this.streamManager.getStream(filename);
                if (filename.split('.')[1].toUpperCase() == 'LZS') {
                    var loader = new Images.ImageSetLoader();
                    images = loader.load(stream);
                } else {
                    var loader = new Images.DatLoader();
                    images = loader.load(stream);
                }
                this.textures[filename] = [this.imageFragmentsToTextureFragments(gl, images)];
            }
            return this.textures[filename][0];
        };

        TextureManager.prototype.getAnim = function (gl, filename) {
            var _this = this;
            filename = filename.toUpperCase();
            if (!(filename in this.textures)) {
                var stream = this.streamManager.getStream(filename);
                var loader = new Images.AnimLoader();
                var anim = loader.load(stream);
                this.textures[filename] = anim.map(function (images) {
                    return _this.imageFragmentsToTextureFragments(gl, images);
                });
            }
            return this.textures[filename];
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
/* INTRO TODO:
* Music
* Demo level sequence
*/
var States;
(function (States) {
    var GameState = (function () {
        function GameState(managers, levelNum, controller) {
            this.managers = managers;
            this.frame = 0;
            this.levelNum = levelNum;
            this.controller = controller;
        }
        GameState.prototype.load = function (gl) {
            var managers = this.managers;
            this.background = new Drawing.Sprite(gl, managers, managers.Textures.getTexture(gl, "Data/WORLD0.LZS"));

            var ll = new Levels.MultiLevelLoader(managers.Streams.getStream("Data/ROADS.LZS"));
            var level = ll.Levels[this.levelNum];

            this.game = new Game.StateManager(level, this.controller);
            var meshBuilder = new Levels.MeshBuilder();
            this.mesh = new Drawing.Mesh(gl, managers, meshBuilder.buildMesh(level));
            this.mesh.Position.y = -120.0;
            this.mesh.Position.z = -4 * 46.0;
            /*
            this.mesh = new Drawing.Mesh(gl, managers, [
            new Vertices.Vertex3DC(new TSM.vec3([-23.0, 0.0, -46.0]), new TSM.vec3([1.0, 0.0, 0.0])),
            new Vertices.Vertex3DC(new TSM.vec3([0.0, 8.0, -46.0]), new TSM.vec3([0.0, 1.0, 0.0])),
            new Vertices.Vertex3DC(new TSM.vec3([23.0, 0.0, -46.0]), new TSM.vec3([0.0, 0.0, 1.0]))
            ]);
            */
        };

        GameState.prototype.unload = function () {
        };

        GameState.prototype.updatePhysics = function (frameManager, frameTimeInfo) {
            var fps = frameTimeInfo.getFPS();
            this.frame++;
            if (this.frame % 2 == 0 || true) {
                this.game.runFrame();
                this.game.runFrame();
            }
        };

        GameState.prototype.drawFrame = function (gl, canvas, frameManager, frameTimeInfo) {
            var helper = new States.GLStateHelper();
            helper.startFrame(gl, canvas);
            this.background.draw();
            gl.clear(gl.DEPTH_BUFFER_BIT);
            gl.disable(gl.CULL_FACE);
            this.mesh.Position.z = this.game.currentZPosition * 46.0 - 46.0;
            this.mesh.draw();
        };
        return GameState;
    })();
    States.GameState = GameState;
})(States || (States = {}));
var States;
(function (States) {
    var GLStateHelper = (function () {
        function GLStateHelper() {
        }
        GLStateHelper.prototype.startFrame = function (gl, canvas) {
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0.5, 0.5, 0.5, 1.0);
            gl.clear(WebGLRenderingContext.COLOR_BUFFER_BIT | WebGLRenderingContext.DEPTH_BUFFER_BIT);
        };
        return GLStateHelper;
    })();
    States.GLStateHelper = GLStateHelper;
})(States || (States = {}));
/* INTRO TODO:
* Music
* Demo level sequence
*/
var States;
(function (States) {
    var Intro = (function () {
        function Intro(managers) {
            this.managers = managers;
            this.totalTime = 0.0;
            this.frame = 0;
            this.titleProgress = 0.0;
        }
        Intro.prototype.load = function (gl) {
            var managers = this.managers;
            var introParts = managers.Textures.getTextures(gl, "Data/INTRO.LZS");
            var intro = introParts.map(function (tf) {
                return new Drawing.Sprite(gl, managers, tf);
            });
            this.anim = managers.Textures.getAnim(gl, "Data/ANIM.LZS").map(function (f) {
                return f.map(function (tf) {
                    return new Drawing.Sprite(gl, managers, tf);
                });
            });
            this.background = intro[0];

            var titleShader = managers.Shaders.getShader(gl, managers.Shaders.Shaders.TitleEffect2D);
            this.titleLeft = new Drawing.Sprite(gl, managers, introParts[1]);
            this.titleLeft.setShader(titleShader);
            this.titleLeft.Brightness = -1;
            this.titleRight = new Drawing.Sprite(gl, managers, introParts[1]);
            this.titleRight.setShader(titleShader);
            this.titleRight.Brightness = 1;

            this.introSound = managers.Sounds.getSound(managers.Sounds.Sounds.Intro);

            this.frames = intro.slice(2);
            this.animFrame = null;
            this.creditFrame = null;
        };

        Intro.prototype.unload = function () {
        };

        Intro.prototype.updatePhysics = function (frameManager, frameTimeInfo) {
            var fps = frameTimeInfo.getFPS();
            if (this.frame == fps / 2) {
                this.introSound.play();
            }
            this.frame++;
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
                } else {
                    this.creditFrame.Alpha = 1.0;
                }
            }
        };

        Intro.prototype.drawFrame = function (gl, canvas, frameManager, frameTimeInfo) {
            var helper = new States.GLStateHelper();
            helper.startFrame(gl, canvas);
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
    })();
    States.Intro = Intro;
})(States || (States = {}));
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

        loadStream('Data/WORLD0.LZS', function (backBS) {
            loadStream('Data/DASHBRD.LZS', function (dashBS) {
                loadStream('Data/OXY_DISP.DAT', function (dat1BS) {
                    loadStream('Data/FUL_DISP.DAT', function (dat2BS) {
                        loadStream('Data/SPEED.DAT', function (dat3BS) {
                            var back = new Images.ImageSetLoader().load(backBS)[0];
                            var dash = new Images.ImageSetLoader().load(dashBS)[0];
                            var oxys = [new Images.DatLoader().load(dat1BS), new Images.DatLoader().load(dat2BS), new Images.DatLoader().load(dat3BS)];

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

        loadStream("Data/INTRO.LZS", function (bsIntro) {
            loadStream("Data/ANIM.LZS", function (bsAnim) {
                var parts = new Images.ImageSetLoader().load(bsIntro);
                var anim = new Images.AnimLoader().load(bsAnim);
                var canvas = document.createElement('canvas');
                canvas.width = 320;
                canvas.height = 200;
                document.body.appendChild(canvas);

                var i = 0, j = 0;
                var ctx = canvas.getContext('2d');

                function drawFrame() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(parts[0].Canvas, parts[0].XOffset, parts[0].YOffset);
                    var frame = anim[j];
                    for (var k = 0; k < frame.length; k++) {
                        ctx.drawImage(frame[k].Canvas, frame[k].XOffset, frame[k].YOffset);
                    }
                    ctx.drawImage(parts[i].Canvas, parts[i].XOffset, parts[i].YOffset);
                    requestAnimationFrame(drawFrame);
                }
                requestAnimationFrame(drawFrame);
                setInterval(function () {
                    j = (j + 1) % anim.length;
                }, 1000 / 30);
                setInterval(function () {
                    i = (i) % (parts.length - 1) + 1;
                }, 1000);
            });
        });
    }
    TestRuns.TestAnims = TestAnims;
    ;
})(TestRuns || (TestRuns = {}));
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

        Color.prototype.toCss = function () {
            return 'rgb(' + this.R + ',' + this.G + ',' + this.B + ')';
        };

        Color.prototype.toVec3 = function () {
            return new TSM.vec3([this.R / 255.0, this.G / 255.0, this.B / 255.0]);
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
        function AnimLoader() {
        }
        AnimLoader.prototype.load = function (stream) {
            var helper = new LoaderHelper();

            var colorMap = null;
            var pixelMap = null;

            var reader = new Data.BinaryReader(stream);
            var expectedAnim = reader.getFixedLengthString(4);
            if (expectedAnim != "ANIM") {
                throw "Unexpected Ident: " + expectedAnim;
            }

            reader.getUint16(); //Not sure what I'm skipping

            var remainingInFrame = 0;
            var frames = [];
            var frame = [];
            var pc = 0;
            while (!stream.eof()) {
                var ident = reader.getFixedLengthString(4);
                if (ident == "CMAP") {
                    colorMap = helper.loadColorMap(reader);
                    remainingInFrame = reader.getUint16();
                    frame = [];
                    frames.push(frame);
                } else if (ident == "PICT") {
                    pixelMap = helper.loadPixelMap(reader);
                    stream.setPosition(Math.ceil(stream.getPosition() / 8) * 8);

                    if (colorMap != null && pixelMap != null) {
                        frame.push(helper.assembleImage(frame.length == 0 && frames.length == 1, colorMap, pixelMap));
                        pc++;
                    }

                    remainingInFrame--;
                    if (remainingInFrame == 0) {
                        remainingInFrame = reader.getUint16();
                        frame = [];
                        frames.push(frame);
                    }
                } else {
                    //throw "Unexpected ident: " + ident;
                    console.log('Aborting due to unexpected ident: ' + ident + ' -- ' + frames.length);
                    console.log('Collected ' + pc + ' frames');
                    return frames;
                }
            }

            return frames;
        };
        return AnimLoader;
    })();
    Images.AnimLoader = AnimLoader;

    var ImageSetLoader = (function () {
        function ImageSetLoader() {
        }
        ImageSetLoader.prototype.load = function (stream) {
            var helper = new LoaderHelper();
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
                        results.push(helper.assembleImage(results.length == 0, colorMap, pixelMap));
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
        function DatLoader() {
        }
        DatLoader.prototype.load = function (stream) {
            var results = [];
            var helper = new LoaderHelper();
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
        function LoaderHelper() {
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

            var canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;

            var ctx = canvas.getContext('2d');
            var data = ctx.getImageData(0, 0, w, h);

            var pixelCount = w * h;
            for (var i = 0; i < pixelCount; i++) {
                var px = colorMap[pixelMap.Data[i]];
                if (px) {
                    data.data[i * 4 + 0] = px.R;
                    data.data[i * 4 + 1] = px.G;
                    data.data[i * 4 + 2] = px.B;
                }
                data.data[i * 4 + 3] = px && (noTransparentPixels || pixelMap.Data[i] != 0) ? 255 : 0;
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
        function Cell(level, colorLow, colorHigh, colorIndex, colorRaw, flags) {
            this.Tunnel = null;
            this.Cube = null;
            this.Tile = null;
            this.CI = colorRaw;
            if (flags & 1) {
                this.Tunnel = new TunnelProperties(level.getTunnelColors());
            }
            var lowEffect;
            switch (colorIndex & 0xF) {
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
            switch ((colorIndex >> 4) & 0xF) {
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
                var colors = colorHigh != null && colorIndex > 0 ? level.getTileColors(colorIndex) : level.getCubeColors();
                this.Cube = new CubeProperties(height, colors, highEffect);
            }

            if (colorIndex > 0) {
                this.Tile = new TileProperties(level.getTileColors(colorIndex), lowEffect);
            }
        }
        Cell.prototype.isEmpty = function () {
            return this.Cube == null && this.Tile == null && this.Tunnel == null;
        };

        Cell.getEmpty = function () {
            return new Cell(null, null, null, 0, 0, 0);
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
        Level.prototype.getCell = function (pos) {
            var x = pos.getXPosition() - 95;

            var z = Math.floor(pos.getZPosition());
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

        Level.prototype.getLength = function () {
            return this.Cells[0].length;
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
                    col.push(new Levels.Cell(level, colorLow > 0 ? colors[colorLow] : null, colorHigh > 0 ? colors[colorHigh] : null, color, bytes[idx], bytes[idx + 1]));
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
var TestRuns;
(function (TestRuns) {
    var TestPhysics = (function () {
        function TestPhysics() {
            var _this = this;
            this.frame = 0;
            var manager = new Managers.StreamManager();
            this.manager = manager;
            manager.loadMultiple(["Data/DEMO.REC", "Data/ROADS.LZS"]).done(function () {
                var cvs = document.getElementById('cvs');
                _this.cvs = cvs;
                cvs.style.display = 'block';
                cvs.width = 40 * 20;
                cvs.height = 7 * 30;
                cvs.style.width = 40 * 20 + 'px';
                cvs.style.height = 7 * 30 + 'px';
                _this.ctx = cvs.getContext('2d');
                _this.start();
            });
        }
        TestPhysics.prototype.start = function () {
            var _this = this;
            var ll = new Levels.MultiLevelLoader(this.manager.getStream('Data/ROADS.LZS'));
            var rec = this.manager.getRawArray('Data/DEMO.REC');

            this.level = ll.Levels[0];
            this.game = new Game.StateManager(this.level, new Game.DemoController(rec));

            for (var i = 0; i < 30 * 12; i++) {
                this.game.runFrame();
            }

            var rf = function () {
                _this.onFrame();
                requestAnimationFrame(rf);
            };
            requestAnimationFrame(rf);
        };

        TestPhysics.prototype.onFrame = function () {
            if (this.frame % 2 == 0) {
                this.game.runFrame();
            }
            this.frame++;
            var ctx = this.ctx;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, this.cvs.width, this.cvs.height);
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, this.cvs.width, this.cvs.height);

            var TSX = 40;
            var TSY = 30;

            ctx.translate(-TSX * this.game.currentZPosition + TSX, 0.0);
            var l = this.level;
            for (var i = 0; i < l.getLength(); i++) {
                for (var j = 0; j < 7; j++) {
                    var c = l.Cells[j][i];
                    if (c.Tile != null) {
                        ctx.fillStyle = c.Tile.Colors.Top.toCss();
                        ctx.fillRect(i * TSX, j * TSY, TSX, TSY);
                    }
                }
            }

            ctx.fillStyle = '#7777FF';
            ctx.beginPath();
            ctx.arc(TSX * this.game.currentZPosition, TSY * (this.game.currentXPosition - 95) / 0x2E, this.game.currentYPosition * TSY / 120.0 * 0.75, 0, 2 * Math.PI);
            ctx.fill();

            ctx.strokeStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(TSX * this.game.currentZPosition, TSY * (this.game.currentXPosition - 95) / 0x2E, 0.75 * TSY, 0, 2 * Math.PI);
            ctx.stroke();
        };
        return TestPhysics;
    })();
    TestRuns.TestPhysics = TestPhysics;
})(TestRuns || (TestRuns = {}));
var TestRuns;
(function (TestRuns) {
    function TestTrekDat() {
        var manager = new Managers.StreamManager(), shaderManager = new Managers.ShaderManager(manager), textureManager = new Managers.TextureManager(manager), soundManager = new Managers.SoundManager(manager, new webkitAudioContext());
        var managers = new Managers.ManagerSet(manager, shaderManager, textureManager, soundManager);

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
                    console.log(startIdx);
                    var stream = new Data.ArrayBitStream(arr);
                    stream.setPosition(startIdx * 8);

                    var reader = new Data.BinaryReader(stream);

                    var color = reader.getUint8();
                    var ptr = reader.getUint16();
                    while (true) {
                        var v = reader.getUint8();
                        if (v == 0xFF) {
                            break;
                        }

                        var ptr2 = ptr - v;

                        var ct = reader.getUint8();
                        reader.getUint8();

                        ctx.fillRect(ptr2 % 320, ptr2 / 320, ct, 1);

                        ptr += 320;
                    }
                }

                var i = 0;
                var inp = document.createElement('input');
                inp.value = '0';
                inp.style.display = 'block';
                inp.style.position = 'absolute';
                inp.style.right = '0px';
                document.body.appendChild(inp);
                inp.onchange = function () {
                    var ib = parseInt(inp.value);
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, 320, 200);
                    for (var i = 0; i < 10; i++) {
                        var idx = 48 * i + ib * 2;
                        ctx.fillStyle = ['#FF0000', '#00FF00', '#0000FF'][i % 3];
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
})(TestRuns || (TestRuns = {}));
var Vertices;
(function (Vertices) {
    var Vertex2D = (function () {
        function Vertex2D(x, y) {
            this.X = x;
            this.Y = y;
        }
        Vertex2D.getDescriptor = function () {
            return new WGL.VertexDescriptor([
                new WGL.VertexAttributeDescription("aPos", 2, WebGLRenderingContext.FLOAT, true, 8, 0)
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
        function Vertex3DC(pos, color) {
            this.Position = pos;
            this.Color = color;
        }
        Vertex3DC.getDescriptor = function () {
            return new WGL.VertexDescriptor([
                new WGL.VertexAttributeDescription("aPos", 3, WebGLRenderingContext.FLOAT, true, 24, 0),
                new WGL.VertexAttributeDescription("aColor", 3, WebGLRenderingContext.FLOAT, true, 24, 12)
            ]);
        };

        Vertex3DC.prototype.getComponent = function (name) {
            if (name == "aPos") {
                return this.Position.xyz;
            } else if (name == "aColor") {
                return this.Color.xyz;
            } else {
                throw "Bad component: " + name;
            }
        };
        return Vertex3DC;
    })();
    Vertices.Vertex3DC = Vertex3DC;
})(Vertices || (Vertices = {}));
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
            if (typeof bufferType === "undefined") { bufferType = WebGLRenderingContext.ARRAY_BUFFER; }
            this.gl = gl;
            this.buffer = gl.createBuffer();
            this.bufferType = bufferType;
            this.size = -1;
        }
        Buffer.prototype.bind = function () {
            this.gl.bindBuffer(this.bufferType, this.buffer);
        };

        Buffer.prototype.loadData = function (data, usage) {
            if (typeof usage === "undefined") { usage = WebGLRenderingContext.STATIC_DRAW; }
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
    var Shader = (function () {
        function Shader(gl, vertexSource, fragmentSource) {
            function getShader(src, type) {
                var shader = gl.createShader(type);

                gl.shaderSource(shader, src);
                gl.compileShader(shader);

                if (!gl.getShaderParameter(shader, WebGLRenderingContext.COMPILE_STATUS)) {
                    console.log(src);
                    console.log(gl.getShaderInfoLog(shader));
                    throw "Shader failed to compile.";
                }

                return shader;
            }

            var vertShader = getShader(vertexSource, WebGLRenderingContext.VERTEX_SHADER);
            var fragShader = getShader(fragmentSource, WebGLRenderingContext.FRAGMENT_SHADER);

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
            var gl = this.gl;
            this.use();
            return new WGL.VertexAttribute(gl, gl.getAttribLocation(this.program, name));
        };

        Shader.prototype.getUniform = function (name) {
            var gl = this.gl;
            this.use();
            return new WGL.ShaderUniform(gl, gl.getUniformLocation(this.program, name));
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
            this.gl.uniform2fv(this.location, v.xy);
        };

        ShaderUniform.prototype.setVec3 = function (v) {
            this.gl.uniform3fv(this.location, v.xyz);
        };

        ShaderUniform.prototype.setMat4 = function (m) {
            this.gl.uniformMatrix4fv(this.location, false, m.all());
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
        }
        Texture.prototype.bind = function () {
            this.gl.bindTexture(WebGLRenderingContext.TEXTURE_2D, this.texture);
        };

        Texture.prototype.loadData = function (image) {
            var gl = this.gl;
            this.bind();
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
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
        Texture.textureUnitAvailable = [true, true, true, true];
        return Texture;
    })();
    WGL.Texture = Texture;
})(WGL || (WGL = {}));
var WGL;
(function (WGL) {
    var VertexAttributeDescription = (function () {
        function VertexAttributeDescription(name, numComponents, typeOfData, normalize, stride, offset) {
            if (typeof typeOfData === "undefined") { typeOfData = WebGLRenderingContext.FLOAT; }
            if (typeof normalize === "undefined") { normalize = false; }
            if (typeof stride === "undefined") { stride = 0; }
            if (typeof offset === "undefined") { offset = 0; }
            this.Name = name;
            this.NumComponents = numComponents;
            this.TypeOfData = typeOfData;
            this.Normalize = normalize;
            this.Stride = stride;
            this.Offset = offset;
            switch (typeOfData) {
                case WebGLRenderingContext.FLOAT:
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
                vertAttr.enable();
                vertAttr.attribPointer(attrDesc.NumComponents, attrDesc.TypeOfData, attrDesc.Normalize, stride, offset);
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
                vertAttr.disable();
            }
        };
        return VertexDescriptor;
    })();
    WGL.VertexDescriptor = VertexDescriptor;
})(WGL || (WGL = {}));
//# sourceMappingURL=roads.js.map
