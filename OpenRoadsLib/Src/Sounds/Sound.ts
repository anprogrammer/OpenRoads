module Sounds {
    export class SoundEffect {
        private playable: Sounds.Playable;
        private managers: Managers.ManagerSet;
        constructor(managers: Managers.ManagerSet, stream: Data.ArrayBitStream, start: number = 0, end: number = 0) {

            this.managers = managers;

            var numBytes = (end || stream.getLength() / 8) - start;
            stream.setPosition(start * 8);
            var reader = new Data.BinaryReader(stream);


            var scaledLength = Math.floor(numBytes * 44100 / 8000);

            var bufferArr = new Float32Array(numBytes);
            for (var i = 0; i < numBytes; i++) {
                bufferArr[i] = (reader.getUint8() - 127) / 128.0;
            }

            var scaledBufferArr = new Float32Array(scaledLength);
            for (var i = 0; i < scaledBufferArr.length; i++) {
                scaledBufferArr[i] = bufferArr[Math.floor(i * numBytes / scaledLength)];
            }

            this.playable = managers.Audio.createPlayable(scaledBufferArr);
        }

        public play(): void {
            this.playable.play();
        }
    }
}