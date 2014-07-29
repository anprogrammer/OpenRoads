module Sounds {
    export interface Playable {
        play(): void;
    }

    export interface PlayerAudioSource {
        fillAudioBuffer(buffer: Float32Array): boolean;
    }

    export interface LowLevelAudioProvider {
        createPlayable(buffer: Float32Array): Playable;
        runPlayer(player: PlayerAudioSource, useGain: boolean): void;
        setEffectsGain(gain: number): void;
    }
} 