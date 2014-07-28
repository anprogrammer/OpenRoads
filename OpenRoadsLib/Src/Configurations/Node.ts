declare function require(s: string): any;
module Configurations {
    export function runNode(mode: string): void {
        try {
            var agentLib = require('webkit-devtools-agent');
            var agent = new agentLib();
            agent.start(9999, 'localhost', 3333, true);
        } catch (e) {
        }

        var n = Math.random(); //It takes node like 0.5 seconds on the first Math.random() call for some reason on certain platforms.  Maybe it's a secure RNG in node?

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

        manager.loadMultiple(["Shaders/basic_2d.fs", "Shaders/basic_2d.vs", 'Shaders/title_2d.fs', 'Shaders/title_2d.vs', 'Shaders/color_3d.vs', 'Shaders/color_3d.fs',
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
        ]).done(() => {
                var exe = new ExeData.ExeDataLoader(managers);
                exe.load();

                var doc = wgl.document();
                var cvs = doc.createElement('canvas', 1280, 800, true);
                cvs.setTitle('SkyRoads VR');

                var controls = new Controls.CombinedControlSource();
                controls.addSource(new Controls.KeyboardControlsource(new Engine.KeyboardManager(<any>doc)));
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
}
