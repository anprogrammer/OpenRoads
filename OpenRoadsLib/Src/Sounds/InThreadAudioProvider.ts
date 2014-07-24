module Sounds {
    export class InThreadAudioProvider implements AudioProvider {
        private base: LowLevelAudioProvider;
        private player: Music.Player;

        constructor(base: LowLevelAudioProvider, player: Music.Player) {
            this.base = base;
            this.player = player;
        }

        createPlayable(buffer: Float32Array): Playable {
            return this.base.createPlayable(buffer);
        }

        playSong(n: number): void {
            this.player.loadSong(n);
        }

        setGain(gain: number): void {
            this.base.setGain(gain);
        }
    }
}