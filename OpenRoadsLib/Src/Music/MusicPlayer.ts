module Music {
    export class Player {
        private opl: OPL;
        private fullData: Data.ArrayBitStream;
        private data: Uint8Array;
        private stream: Data.ArrayBitStream;
        private reader: Data.BinaryReader;
        private paused: number;
        private jumpPos: number;
        private currentSong: number = -1;

        constructor(opl: OPL, managers: Managers.ManagerSet) {
            this.opl = opl;
            this.fullData = managers.Streams.getStream('MUZAX.LZS');
            this.stream = null;
        }

        public loadSong(n: number) {
            //return;
            if (n === this.currentSong) {
                return;
            }
            this.currentSong = n;
            this.fullData.setPosition(n * 6 * 8);
            var reader = new Data.BinaryReader(this.fullData);
            var startPos = reader.getUint16();
            var numInstruments = reader.getUint16();
            var uncompressedLength = reader.getUint16();
            this.data = new Uint8Array(uncompressedLength);

            this.fullData.setPosition(startPos * 8);
            var dstream = new Data.CompressedByteStream(reader);
            var dreader = new Data.BinaryReader(dstream);

            for (var i = 0; i < this.data.length; i++) {
                this.data[i] = dreader.getUint8();
            }

            this.stream = new Data.ArrayBitStream(<any>this.data);
            this.stream.setPosition(numInstruments * 16 * 8);
            this.reader = new Data.BinaryReader(this.stream);
            this.paused = 0;

            for (var i = 0; i < 11; i++) {
                this.opl.stopNote(i);
            }
        }

        public readNote(): void {
            if (this.stream === null) {
                return;
            }

            if (this.paused > 0) {
                this.paused--;
                return;
            }

            while (this.paused == 0) {
                var cmdLow = this.reader.getUint8();
                var cmdHigh = this.reader.getUint8();

                var functionType = cmdLow & 7;
                cmdLow = cmdLow >> 4;

                switch (functionType) {
                    case 0:
                        this.pause(cmdHigh);
                        return;
                    case 1:
                        //Configure instrument
                        this.turnOffNoteOrPlayBase(cmdLow, cmdHigh);
                        this.configureInstrument(cmdLow, cmdHigh);
                        break;
                    case 2:
                        //Play note;
                        this.playNote(cmdLow, cmdHigh);
                        break;
                    case 3:
                        //Turn off note or play base
                        this.turnOffNoteOrPlayBase(cmdLow, cmdHigh);
                        break;
                    case 4:
                        this.playInstrumentEffect(cmdLow, cmdHigh);
                        break;
                    case 5:
                        //Goto save position
                        this.stream.setPosition(this.jumpPos);
                        break;
                    case 6:
                        //Save song position;
                        this.jumpPos = this.stream.getPosition();
                        break;
                    case 7:
                        //Save unusued byte
                        break;
                }
            }
        }

        private playInstrumentEffect(cmdLow: number, cmdHigh: number) {
            this.opl.setChannelVolume(cmdLow, (cmdHigh & 0x3F) / 0x3F * -47.25);
        }

        private configureInstrument(cmdLow: number, cmdHigh: number) {
            var channel = cmdLow;
            var instrumentNum = cmdHigh;

            var instrStream = new Data.ArrayBitStream(<any>this.data);
            instrStream.setPosition(instrumentNum * 16 * 8);
            var instrReader = new Data.BinaryReader(instrStream);

            var configureOSC = (channelNum: number, oscNum: number) => {
                var tremolo = instrReader.getUint8();
                var keyScaleLevel = instrReader.getUint8();
                var attackRate = instrReader.getUint8();
                var sustainLevel = instrReader.getUint8();
                var waveForm = instrReader.getUint8();

                var oscDesc = new OscDesc();
                oscDesc.Tremolo = (tremolo & 0x80) > 0;
                oscDesc.Vibrato = (tremolo & 0x40) > 0;
                oscDesc.SoundSustaining = (tremolo & 0x20) > 0;
                oscDesc.KeyScaling = (tremolo & 0x10) > 0; //KSR
                oscDesc.Multiplication = tremolo & 0xF;

                oscDesc.KeyScaleLevel = keyScaleLevel >> 6; //KSL
                oscDesc.OutputLevel = (keyScaleLevel & 0x3F) / 0x3F * -47.25;

                oscDesc.AttackRate = attackRate >> 4;
                oscDesc.DecayRate = attackRate & 0xF;

                oscDesc.SustainLevel = -45.0 * (sustainLevel >> 4) / 0xF;
                oscDesc.ReleaseRate = sustainLevel & 0xF;

                var waveForms: WaveType[] = [WaveType.Sine, WaveType.HalfSine, WaveType.AbsSign, WaveType.PulseSign, WaveType.SineEven, WaveType.AbsSineEven, WaveType.Square, WaveType.DerivedSquare];
                oscDesc.WaveForm = waveForms[waveForm & 7];


                return oscDesc;
            };

            var a = configureOSC(channel, 0);
            var b = configureOSC(channel, 1);
            var channelConfig = instrReader.getUint8();
            var additive = (channelConfig & 1) > 0;
            var feedback = (channelConfig & 14) >> 1;
            this.opl.setChannelConfig(channel, a, b, additive, feedback);
        }

        private pause(cmdHigh: number) {
            this.paused = cmdHigh;
        }

        private turnOffNoteOrPlayBase(cmdLow: number, cmdHigh: number) {
            var channelNum = cmdLow;
            if (channelNum < 11) {
                this.opl.stopNote(channelNum);
            }
        }

        private playNote(low: number, high: number): void {
            var channels = [0, 1, 2, 3, 4, 5, 6, 7];
            var lowFreqs = [0xAC, 0xB6, 0xC1, 0xCD, 0xD9, 0xE6, 0xF3, 0x02, 0x11, 0x22, 0x33, 0x45];
            var highFreqs = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1];

            var channelNum = low, note = high % 12, octave = Math.floor(high / 12) + 2;
            var blockNum = octave;
            var freqN = (highFreqs[note] << 8) | lowFreqs[note];
            if (channelNum < 6) {
                this.opl.startNote(channelNum, freqN, blockNum);
            } else {
                //Drums
                channelNum -= 6;
                if (channelNum == 0) {
                    //BASE
                    this.opl.startNote(channelNum + 6, freqN, blockNum);
                } else if (channelNum == 1) {
                    //SNARE -- Used in Misty
                    this.opl.startNote(channelNum + 6, freqN, blockNum);
                } else if (channelNum == 2) {
                    //TOM
                    this.opl.startNote(channelNum + 6, freqN, blockNum);
                } else if (channelNum == 3) {
                    //TOP CYMBAL
                    this.opl.startNote(channelNum + 6, freqN, blockNum);
                } else if (channelNum == 4) {
                    //HIGH HAT
                    this.opl.startNote(channelNum + 6, freqN, blockNum);
                }
            }
        }
    }
}