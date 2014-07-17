module Managers {
    export class SoundManager {
        private sounds: { [s: string]: Sounds.SoundEffect } = {};
        private multiSounds: { [s: string]: Sounds.SoundEffect[] } = {};
        public Sounds = {
            Intro: 'INTRO.SND'
        };

        private streamManager: StreamManager;
        private managers: ManagerSet;
        constructor(managers: ManagerSet) {
            this.streamManager = managers.Streams;
            this.managers = managers;
        }

        public getSound(soundName: string) {
            soundName = soundName.toUpperCase();
            if (!(soundName in this.sounds)) {
                this.sounds[soundName] = new Sounds.SoundEffect(this.managers, this.streamManager.getStream(soundName));
            }
            return this.sounds[soundName];
        }

        public getMultiEffect(soundName: string): Sounds.SoundEffect[] {
            soundName = soundName.toUpperCase();
            if (!(soundName in this.multiSounds)) {
                
                var data = this.streamManager.getStream(soundName);
                var reader = new Data.BinaryReader(data);
                var sfx: Sounds.SoundEffect[] = [];
                var starts = [reader.getUint16()];
                for (var i = 0; i < starts[0]; i += 2) {
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
        }
    }
}  