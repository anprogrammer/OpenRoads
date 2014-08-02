/// <reference path="RoadsLib.d.ts" />
window.onload = function () {
    runGame();
};

function runGame() {
    var cvs = document.getElementById('cvs');
    var gl = cvs.getContext('webgl') || cvs.getContext('experimental-webgl');
    if (!gl) {
        document.getElementById('error_webgl').style.display = '';
        return;
    }

    var actx = null;
    try  {
        actx = new webkitAudioContext();
    } catch (e) {
    }
    try  {
        actx = new AudioContext();
    } catch (e) {
    }

    if (!actx) {
        document.getElementById('error_webaudio').style.display = '';
    }

    var isXMas = window.location.search.indexOf('xmas=1') >= 0;

    var manager = new Managers.StreamManager(new Stores.AJAXFileProvider(), isXMas ? 'Data.XMas/' : 'Data/'), shaderManager = new Managers.ShaderManager(manager);
    var managers = new Managers.ManagerSet(manager, shaderManager);
    managers.Sounds = new Managers.SoundManager(managers);

    var src = new Controls.CombinedControlSource();
    src.addSource(new Controls.KeyboardControlSource(new Engine.KeyboardManager(document.body)));
    src.addSource(new Controls.JoystickControlSource(new Controls.NavigatorJoystick(navigator)));
    managers.Controls = src;
    managers.Settings = new Managers.SettingsManager(new Stores.LocalStorageStore(isXMas ? 'xmas' : 'classic'));
    managers.Graphics = new Shaders.ClassicShaderProvider();
    managers.Textures = new Managers.TextureManager(managers);
    managers.Canvas = new Drawing.HTMLCanvasProvider();
    managers.VR = null;
    managers.SnapshotProvider = managers.Settings.UseInterpolation ? new Game.InterpolatingSnapshoptProvider() : new Game.FixedRateSnapshotProvider();

    //managers.Graphics = new Shaders.VRShaderProvider();
    manager.loadMultiple([
        "Shaders/basic_2d.fs", "Shaders/basic_2d.vs", 'Shaders/title_2d.fs', 'Shaders/title_2d.vs', 'Shaders/color_3d.vs', 'Shaders/color_3d.fs',
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

        var audioProvider = new Sounds.WebAPIAudioProvider(actx);
        var opl = new Music.OPL(audioProvider);
        var player = new Music.Player(opl, managers);
        opl.setSource(player);

        managers.Audio = new Sounds.InThreadAudioProvider(audioProvider, player);

        document.getElementById('loading').style.display = 'none';
        cvs.style.display = 'block';

        var demoCon = new Game.DemoController(manager.getRawArray('DEMO.REC'));
        var state = new States.Intro(managers);

        //var state = new States.GoMenu(managers);
        //var state = new States.MainMenu(managers);
        managers.Frames = new Engine.FrameManager(new Engine.BrowserDocumentProvider(), cvs, managers, state, new Engine.Clock());
    });
}
//# sourceMappingURL=GameMain.js.map
