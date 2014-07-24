module Sounds {
    export declare class ChildProcess {
        send(data: any): void;
    }

    class ChildProcessPlayable implements Playable {
        private id: number;
        private worker: ChildProcess;

        constructor(id: number, worker: ChildProcess) {
            this.id = id;
            this.worker = worker;
        }

        play(): void {
            this.worker.send(new PlayPlayableCommand(this.id));
        }
    }

    export class ChildProcessAudioProvider implements AudioProvider {
        private worker: ChildProcess;
        private static pId = 0;

        constructor(worker: ChildProcess) {
            this.worker = worker;
        }

        createPlayable(buffer: Float32Array): Playable {
            var id = ChildProcessAudioProvider.pId;
            ChildProcessAudioProvider.pId++;

            var playable = new ChildProcessPlayable(id, this.worker);
            this.worker.send(new CreatePlayableCommand(id, buffer));
            return playable;
        }

        playSong(n: number): void {
            this.worker.send(new PlaySongCommand(n));
        }

        setGain(gain: number): void {
            this.worker.send(new SetGainCommand(gain));
        }
    }
}