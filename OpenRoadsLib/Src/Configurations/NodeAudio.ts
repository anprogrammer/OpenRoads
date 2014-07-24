module Configurations {
    export function runNodeAudio() {
        var manager = new Managers.StreamManager(new Stores.LocalFileProvider(), 'Data/');
        var managers = new Managers.ManagerSet(manager, null);

        manager.loadMultiple(['Data/MUZAX.LZS']).done(() => {
            var audioProvider = new Sounds.PortAudioAudioProvider();
            var opl = new Music.OPL(audioProvider);
            var player = new Music.Player(opl, managers);
            opl.setSource(player);


            var server = new Sounds.ChildProcessAudioServer(audioProvider, player);
        });
    }
}


declare var exports: any;
if (typeof exports !== 'undefined') {
    exports.Configurations = {
        runNode: Configurations.runNode,
        runNodeAudio: Configurations.runNodeAudio
    };
}