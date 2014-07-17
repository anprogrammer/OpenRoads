module Sounds {
    declare class CoreAudio {
        createNewAudioEngine(): CoreAudioEngine;
    }

    declare class CoreAudioEngine {
        setOptions(obj: any): void;
        addAudioCallback(cb: (channels: Float32Array) => void): Float32Array;
    }

    class PortAudioPlayer implements PlayerAudioSource {
        private audio: PortAudioAudioProvider;
        private buffer: Float32Array;
        private position: number = 0;

        constructor(audio: PortAudioAudioProvider, buffer: Float32Array) {
            this.audio = audio;
            this.buffer = buffer;
            this.audio.runPlayer(this);
        }

        public fillAudioBuffer(buff: Float32Array): boolean {
            var start = this.position, end = start + buff.length, readEnd = Math.min(end, this.buffer.length);
            for (var i = start; i < readEnd; i++) {
                buff[i - start] = this.buffer[i];
            }
            this.position += buff.length;
            if (end === readEnd) {
                return this.position < this.buffer.length;
            } else {
                for (var i = readEnd; i < end; i++) {
                    buff[i - start] = 0;
                }
                return false;
            }
        }
    }

    class PortAudioPlayable implements Playable {
        private audio: PortAudioAudioProvider;
        private buffer: Float32Array;
        constructor(audio: PortAudioAudioProvider, buffer: Float32Array) {
            this.audio = audio;
            this.buffer = buffer;
        }

        play(): void {
            new PortAudioPlayer(this.audio, this.buffer);
        }
    }
    export class PortAudioAudioProvider implements AudioProvider {
        private players: PlayerAudioSource[] = [];
        private gain: number = 0;
        private engine: CoreAudioEngine;
        private buffer: Float32Array = null;

        constructor() {
            var audio = <CoreAudio>require('./Node/node_modules/node-core-audio');
            this.engine = audio.createNewAudioEngine();
            this.engine.setOptions({ inputChannels: 1, outputChannels: 1, interleaved: true, numSamples: 1024, numBuffers: 11, useMicrophone: false });
            this.engine.addAudioCallback((chans) => {
                return this.fillBuffer(chans);
            });
        }

        createPlayable(buffer: Float32Array): Playable {
            return new PortAudioPlayable(this, buffer);
        }

        runPlayer(player: PlayerAudioSource): void {
            this.players.push(player);
        }

        setGain(gain: number): void {
            this.gain = gain;
        }

        fillBuffer(inBuf: Float32Array): Float32Array {
            if (this.buffer === null) {
                this.buffer = new Float32Array(inBuf.length);
            }

            var out = inBuf; //this.buffer;
            var len = out.length;
            var gain = this.gain;
            var buff = new Float32Array(len);
            var players = this.players;

            for (var i = 0; i < len; i++) {
                out[i] = 0;
            }

            var min = Infinity, max = -Infinity;
            for (var i = 0; i < players.length; i++) {
                var p = players[i];
                if (!p.fillAudioBuffer(buff)) {
                    players.splice(i, 1);
                    i--;
                }

                for (var j = 0; j < len; j++) {
                    var v = buff[j] * this.gain;
                    min = Math.min(v, min);
                    max = Math.max(v, max);
                    out[j] += v;
                }
            }

            if (min < -1.0 || max > 1.0) {
                console.log(min + ' < ' + max);
            }

            return out;
        }
    };
} 