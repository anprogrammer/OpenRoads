module TestRuns {
    export function TestMusic(): void {
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
        managers.Audio = new Sounds.WebAPIAudioProvider(actx);
        manager.loadMultiple(["Data/MUZAX.LZS"
        ]).done(() => {

                var opl = new Music.OPL(managers);
                var player = new Music.Player(opl, managers);
                opl.setSource(player);
                var w = <any>window;
                w.opl = opl;
            w.settings = managers.Settings;
            w.player = player;

                managers.Player = player;
                player.loadSong(0); //Song 6 has lots of drums
            });
    }
} 