/// <reference path="RoadsLib.d.ts" />
window.onload = function () {
    runPhysTest();
};

function runPhysTest() {
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
    src.addSource(new Controls.KeyboardControlsource(new Engine.KeyboardManager(document.body)));
    src.addSource(new Controls.JoystickControlSource(new Controls.NavigatorJoystick(navigator)));
    managers.Controls = src;
    managers.Settings = new Managers.SettingsManager(new Stores.LocalStorageStore(isXMas ? 'xmas' : 'classic'));
    managers.Graphics = new Shaders.ClassicShaderProvider();
    managers.Textures = new Managers.TextureManager(managers);
    managers.Canvas = new Drawing.HTMLCanvasProvider();
    managers.Audio = new Sounds.WebAPIAudioProvider(actx);
    managers.VR = null;

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

        document.getElementById('loading').style.display = 'none';
        cvs.style.display = 'block';
        var opl = new Music.OPL(managers);
        var player = new Music.Player(opl, managers);
        opl.setSource(player);
        var w = window;
        w.opl = opl;
        w.settings = managers.Settings;

        managers.Player = player;

        var demoCon = new Game.DemoController(manager.getRawArray('DEMO.REC'));
        var ll = new Levels.MultiLevelLoader(managers.Streams.getStream("ROADS.LZS"));
        var level = ll.Levels[0];
        var newState = new Game.StateManager(managers, level, demoCon);
        var originalState = new RefPhysics.StateManager(managers, level, demoCon);

        var correctFrames = 0;
        var bus = new Events.EventBus();
        while (!newState.didWin) {
            var snap = newState.runFrame(bus);
            originalState.runFrame();
            snap.Velocity.z = snap.Velocity.z - snap.JumpOMasterVelocityDelta;
            if (snap.Position.x !== originalState.currentXPosition || snap.Position.y !== originalState.currentYPosition || snap.Position.z !== originalState.currentZPosition || snap.Velocity.z !== originalState.zVelocity || snap.JumpOMasterVelocityDelta !== originalState.jumpOMasterVelocityDelta || snap.JumpOMasterInUse !== originalState.jumpOMasterInUse) {
                console.log(snap.Position.x + ' <> ' + originalState.currentXPosition);
                console.log(snap.Position.y + ' <> ' + originalState.currentYPosition);
                console.log(snap.Position.z + ' <> ' + originalState.currentZPosition);

                console.log(snap.Velocity.z + ' <> ' + originalState.zVelocity);
                console.log(snap.JumpOMasterInUse + ' <> ' + originalState.jumpOMasterInUse);
                console.log(snap.JumpOMasterVelocityDelta + ' <> ' + originalState.jumpOMasterVelocityDelta);

                break;
            }
            correctFrames++;
            if (correctFrames > 60 * 30) {
                console.log('Too long!');
                debugger;
                break;
            }
        }

        if (!newState.didWin) {
            debugger;
            var newState = new Game.StateManager(managers, level, demoCon);
            var originalState = new RefPhysics.StateManager(managers, level, demoCon);
            var lastSnap;
            for (var i = 0; i < correctFrames; i++) {
                lastSnap = newState.runFrame(bus);
                originalState.runFrame();
            }
            debugger;
            newState.runFrame(bus);
            originalState.runFrame();
        } else {
            console.log('Test passed!');
        }
    });
}
//# sourceMappingURL=PhysicsTestMain.js.map
