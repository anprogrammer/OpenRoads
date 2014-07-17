/**
Module P: Generic Promises for TypeScript

Project, documentation, and license: https://github.com/pragmatrix/Promise
*/
declare module P {
    /**
    Returns a new "Deferred" value that may be resolved or rejected.
    */
    function defer<Value>(): Deferred<Value>;
    /**
    Converts a value to a resolved promise.
    */
    function resolve<Value>(v: Value): Promise<Value>;
    /**
    Returns a rejected promise.
    */
    function reject<Value>(err: Rejection): Promise<Value>;
    /**
    http://en.wikipedia.org/wiki/Anamorphism
    
    Given a seed value, unfold calls the unspool function, waits for the returned promise to be resolved, and then
    calls it again if a next seed value was returned.
    
    All the values of all promise results are collected into the resulting promise which is resolved as soon
    the last generated element value is resolved.
    */
    function unfold<Seed, Element>(unspool: (current: Seed) => {
        promise: Promise<Element>;
        next?: Seed;
    }, seed: Seed): Promise<Element[]>;
    /**
    The status of a Promise. Initially a Promise is Unfulfilled and may
    change to Rejected or Resolved.
    
    Once a promise is either Rejected or Resolved, it can not change its
    status anymore.
    */
    enum Status {
        Unfulfilled = 0,
        Rejected = 1,
        Resolved = 2,
    }
    /**
    If a promise gets rejected, at least a message that indicates the error or
    reason for the rejection must be provided.
    */
    interface Rejection {
        message: string;
    }
    /**
    Both Promise<T> and Deferred<T> share these properties.
    */
    interface PromiseState<Value> {
        status: Status;
        result?: Value;
        error?: Rejection;
    }
    /**
    A Promise<Value> supports basic composition and registration of handlers that are called when the
    promise is fulfilled.
    
    When multiple handlers are registered with done(), fail(), or always(), they are called in the
    same order.
    */
    interface Promise<Value> extends PromiseState<Value> {
        /**
        Returns a promise that represents a promise chain that consists of this
        promise and the promise that is returned by the function provided.
        The function receives the value of this promise as soon it is resolved.
        
        If this promise fails, the function is never called and the returned promise
        will also fail.
        */
        then<T2>(f: (v: Value) => Promise<T2>): Promise<T2>;
        then<T2>(f: (v: Value) => T2): Promise<T2>;
        done(f: (v: Value) => void): Promise<Value>;
        fail(f: (err: Rejection) => void): Promise<Value>;
        always(f: (v?: Value, err?: Rejection) => void): Promise<Value>;
    }
    /**
    Deferred<Value> supports the explicit resolving and rejecting of the
    promise and the registration of fulfillment handlers.
    
    A Deferred<Value> should be only visible to the function that initially sets up
    an asynchronous process. Callers of that function should only see the Promise<Value> that
    is returned by promise().
    */
    interface Deferred<Value> extends PromiseState<Value> {
        promise(): Promise<Value>;
        resolve(result: Value): Deferred<Value>;
        reject(err: Rejection): Deferred<Value>;
        done(f: (v: Value) => void): Deferred<Value>;
        fail(f: (err: Rejection) => void): Deferred<Value>;
        always(f: (v?: Value, err?: Rejection) => void): Deferred<Value>;
    }
    /**
    Creates a promise that gets resolved when all the promises in the argument list get resolved.
    As soon one of the arguments gets rejected, the resulting promise gets rejected.
    If no promises were provided, the resulting promise is immediately resolved.
    */
    function when(...promises: Promise<any>[]): Promise<any[]>;
    /**
    Promise Generators and Iterators.
    */
    interface Generator<E> {
        (): Iterator<E>;
    }
    interface Iterator<E> {
        advance(): Promise<boolean>;
        current: E;
    }
    function generator<E>(g: () => () => Promise<E>): Generator<E>;
    function iterator<E>(f: () => Promise<E>): Iterator<E>;
    /**
    Iterator functions.
    */
    function each<E>(gen: Generator<E>, f: (e: E) => void): Promise<{}>;
    /**
    std
    */
    function isUndefined(v: any): boolean;
}
declare function require(s: string): any;
declare module Configurations {
    function runNode(): void;
}
declare var exports: any;
declare module Data {
    interface BitStream {
        getBit(): number;
        eof(): boolean;
    }
    interface RandomAccessBitStream extends BitStream {
        setPosition(bit: number): void;
        getPosition(): number;
    }
}
declare module Data {
    class ArrayBitStream implements RandomAccessBitStream {
        private data;
        private idx;
        constructor(data: number[]);
        public getBit(): number;
        public setPosition(idx: number): void;
        public getPosition(): number;
        public eof(): boolean;
        public getLength(): number;
    }
}
declare module Data {
    class BinaryReader implements BitStream {
        private stream;
        constructor(stream: BitStream);
        public getBit(): number;
        public getBits(n: number): number;
        public getUint8(): number;
        public getUint16(): number;
        public getUint32(): number;
        public getFixedLengthString(len: number): string;
        public eof(): boolean;
    }
}
declare module Data {
    class Color {
        public R: number;
        public G: number;
        public B: number;
        constructor(r: number, g: number, b: number);
        public negative(): Color;
        public toCss(): string;
        public toVec3(): TSM.vec3;
        public equals(b: Color): boolean;
    }
}
declare module Data {
    class CompressedByteStream implements BitStream {
        private source;
        private len1;
        private len2;
        private len3;
        private len4;
        private buffer;
        private outputStream;
        constructor(stream: BinaryReader);
        private copySet(offset);
        private advanceBuffer();
        public getBit(): number;
        public eof(): boolean;
    }
}
declare module Drawing {
    interface CanvasProvider {
        getCanvas(): HTMLCanvasElement;
    }
}
declare module Drawing {
    class HTMLCanvasProvider implements CanvasProvider {
        public getCanvas(): HTMLCanvasElement;
    }
}
declare module WGL {
    class GLState {
        constructor(gl: WebGLRenderingContext);
        public EnableBlend: boolean;
        public EnableDepthTest: boolean;
        public BlendSrc: number;
        public BlendDst: number;
    }
    class Renderable {
        private gl;
        public State: GLState;
        private vertex;
        private shader;
        private buffer;
        constructor(gl: WebGLRenderingContext, glState: GLState, vertexDescriptor: VertexDescriptor, shader: Shader, buffer: Buffer);
        public configureState(state: GLState): void;
        public preDraw(gl: WebGLRenderingContext, shader: Shader): void;
        public postDraw(gl: WebGLRenderingContext, shader: Shader): void;
        public draw(): void;
    }
}
declare module Drawing {
    class Mesh extends WGL.Renderable {
        public Texture: WGL.Texture;
        public ProjectionMatrix: TSM.mat4;
        public ModelMatrix: TSM.mat4;
        public ViewMatrix: TSM.mat4;
        public Scale: number;
        private uSampler;
        private uProjectionMatrix;
        private uModelMatrix;
        private uViewMatrix;
        private uScale;
        constructor(gl: WebGLRenderingContext, managers: Managers.ManagerSet, vertices: Vertices.Vertex3DC[], shader?: WGL.Shader);
        public preDraw(gl: WebGLRenderingContext, shader: WGL.Shader): void;
        public postDraw(gl: WebGLRenderingContext, shader: WGL.Shader): void;
    }
}
declare module Drawing {
    class NodeCanvasProvider {
        public getCanvas(): HTMLCanvasElement;
    }
}
declare module Drawing {
    class Sprite extends WGL.Renderable {
        public Texture: WGL.Texture;
        public Position: TSM.vec3;
        public Size: TSM.vec2;
        public ULow: TSM.vec2;
        public UHigh: TSM.vec2;
        public VLow: TSM.vec2;
        public VHigh: TSM.vec2;
        public Alpha: number;
        public Brightness: number;
        public ProjectionMatrix: TSM.mat4;
        public ModelMatrix: TSM.mat4;
        public ViewMatrix: TSM.mat4;
        private uSampler;
        private uPos;
        private uSize;
        private uAlpha;
        private uBrightness;
        private uULow;
        private uVLow;
        private uUHigh;
        private uVHigh;
        private uProjectionMatrix;
        private uModelMatrix;
        private uViewMatrix;
        constructor(gl: WebGLRenderingContext, managers: Managers.ManagerSet, texture: TextureFragment, shader?: WGL.Shader);
        public preDraw(gl: WebGLRenderingContext, shader: WGL.Shader): void;
        public postDraw(gl: WebGLRenderingContext, shader: WGL.Shader): void;
    }
}
declare module Drawing {
    class TextHelper {
        private managers;
        constructor(managers: Managers.ManagerSet);
        public getSpriteFromText(gl: WebGLRenderingContext, managers: Managers.ManagerSet, text: string, font: string, height: number): Sprite;
    }
}
declare module Drawing {
    class TextureFragment {
        public Texture: WGL.Texture;
        public XOffset: number;
        public YOffset: number;
        public Width: number;
        public Height: number;
        constructor(tex: WGL.Texture, x: number, y: number, w: number, h: number);
    }
}
declare module Engine {
    class BrowserDocumentProvider implements DocumentProvider {
        public getSize(): TSM.vec2;
        public setResizeCb(cb: (size: TSM.vec2) => void): void;
        public requestAnimationFrame(cb: () => void): void;
    }
}
declare module Engine {
    class CameraState {
        constructor(headPosition: TSM.vec3, headOrientation: TSM.quat, eyeOffset: TSM.vec3, projectionMatrix: TSM.mat4);
        public HeadPosition: TSM.vec3;
        public HeadOrientation: TSM.quat;
        public EyeOffset: TSM.vec3;
        public ProjectionMatrix: TSM.mat4;
    }
}
declare module Engine {
    class ClassicState2DDrawer implements State2DDrawer {
        public draw(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState, state: State2D): void;
    }
}
declare module Engine {
    class ClassicState3DDrawer implements State3DDrawer {
        public draw(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState, state: State3D): void;
    }
}
declare module Engine {
    class FrameTimeInfo {
        private frameTime;
        constructor(frameTime: number);
        public getPhysicsStep(): number;
        public getFPS(): number;
        public getFrameTime(): number;
    }
    class Clock {
        private lastTime;
        constructor();
        public nextFrame(): FrameTimeInfo;
    }
}
declare module Engine {
    interface DocumentProvider {
        getSize(): TSM.vec2;
        setResizeCb(cb: (size: TSM.vec2) => void): void;
        requestAnimationFrame(cb: () => void): void;
    }
}
declare module Engine {
    interface GameState {
        load(gl: WebGLRenderingContext): void;
        unload(): void;
        updatePhysics(frameManager: FrameManager, frameTimeInfo: FrameTimeInfo): void;
        drawFrame(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState): void;
    }
    class FrameManager {
        private clock;
        private physicsTime;
        private canvas;
        private ctx;
        private states;
        private fps;
        private timeLast;
        private lastWidth;
        private lastHeight;
        private document;
        private managers;
        constructor(document: DocumentProvider, canvas: HTMLCanvasElement, managers: Managers.ManagerSet, gs: GameState, clock: Clock);
        public getCanvas(): HTMLCanvasElement;
        public addState(gs: GameState): void;
        private maintainCanvasSize(sz);
        private onFrame();
        public popState(): void;
    }
}
declare module Engine {
    class KeyWatcher {
        private enabled;
        private repeating;
        private heldTime;
        private repeatRate;
        private repeatWait;
        private keyCode;
        private cb;
        private kbd;
        constructor(kbd: KeyboardManager, keyCode: number, cb: Function);
        public update(time: FrameTimeInfo): void;
    }
    class KeyboardManager {
        private keys;
        constructor(element: HTMLElement);
        public isDown(n: number): boolean;
        private onDown(evt);
        private onUp(evt);
    }
}
declare module Engine {
    class NodeDocumentProvider implements DocumentProvider {
        private doc;
        private cvs;
        constructor(doc: any, cvs: HTMLCanvasElement);
        public getSize(): TSM.vec2;
        public setResizeCb(cb: (size: TSM.vec2) => void): void;
        public requestAnimationFrame(cb: () => void): void;
    }
}
declare module Engine {
    interface State2DDrawer {
        draw(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState, state: State2D): void;
    }
    class State2D implements GameState {
        private drawer;
        private managers;
        constructor(managers: Managers.ManagerSet);
        public load(gl: WebGLRenderingContext): void;
        public unload(): void;
        public updatePhysics(frameManager: FrameManager, frameTimeInfo: FrameTimeInfo): void;
        public drawFrame(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState): void;
        public drawFrame2D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState): void;
    }
}
declare module Engine {
    interface State3DDrawer {
        draw(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState, state: State3D): void;
    }
    class State3D implements GameState {
        private drawer;
        private managers;
        constructor(managers: Managers.ManagerSet);
        public load(gl: WebGLRenderingContext): void;
        public unload(): void;
        public updatePhysics(frameManager: FrameManager, frameTimeInfo: FrameTimeInfo): void;
        public drawFrame(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState): void;
        public drawFrame3D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState): void;
    }
}
declare module Engine {
    class VRState2DDrawer implements State2DDrawer {
        private managers;
        constructor(managers: Managers.ManagerSet);
        private static initialized;
        private static target;
        private static screenMesh;
        private ensureObjects(gl);
        public draw(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState, state: State2D): void;
    }
}
declare module Engine {
    class VRState3DDrawer implements State3DDrawer {
        private managers;
        constructor(managers: Managers.ManagerSet);
        private static initialized;
        public draw(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: FrameManager, frameTimeInfo: FrameTimeInfo, cam: CameraState, state: State3D): void;
    }
}
declare module ExeData {
    class ExeDataLoader {
        private managers;
        constructor(managers: Managers.ManagerSet);
        public load(): void;
        private imageByChangingColor(src, xPos, yPos, w, h, colorA, colorB);
    }
}
declare module ExeData {
    class ExeReader implements Data.RandomAccessBitStream {
        private stream;
        private offset;
        constructor(stream: Data.RandomAccessBitStream);
        public getBit(): number;
        public eof(): boolean;
        public setPosition(bit: number): void;
        public getPosition(): number;
    }
}
declare module Game {
    class CarSprite {
        private sprite;
        private frame;
        private playedDeath;
        private finishedDeath;
        constructor(gl: WebGLRenderingContext, managers: Managers.ManagerSet);
        public update(state: StateManager): void;
        public draw(view: TSM.mat4, cam: Engine.CameraState): void;
        public hasAnimationFinished(): boolean;
    }
}
declare module Game {
    class ControllerState {
        constructor(turn: number, accel: number, jump: boolean);
        public TurnInput: number;
        public AccelInput: number;
        public JumpInput: boolean;
    }
    interface Controller {
        update(ship: Position): ControllerState;
    }
}
declare module Game {
    class Dashboard {
        private dash;
        private oxyGauge;
        private fuelGauge;
        private speedGauge;
        private progressGauge;
        private fuelEmpty;
        private oxyEmpty;
        private numberSet;
        private jumpMasterOn;
        private oxyAmt;
        private fuelAmt;
        private speedAmt;
        private gravity;
        private jumpMasterInUse;
        private craftState;
        private frame;
        private zPosition;
        private zLevelLength;
        private back;
        constructor(gl: WebGLRenderingContext, managers: Managers.ManagerSet);
        public update(state: StateManager): void;
        public draw(gl: WebGLRenderingContext, cam: Engine.CameraState, scaleVec: TSM.vec3): void;
    }
}
declare module Game {
    class DemoController implements Controller {
        private static TilePositionToDemoPosition;
        private demo;
        constructor(demo: Uint8Array);
        public update(ship: Position): ControllerState;
    }
}
declare module Game {
    class KeyboardController implements Controller {
        private static TilePositionToDemoPosition;
        private kbd;
        constructor(kbd: Engine.KeyboardManager);
        public update(ship: Position): ControllerState;
    }
}
declare module Game {
    interface Position {
        getXPosition(): number;
        getYPosition(): number;
        getZPosition(): number;
    }
    class Ship implements Position {
        private xPosition;
        private yPosition;
        private zPosition;
        constructor(xPosition: number, yPosition: number, zPosition: number);
        public getXPosition(): number;
        public getYPosition(): number;
        public getZPosition(): number;
    }
}
declare module Game {
    class StateManager {
        private sounds;
        public level: Levels.Level;
        private controller;
        public currentXPosition: number;
        public currentYPosition: number;
        public currentZPosition: number;
        public gravityAcceleration: number;
        private slideAmount;
        private slidingAccel;
        private xMovementBase;
        public yVelocity: number;
        public zVelocity: number;
        public fuelRemaining: number;
        public oxygenRemaining: number;
        private expectedXPosition;
        private expectedYPosition;
        private expectedZPosition;
        public craftState: number;
        public isDead: boolean;
        private isOnGround;
        private isOnDecelPad;
        private isOnSlidingTile;
        private isGoingUp;
        private hasRunJumpOMaster;
        public jumpOMasterInUse: boolean;
        public jumpOMasterVelocityDelta: number;
        private offsetAtWhichNotInsideTile;
        private jumpedFromYPosition;
        public didWin: boolean;
        public Log: string;
        public lastJumpZ: number;
        constructor(managers: Managers.ManagerSet, level: Levels.Level, controller: Controller);
        private resetStateVars();
        private currentPosToPosition();
        private getPos(x, y, z);
        private sanitizeFP32(n);
        private sanitizeFP16(n);
        private sanitizeVars();
        public runFrame(): void;
        private applyTouchEffect(effect);
        private clampGlobalZVelocity();
        private clampZVelocity(z);
        private isInsideTileY(yPos, distFromCenter, cell);
        private isInsideTile(xPos, yPos, zPos);
        private isInsideTunnelY(yPos, distFromCenter, cell);
        private isInsideTunnel(xPos, yPos, zPos);
        private moveShipAndConstraint();
        private runJumpOMaster(controls);
        private isOnNothing(xPosition, zPosition);
        private willLandOnTile(controls, xPos, yPos, zPos, xVelocity, yVelocity, zVelocity);
        private logBP2308(controls);
        private logBP2369(controls, te);
        private logBP26C7(controls);
        private logBP26CD(controls);
        private logLongList(controls);
        private toHexBytes(n);
        private logFP16(name, n);
        private logFP32(nameHigh, nameLow, n);
        private logFP32LH(name, n);
        private logInt(name, n);
        private logString(s);
    }
}
declare module Images {
    class ImageFragment {
        public Canvas: HTMLCanvasElement;
        public Palette: Data.Color[];
        public XOffset: number;
        public YOffset: number;
        constructor(c: HTMLCanvasElement, palette: Data.Color[], x: number, y: number);
    }
    class AnimLoader {
        private managers;
        constructor(managers: Managers.ManagerSet);
        public load(stream: Data.RandomAccessBitStream): ImageFragment[][];
    }
    class DirectImageLoader {
        private managers;
        constructor(managers: Managers.ManagerSet);
        public loadFromStream(stream: Data.RandomAccessBitStream, streamPos: number, palette: Data.Color[], count: number, xOff: number, yOff: number, width: number, height: number): ImageFragment[];
    }
    class ImageSetLoader {
        private managers;
        constructor(managers: Managers.ManagerSet);
        public load(stream: Data.RandomAccessBitStream): ImageFragment[];
    }
    class DatLoader {
        private managers;
        constructor(managers: Managers.ManagerSet);
        public load(stream: Data.RandomAccessBitStream): ImageFragment[];
    }
}
declare module Levels {
    enum TouchEffect {
        None = 0,
        Accelerate = 1,
        Decelerate = 2,
        Kill = 3,
        Slide = 4,
        RefillOxygen = 5,
    }
    class CubeColors {
        public Left: Data.Color;
        public Right: Data.Color;
        public Top: Data.Color;
        public Front: Data.Color;
        constructor(left: Data.Color, right: Data.Color, top: Data.Color, front: Data.Color);
    }
    class CubeProperties {
        public Height: number;
        public Colors: CubeColors;
        public Effect: TouchEffect;
        constructor(height: number, colors: CubeColors, effect: TouchEffect);
    }
    class TileProperties {
        public Colors: CubeColors;
        public Effect: TouchEffect;
        constructor(colors: CubeColors, effect: TouchEffect);
    }
    class TunnelProperties {
        public TunnelColors: Data.Color[];
        constructor(colors: Data.Color[]);
    }
    class Cell {
        public Tunnel: TunnelProperties;
        public Cube: CubeProperties;
        public Tile: TileProperties;
        public CI: number;
        constructor(level: Level, colorIndexLow: number, colorIndexHigh: number, colorRaw: number, flags: number);
        public isEmpty(): boolean;
        static getEmpty(): Cell;
    }
    class Level {
        public Name: string;
        public Gravity: number;
        public Fuel: number;
        public Oxygen: number;
        public Cells: Cell[][];
        public Colors: Data.Color[];
        constructor(name: string, gravity: number, fuel: number, oxygen: number, colors: Data.Color[]);
        public getCell(pos: Game.Position): Cell;
        public width(): number;
        public length(): number;
        public getTunnelColors(): Data.Color[];
        public getTileColors(startIndex: number): CubeColors;
        public getCubeColors(): CubeColors;
        public getCubeColorsWithTop(cTop: number): CubeColors;
        public getLength(): number;
    }
}
declare module Levels {
    class LevelToTableRenderer {
        public convertColors(l: Level): HTMLTableElement;
        public convert(l: Level): HTMLTableElement;
    }
}
declare module Levels {
    class LevelLoader {
        private levelNumber;
        private levelStartByte;
        private levelSize;
        constructor(levelNumber: number, levelStartByte: number, levelSize: number);
        public load(stream: Data.RandomAccessBitStream): Level;
    }
    class MultiLevelLoader {
        public Levels: Level[];
        constructor(stream: Data.RandomAccessBitStream);
    }
}
declare module Levels {
    class MeshBuilder {
        public CellLength: number;
        public CellWidth: number;
        public buildMesh(level: Level): Vertices.Vertex3DC[];
    }
}
declare module Managers {
    class ManagerSet {
        public Streams: StreamManager;
        public Shaders: ShaderManager;
        public Textures: TextureManager;
        public Sounds: SoundManager;
        public Player: Music.Player;
        public Frames: Engine.FrameManager;
        public Keyboard: Engine.KeyboardManager;
        public Settings: SettingsManager;
        public Graphics: Shaders.ShaderProvider;
        public Canvas: Drawing.CanvasProvider;
        public Audio: Sounds.AudioProvider;
        public VR: VR.VRProvider;
        constructor(streams: StreamManager, shaders: ShaderManager);
    }
}
declare module Managers {
    class SettingsManager {
        public PlayMusic: boolean;
        private Muted;
        private volume;
        private store;
        constructor(store: Stores.KVStore);
        public getMuted(): boolean;
        public setMuted(m: boolean): void;
        public getVolume(): number;
        public wonLevelCount(levelNum: number): number;
        public incrementWonLevelCount(levelNum: number): void;
    }
}
declare module Managers {
    class ShaderManager {
        private shaders;
        public Shaders: {
            Basic2D: string;
            TitleEffect2D: string;
            Color3D: string;
            TexturedPerspective: string;
            Sprite3D: string;
        };
        private streamManager;
        constructor(streamManager: StreamManager);
        public getShader(gl: WebGLRenderingContext, shaderName: string): WGL.Shader;
    }
}
declare module Managers {
    class SoundManager {
        private sounds;
        private multiSounds;
        public Sounds: {
            Intro: string;
        };
        private streamManager;
        private managers;
        constructor(managers: ManagerSet);
        public getSound(soundName: string): Sounds.SoundEffect;
        public getMultiEffect(soundName: string): Sounds.SoundEffect[];
    }
}
declare module Managers {
    class StreamManager {
        private streams;
        private filterBasePath;
        private basePath;
        private provider;
        constructor(provider: Stores.FileProvider);
        public load(filename: string): P.Promise<Uint8Array>;
        public loadMultiple(filenames: string[]): P.Promise<any[]>;
        public getStream(filename: string): Data.ArrayBitStream;
        public getRawArray(filename: string): Uint8Array;
        public getText(filename: string): any;
    }
}
declare module Managers {
    class TextureManager {
        private managers;
        private streamManager;
        private textures;
        private images;
        constructor(managers: ManagerSet);
        public getImage(filename: string): Images.ImageFragment;
        public getImages(filename: string): Images.ImageFragment[];
        public getTexture(gl: WebGLRenderingContext, filename: string): Drawing.TextureFragment;
        public getTextures(gl: WebGLRenderingContext, filename: string): Drawing.TextureFragment[];
        public getAnim(gl: WebGLRenderingContext, filename: string): Drawing.TextureFragment[][];
        public setImages(filename: string, imgs: Images.ImageFragment[]): void;
        private imageFragmentsToTextureFragments(gl, imgs);
    }
}
declare module Music {
    class Player {
        private opl;
        private fullData;
        private data;
        private stream;
        private reader;
        private paused;
        private jumpPos;
        private currentSong;
        constructor(opl: OPL, managers: Managers.ManagerSet);
        public loadSong(n: number): void;
        public readNote(): void;
        private playInstrumentEffect(cmdLow, cmdHigh);
        private configureInstrument(cmdLow, cmdHigh);
        private pause(cmdHigh);
        private turnOffNoteOrPlayBase(cmdLow, cmdHigh);
        private playNote(low, high);
    }
}
declare module Music {
    enum WaveType {
        Sine = 0,
        HalfSine = 1,
        AbsSign = 2,
        PulseSign = 3,
        SineEven = 4,
        AbsSineEven = 5,
        Square = 6,
        DerivedSquare = 7,
    }
    enum KeyState {
        Off = 0,
        Attack = 1,
        Sustain = 2,
        Decay = 3,
        Release = 4,
    }
    class OscDesc {
        public Tremolo: boolean;
        public Vibrato: boolean;
        public SoundSustaining: boolean;
        public KeyScaling: boolean;
        public Multiplication: number;
        public KeyScaleLevel: number;
        public OutputLevel: number;
        public AttackRate: number;
        public DecayRate: number;
        public SustainLevel: number;
        public ReleaseRate: number;
        public WaveForm: WaveType;
        public Wave: number[];
    }
    class OscState {
        public Config: OscDesc;
        public State: KeyState;
        public Volume: number;
        public EnvelopeStep: number;
        public Angle: number;
    }
    class OPL implements Sounds.PlayerAudioSource {
        private channels;
        private sampleRate;
        private src;
        private timeSinceNote;
        private noteTickRate;
        private time;
        private synthTime;
        private timePassed;
        private VMin;
        private VMax;
        private node;
        private managers;
        private waves;
        private sampleCount;
        constructor(managers: Managers.ManagerSet);
        public setSource(mp: Player): void;
        public setChannelConfig(n: number, a: OscDesc, b: OscDesc, isAdditive: boolean, feedbackAmt: number): void;
        public setChannelVolume(n: number, v: number): void;
        public startNote(channel: number, freqNum: number, blockNum: number): void;
        public stopNote(channel: number): void;
        public fillAudioBuffer(buffer: Float32Array): boolean;
        private processChannelOutputAdditive(c);
        private processChannelOutputFM(c);
        private processOsc(osc, freqNum, blockNum, modulator);
    }
}
declare module Music {
    class OPLConstants {
        static SampleRate: number;
        static SampleTime: number;
        static AttackRates: number[];
        static DecayRates: number[];
        static KeyScaleLevels: number[][];
        static FreqStarts: number[];
        static FreqSteps: number[];
        static KeyScaleMultipliers: number[];
    }
}
declare module Shaders {
    class ClassicShaderProvider implements ShaderProvider {
        public get2DSprite(gl: WebGLRenderingContext, managers: Managers.ManagerSet, texture: Drawing.TextureFragment): Drawing.Sprite;
        public get3DSprite(gl: WebGLRenderingContext, managers: Managers.ManagerSet, texture: Drawing.TextureFragment): Drawing.Sprite;
        public getMesh(gl: WebGLRenderingContext, managers: Managers.ManagerSet, vertices: Vertices.Vertex3DC[]): Drawing.Mesh;
        public getState2DDrawer(gl: WebGLRenderingContext): Engine.ClassicState2DDrawer;
        public getState3DDrawer(gl: WebGLRenderingContext): Engine.ClassicState3DDrawer;
    }
}
declare module Shaders {
    interface ShaderProvider {
        get2DSprite(gl: WebGLRenderingContext, managers: Managers.ManagerSet, texture: Drawing.TextureFragment): Drawing.Sprite;
        get3DSprite(gl: WebGLRenderingContext, managers: Managers.ManagerSet, texture: Drawing.TextureFragment): Drawing.Sprite;
        getMesh(gl: WebGLRenderingContext, managers: Managers.ManagerSet, vertices: Vertices.Vertex3DC[]): Drawing.Mesh;
        getState2DDrawer(gl: WebGLRenderingContext, managers: Managers.ManagerSet): Engine.State2DDrawer;
        getState3DDrawer(gl: WebGLRenderingContext, managers: Managers.ManagerSet): Engine.State3DDrawer;
    }
}
declare module Shaders {
    class VRShaderProvider implements ShaderProvider {
        public get2DSprite(gl: WebGLRenderingContext, managers: Managers.ManagerSet, texture: Drawing.TextureFragment): Drawing.Sprite;
        public get3DSprite(gl: WebGLRenderingContext, managers: Managers.ManagerSet, texture: Drawing.TextureFragment): Drawing.Sprite;
        public getMesh(gl: WebGLRenderingContext, managers: Managers.ManagerSet, vertices: Vertices.Vertex3DC[]): Drawing.Mesh;
        public getState2DDrawer(gl: WebGLRenderingContext, managers: Managers.ManagerSet): Engine.ClassicState2DDrawer;
        public getState3DDrawer(gl: WebGLRenderingContext, managers: Managers.ManagerSet): Engine.ClassicState3DDrawer;
    }
}
declare module Sounds {
    interface Playable {
        play(): void;
    }
    interface PlayerAudioSource {
        fillAudioBuffer(buffer: Float32Array): boolean;
    }
    interface AudioProvider {
        createPlayable(buffer: Float32Array): Playable;
        runPlayer(player: PlayerAudioSource): void;
        setGain(gain: number): void;
    }
}
declare module Sounds {
    class PortAudioAudioProvider implements AudioProvider {
        private players;
        private gain;
        private engine;
        private buffer;
        constructor();
        public createPlayable(buffer: Float32Array): Playable;
        public runPlayer(player: PlayerAudioSource): void;
        public setGain(gain: number): void;
        public fillBuffer(inBuf: Float32Array): Float32Array;
    }
}
declare module Sounds {
    class SoundEffect {
        private playable;
        private managers;
        constructor(managers: Managers.ManagerSet, stream: Data.ArrayBitStream, start?: number, end?: number);
        public play(): void;
    }
}
declare module Sounds {
    class WebAPIAudioProvider implements AudioProvider {
        private ctx;
        private dest;
        private players;
        private playerNodes;
        constructor(ctx: AudioContext);
        public createPlayable(buffer: Float32Array): Playable;
        public runPlayer(player: PlayerAudioSource): void;
        public setGain(gain: number): void;
    }
}
declare module States {
    class ControlsMenu extends Engine.State2D implements Engine.GameState {
        private myManagers;
        private menu;
        private watchers;
        constructor(managers: Managers.ManagerSet);
        public load(gl: WebGLRenderingContext): void;
        public unload(): void;
        private updateMenu(mute);
        private exitMenu();
        public updatePhysics(frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void;
        public drawFrame2D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void;
    }
}
declare module States {
    class EmptyState implements Engine.GameState {
        private managers;
        private watchers;
        constructor(managers: Managers.ManagerSet);
        public load(gl: WebGLRenderingContext): void;
        public unload(): void;
        public updatePhysics(frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void;
        public drawFrame(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void;
    }
}
declare module States {
    class Fade extends Engine.State2D implements Engine.GameState {
        private myManagers;
        private position;
        private direction;
        private drawState;
        private back;
        private firstFrame;
        constructor(managers: Managers.ManagerSet, start: number, drawState: any, runPhysicsFirst: boolean);
        public load(gl: WebGLRenderingContext): void;
        public unload(): void;
        public updatePhysics(frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void;
        public drawFrame2D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo, cam: Engine.CameraState): void;
    }
}
declare module States {
    class GameState extends Engine.State3D implements Engine.GameState {
        private myManagers;
        private background;
        private frame;
        private levelNum;
        private controller;
        private game;
        private mesh;
        private dash;
        private carSprite;
        private timeBeforeFade;
        private roadCompleted;
        constructor(managers: Managers.ManagerSet, levelNum: number, controller: Game.Controller);
        public load(gl: WebGLRenderingContext): void;
        public unload(): void;
        public updatePhysics(frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void;
        public drawFrame3D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo, cam: Engine.CameraState): void;
    }
}
declare module States {
    class ClassicGLStateHelper {
        constructor();
        public startFrame(gl: WebGLRenderingContext, canvas: HTMLCanvasElement): void;
    }
    class VRGLStateHelper {
        private vr;
        constructor(vrProvider: VR.VRProvider);
        public startFrame(gl: WebGLRenderingContext): void;
        public startEye(gl: WebGLRenderingContext, eyeNum: number): void;
        public endEye(gl: WebGLRenderingContext, eyeNum: number): void;
    }
}
declare module States {
    class GoMenu extends Engine.State2D implements Engine.GameState {
        private myManagers;
        private background;
        private dot;
        private selRect;
        private selLevel;
        private watchers;
        constructor(managers: Managers.ManagerSet);
        public load(gl: WebGLRenderingContext): void;
        public unload(): void;
        private updateLevel(dir);
        private enterLevel();
        public updatePhysics(frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void;
        public drawFrame2D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void;
    }
}
declare module States {
    class Help extends Engine.State2D implements Engine.GameState {
        private myManagers;
        private frames;
        private watchers;
        private frameNum;
        private fadeDir;
        constructor(managers: Managers.ManagerSet);
        public load(gl: WebGLRenderingContext): void;
        public unload(): void;
        private exit();
        private next();
        public updatePhysics(frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void;
        public drawFrame2D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void;
    }
}
declare module States {
    class Intro extends Engine.State2D implements Engine.GameState {
        private myManagers;
        private background;
        private titleLeft;
        private titleRight;
        private frames;
        private anim;
        private animFrame;
        private creditFrame;
        private totalTime;
        private introSound;
        private frame;
        private titleProgress;
        constructor(managers: Managers.ManagerSet);
        public load(gl: WebGLRenderingContext): void;
        public unload(): void;
        public updatePhysics(frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void;
        public drawFrame2D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void;
    }
}
declare module States {
    class MainMenu extends Engine.State2D implements Engine.GameState {
        private myManagers;
        private background;
        private title;
        private titleRight;
        private menu;
        private menuPos;
        private menuAlpha;
        private watchers;
        constructor(managers: Managers.ManagerSet);
        public load(gl: WebGLRenderingContext): void;
        public unload(): void;
        private updateMenu(dir);
        private enterMenu();
        public updatePhysics(frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void;
        public drawFrame2D(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, frameManager: Engine.FrameManager, frameTimeInfo: Engine.FrameTimeInfo): void;
    }
}
declare module Stores {
    class AJAXFileProvider implements FileProvider {
        public load(filename: string, cb: (data: Uint8Array) => void): void;
    }
}
declare module Stores {
    interface FileProvider {
        load(filename: string, cb: (data: Uint8Array) => void): void;
    }
}
declare module Stores {
    class FSStore implements KVStore {
        private filename;
        private fs;
        private opts;
        constructor();
        public getValue(k: string): string;
        public setValue(k: string, v: string): void;
    }
}
declare module Stores {
    interface KVStore {
        setValue(k: string, v: string): void;
        getValue(k: string): string;
    }
}
declare module Stores {
    class LocalFileProvider implements FileProvider {
        private fs;
        constructor();
        public load(filename: string, cb: (data: Uint8Array) => void): void;
    }
}
declare module Stores {
    class LocalStorageStore implements KVStore {
        public setValue(k: string, v: string): void;
        public getValue(k: string): string;
    }
}
declare module TestRuns {
    function TestCar(): void;
}
declare module TestRuns {
    function TestDats(): void;
}
declare module TestRuns {
    function TestAnims(): void;
}
declare module TestRuns {
    function TestLevel(): void;
}
declare module TestRuns {
    function TestMusic(): void;
}
declare module TestRuns {
    class TestPhysics {
        private cvs;
        private ctx;
        private manager;
        private level;
        private game;
        private frame;
        constructor();
        private start();
        private onFrame();
    }
}
declare module TestRuns {
    function TestSounds(): void;
}
declare module TestRuns {
    function TestTrekDat(): void;
}
declare module Vertices {
    class Vertex2D implements WGL.VertexObject {
        static getDescriptor(gl: WebGLRenderingContext): WGL.VertexDescriptor;
        public X: number;
        public Y: number;
        constructor(x: number, y: number);
        public getComponent(name: String): number[];
    }
}
declare module Vertices {
    class Vertex3DC implements WGL.VertexObject {
        static getDescriptor(gl: WebGLRenderingContext): WGL.VertexDescriptor;
        public Position: TSM.vec3;
        public Color: TSM.vec3;
        public UV: TSM.vec3;
        constructor(pos: TSM.vec3, color: TSM.vec3, uv?: TSM.vec2);
        public getComponent(name: String): number[];
    }
}
declare module VR {
    class GLFW {
        public enableHMD(): boolean;
        public getHMDTargetSize(): TSM.vec2;
        public getHMDFboId(gl: WebGLRenderingContext): number;
        public getEyeViewAdjust(n: number): number[];
        public getEyeViewport(n: number): number[];
        public getHeadPosition(n: number): number[];
        public getHeadOrientation(n: number): number[];
        public getProjectionMatrix(n: number): number[];
        public getJoystickAxes(): string;
        public getJoystickButtons(): string;
        public startVREye(n: number): void;
        public endVREye(n: number): void;
    }
    class NodeVRProvider implements VRProvider {
        private glfw;
        constructor(glfw: GLFW);
        public enable(): boolean;
        public getTargetResolution(): TSM.vec2;
        public getTargetFboId(gl: WebGLRenderingContext): number;
        public getHeadCameraState(eyeNum: number): Engine.CameraState;
        public getEyeViewport(eyeNum: number): TSM.vec4;
        public startEye(eyeNum: number): void;
        public endEye(eyeNum: number): void;
        private getEyeViewAdjust(n);
        private getEyeProjectionMatrix(n);
        private getHeadPosition(n);
        private getHeadOrientation(n);
        private getJoystickValues();
        private getJoystickButtons();
    }
}
declare module VR {
    interface VRProvider {
        enable(): boolean;
        getTargetResolution(): TSM.vec2;
        getTargetFboId(gl: WebGLRenderingContext): number;
        getHeadCameraState(eyeNum: number): Engine.CameraState;
        getEyeViewport(eyeNum: number): TSM.vec4;
        startEye(eyeNum: number): void;
        endEye(eyeNum: number): void;
    }
}
declare module WGL {
    class VertexAttribute {
        public gl: WebGLRenderingContext;
        public location: number;
        constructor(gl: WebGLRenderingContext, location: number);
        public enable(): void;
        public disable(): void;
        public attribPointer(size: number, type: number, normalized: boolean, stride: number, offset: number): void;
    }
}
declare module WGL {
    class Buffer {
        private gl;
        private buffer;
        private bufferType;
        private size;
        constructor(gl: WebGLRenderingContext, bufferType?: number);
        public bind(): void;
        public loadData(data: Float32Array, usage?: number): void;
        public getNumElements(): number;
    }
}
declare module WGL {
    class Framebuffer {
        private gl;
        private buffer;
        constructor(gl: WebGLRenderingContext);
        public bind(): void;
        public unbind(): void;
        public setTexture(tex: Texture): void;
        public setRenderbuffer(rb: Renderbuffer): void;
    }
}
declare module WGL {
    class RenderableTexture {
        public Framebuffer: Framebuffer;
        public Texture: Texture;
        constructor(fb: Framebuffer, tex: Texture);
        static Create(gl: WebGLRenderingContext, width: number, height: number): RenderableTexture;
        public bindForDrawing(): void;
        public unbindForDrawing(): void;
    }
}
declare module WGL {
    class Renderbuffer {
        private gl;
        private buffer;
        constructor(gl: WebGLRenderingContext);
        public bind(): void;
        public unbind(): void;
        public setSize(width: number, height: number): void;
        public getGLRenderbuffer(): WebGLRenderbuffer;
    }
}
declare module WGL {
    class Shader {
        private gl;
        private program;
        constructor(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string);
        public use(): void;
        public getVertexAttribute(name: string): VertexAttribute;
        public getUniform(name: string): ShaderUniform;
    }
}
declare module WGL {
    class ShaderUniform {
        private gl;
        private location;
        constructor(gl: WebGLRenderingContext, location: WebGLUniformLocation);
        public set1i(i: number): void;
        public set1f(f: number): void;
        public setVec2(v: TSM.vec2): void;
        public setVec3(v: TSM.vec3): void;
        public setMat4(m: TSM.mat4): void;
    }
}
declare module WGL {
    class Texture {
        private static textureUnitAvailable;
        private texture;
        private gl;
        private boundTo;
        public Width: number;
        public Height: number;
        constructor(gl: WebGLRenderingContext);
        public bind(): void;
        public unbind(): void;
        public loadData(image: HTMLCanvasElement): void;
        public createEmpty(width: number, height: number): void;
        public setFilters(minFilter: number, magFilter: number): void;
        public generateMipmap(): void;
        public attachToUniform(uniform: ShaderUniform): void;
        private attachToUniformExplicit(uniform, activeTextureNum);
        public detachFromUniform(): void;
        public getGLTexture(): WebGLTexture;
    }
}
declare module WGL {
    interface VertexObject {
        getComponent(name: String): number[];
    }
    class VertexAttributeDescription {
        public Name: string;
        public NumComponents: number;
        public TypeOfData: number;
        public Normalize: boolean;
        public Stride: number;
        public Offset: number;
        public Size: number;
        constructor(gl: WebGLRenderingContext, name: string, numComponents: number, typeOfData?: number, normalize?: boolean, stride?: number, offset?: number);
    }
    class VertexDescriptor {
        private attributes;
        private vertexSize;
        constructor(attributes: VertexAttributeDescription[]);
        public buildArray(verts: VertexObject[], array?: Float32Array): Float32Array;
        public enableAndConfigureVertexAttributes(shader: Shader): void;
        public drawContiguous(gl: WebGLRenderingContext, buffer: Buffer): void;
        public disableVertexAttributes(shader: Shader): void;
    }
}
