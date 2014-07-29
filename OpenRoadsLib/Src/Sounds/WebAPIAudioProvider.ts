module Sounds {
    class WebAPIPlayable implements Playable {
        private ctx: AudioContext;
        private dst: AudioNode;
        private buffer: AudioBuffer;

        constructor(ctx: AudioContext, buff: Float32Array, dst: AudioNode) {
            if (ctx) {
                var buffer = ctx.createBuffer(1, buff.length, 44100);
                buffer.getChannelData(0).set(buff);

                this.ctx = ctx;
                this.buffer = buffer;
                this.dst = dst;
            }
        }

        play(): void {
            if (this.ctx) {
                var source: AudioBufferSourceNode = this.ctx.createBufferSource();
                source.buffer = this.buffer;
                source.connect(this.dst);
                source.start(0);
            }
        }
    }

    export class WebAPIAudioProvider implements LowLevelAudioProvider {
        private ctx: AudioContext;
        private dest: GainNode;
        private players: PlayerAudioSource[] = [];
        private playerNodes: ScriptProcessorNode[] = [];

        constructor(ctx: AudioContext) {
            this.ctx = ctx;
            if (this.ctx) {
                this.dest = ctx.createGain();
                this.dest.gain.value = 0.0;
                this.dest.connect(ctx.destination);
            }
        }

        createPlayable(buffer: Float32Array): Playable {
            return new WebAPIPlayable(this.ctx, buffer, this.dest);
        }

        runPlayer(player: PlayerAudioSource, useGain: boolean): void {
            if (this.ctx) {
                var node = this.ctx.createScriptProcessor(1024, 1, 1);
                node.onaudioprocess = (evt: Event) => player.fillAudioBuffer((<AudioProcessingEvent>evt).outputBuffer.getChannelData(0));
                node.connect(useGain ? <AudioNode>this.dest : <AudioNode>this.ctx.destination);
                this.players.push(player);
                this.playerNodes.push(node);
            }
        }

        setEffectsGain(gain: number): void {
            if (this.ctx) {
                this.dest.gain.value = gain;
            }
        }
    };
} 