module Sounds {
    export interface AudioProvider {
        createPlayable(buffer: Float32Array): Playable;
        playSong(n: number): void;
        setGain(gain: number): void;
    }
}