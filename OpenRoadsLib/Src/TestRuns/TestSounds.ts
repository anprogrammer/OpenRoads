module TestRuns {
    export function TestSounds(): void {
        var manager = new Managers.StreamManager(new Stores.AJAXFileProvider()), shaderManager = new Managers.ShaderManager(manager);
        var managers = new Managers.ManagerSet(manager, shaderManager);
        managers.Sounds = new Managers.SoundManager(managers);
        manager.loadMultiple(["Data/SFX.SND"]).done(() => {
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
}