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
            try {
                this.worker.send(new PlayPlayableCommand(this.id));
            } catch (ex) {
                console.log('Audio exception on play');
                console.log(ex);
            }
        }
    }

    class ChildProcessDummyPlayable implements Playable {
        play(): void {
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

            try {
                var playable = new ChildProcessPlayable(id, this.worker);
                this.worker.send(new CreatePlayableCommand(id, buffer));
                return playable;
            } catch (ex) {
                console.log('Audio exception on  createPlayable');
                console.log(ex);
                return new ChildProcessDummyPlayable();
            }
        }

        playSong(n: number): void {
            try {
                this.worker.send(new PlaySongCommand(n));
            } catch (ex) {
                console.log('Audio exception on playSong');
                console.log(n);
            }
        }

        setGain(gain: number): void {
            try {
                this.worker.send(new SetGainCommand(gain));
            } catch (ex) {
                console.log('Audio exception on setGain');
                console.log(ex);
            }
        }
    }
}