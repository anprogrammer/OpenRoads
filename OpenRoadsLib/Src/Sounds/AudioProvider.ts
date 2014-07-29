module Sounds {
    export interface AudioProvider {
        createPlayable(buffer: Float32Array): Playable;
        playSong(n: number): void;
        setEffectsGain(gain: number): void;
        setMusicGain(gain: number): void;
    }
}