module Sounds {
    export interface Playable {
        play(): void;
    }

    export interface PlayerAudioSource {
        fillAudioBuffer(buffer: Float32Array): boolean;
    }

    export interface AudioProvider {
        createPlayable(buffer: Float32Array): Playable;
        runPlayer(player: PlayerAudioSource): void;
        setGain(gain: number): void;
    }
} 