/// <reference path="RoadsLib.d.ts" />
window.onload = () => {
    runGame();
};

function runGame() {
    var actx: AudioContext = null;
    try {
        actx = new webkitAudioContext()
    } catch (e) {
    }
    try {
        actx = new AudioContext();
    } catch (e) {
    }
    var manager = new Managers.StreamManager(new Stores.AJAXFileProvider()), shaderManager = new Managers.ShaderManager(manager);
    var managers = new Managers.ManagerSet(manager, shaderManager);
    managers.Sounds = new Managers.SoundManager(managers);
    managers.Keyboard = new Engine.KeyboardManager(document.body);
    managers.Settings = new Managers.SettingsManager(new Stores.LocalStorageStore());
    managers.Graphics = new Shaders.ClassicShaderProvider();
    managers.Textures = new Managers.TextureManager(managers);
    managers.Canvas = new Drawing.HTMLCanvasProvider();
    managers.Audio = new Sounds.WebAPIAudioProvider(actx);
    managers.VR = null;
    //managers.Graphics = new Shaders.VRShaderProvider();

    manager.loadMultiple(["Shaders/basic_2d.fs", "Shaders/basic_2d.vs", 'Shaders/title_2d.fs', 'Shaders/title_2d.vs', 'Shaders/color_3d.vs', 'Shaders/color_3d.fs',
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
    ]).done(() => {
            var exe = new ExeData.ExeDataLoader(managers);
            exe.load();
            document.getElementById('loading').style.display = 'none';
            var cvs = <HTMLCanvasElement>document.getElementById('cvs');
            cvs.style.display = 'block';
            var opl = new Music.OPL(managers);
            var player = new Music.Player(opl, managers);
            opl.setSource(player);
            var w = <any>window;
            w.opl = opl;
            w.settings = managers.Settings;

            managers.Player = player;

            var demoCon = new Game.DemoController(manager.getRawArray('DEMO.REC'));
        var state = new States.Intro(managers);
        //var state = new States.GoMenu(managers);
        //var state = new States.MainMenu(managers);
            managers.Frames = new Engine.FrameManager(new Engine.BrowserDocumentProvider(), cvs, managers, state, new Engine.Clock());
        });
}