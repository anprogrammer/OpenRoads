module Sounds {
    var playSongCommand = 'PlaySong';
    var createPlayableCommand = 'CreatePlayable';
    var playPlayableCommand = 'PlayPlayable';
    var setEffectGainCommand = 'SetEGain';
    var setMusicGainCommand = 'SetMGain';

    export class SetEffectGainCommand {
        private Command: string = setEffectGainCommand;
        public Gain: number;

        constructor(gain: number) {
            this.Gain = gain;
        }
    }

    export class SetMusicGainCommand {
        private Command: string = setMusicGainCommand;
        public Gain: number;

        constructor(gain: number) {
            this.Gain = gain;
        }
    }
    
    export class PlaySongCommand {
        private Command: string = playSongCommand;
        public SongNumber: number = 0;

        constructor(songNumber: number) {
            this.SongNumber = songNumber;
        }
    }

    export class CreatePlayableCommand {
        private Command: string = createPlayableCommand;
        public Buffer: Float32Array;
        public Id: number;
        constructor(id: number, buffer: Float32Array) {
            this.Id = id;
            this.Buffer = buffer;
        }
    }

    export class PlayPlayableCommand {
        private Command: string = playPlayableCommand;
        public Id: number;
        constructor(id: number) {
            this.Id = id;
        }
    }

    declare class ProcessCommand {
        Command: string;
    }

    declare class Process {
        on(eventName: string, cb: (event: ProcessCommand) => void): void;
    }

    declare var process: Process;

    export class ChildProcessAudioServer {
        private provider: LowLevelAudioProvider;
        private musicPlayer: Music.Player;
        private playables: { [idx: number]: Playable } = {};

        constructor(baseProvider: LowLevelAudioProvider, musicPlayer: Music.Player) {
            this.provider = baseProvider;
            this.musicPlayer = musicPlayer;

            process.on('message', (evt) => {
                switch (evt.Command) {
                    case playSongCommand:
                        var psEvt = <PlaySongCommand><any>evt;
                        this.musicPlayer.loadSong(psEvt.SongNumber);
                        break;
                    case createPlayableCommand:
                        var cpEvt = <CreatePlayableCommand><any>evt;
                        var p = this.provider.createPlayable(cpEvt.Buffer);
                        this.playables[cpEvt.Id] = p;
                        break;
                    case playPlayableCommand:
                        var ppEvt = <PlayPlayableCommand><any>evt;
                        if (ppEvt.Id in this.playables) {
                            this.playables[ppEvt.Id].play();
                        }
                        break;
                    case setEffectGainCommand:
                        var sgEvt = <SetEffectGainCommand><any>evt;
                        this.provider.setEffectsGain(sgEvt.Gain);
                        break;
                case setMusicGainCommand:
                        var smEvt = <SetMusicGainCommand><any>evt;
                        this.musicPlayer.setGain(smEvt.Gain);
                        break;
                }
            });
        }
    }
}