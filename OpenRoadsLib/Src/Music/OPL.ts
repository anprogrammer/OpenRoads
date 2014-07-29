module Music {
    export enum WaveType {
        Sine = 0,
        HalfSine = 1,
        AbsSign = 2,
        PulseSign = 3,
        SineEven = 4,
        AbsSineEven = 5,
        Square = 6,
        DerivedSquare = 7
    }

    export enum KeyState {
        Off,
        Attack,
        Sustain,
        Decay,
        Release
    }

    export class OscDesc {
        public Tremolo: boolean = false;
        public Vibrato: boolean = false;
        public SoundSustaining: boolean = true;
        public KeyScaling: boolean = false;
        public Multiplication: number = 1.0;

        public KeyScaleLevel: number = 0.0;
        public OutputLevel: number = 1.0;

        public AttackRate: number = 0;
        public DecayRate: number = 0;

        public SustainLevel: number = 0;
        public ReleaseRate: number = 0;

        public WaveForm: WaveType = WaveType.Sine;
        public Wave: number[] = [];
    }

    export class OscState {
        public Config: OscDesc = new OscDesc();
        public State: KeyState = KeyState.Off;
        public Volume: number = 0;
        public EnvelopeStep: number = 0;
        public Angle: number = 0;
    }

    class Channel {
        public A: OscState = new OscState();
        public B: OscState = new OscState();
        public Additive: boolean = false;
        public Feedback: number = 0;

        public FreqNum: number = 0.0;
        public BlockNum: number = 0.0;

        public Output0: number = 0.0;
        public Output1: number = 0.0;

        public M1: number = 0.0;
        public M2: number = 0.0;
        public FeedbackFactor: number = 0.0;

        public ProcessFunc: (c: Channel) => number;
    }

    export class OPL implements Sounds.PlayerAudioSource {
        private channels: Channel[];
        private sampleRate: number = 44100;
        private src: Player = null;
        private timeSinceNote: number = 0;
        private noteTickRate: number = 5 / 1000.0;
        private time: number = 0.0;
        private synthTime: number = 0.0;
        private timePassed: number = 0.0;
        private VMin: number = -96.0;
        private VMax: number = 0.0;
        private node: ScriptProcessorNode;
        private waves: number[][] = [];
        private sampleCount: number = 1024;

        constructor(llap: Sounds.LowLevelAudioProvider) {
            this.channels = [];

            var waveSin: number[] = [];
            var waveHalfSin: number[] = [];
            var waveAbsSign: number[] = [];
            var wavePulseSign: number[] = [];
            var waveSineEven: number[] = [];
            var waveAbsSineEven: number[] = [];
            var waveSquare: number[] = [];
            var waveDerivedSquare: number[] = [];
            for (var i = 0; i < this.sampleCount; i++) {
                var angle = 2 * Math.PI * i / this.sampleCount;
                var s = Math.sin(angle);
                waveSin.push(s);
                waveHalfSin.push(Math.max(s, 0.0));
                waveAbsSign.push(Math.abs(s));
                wavePulseSign.push(angle % 6.28 < 1.57 ? s : 0.0);
                waveSineEven.push(angle % 12.56 < 6.28 ? s : 0.0);
                waveAbsSineEven.push(angle % 12.56 < 6.28 ? Math.abs(s) : 0.0);
                waveSquare.push(s > 0.0 ? 1.0 : 0.0);
                waveDerivedSquare.push(s > 0.0 ? 1.0 : 0.0);
            }

            this.waves.push(waveSin);
            this.waves.push(waveHalfSin);
            this.waves.push(waveAbsSign);
            this.waves.push(wavePulseSign);
            this.waves.push(waveSineEven);
            this.waves.push(waveAbsSineEven);
            this.waves.push(waveSquare);
            this.waves.push(waveDerivedSquare);

            for (var i = 0; i < 15; i++) {
                this.channels.push(new Channel());
                this.channels[i].ProcessFunc = this.processChannelOutputFM;
            }

            this.sampleRate = 44100;
            llap.runPlayer(this, false);
        }

        public setSource(mp: Player) {
            this.src = mp;
            for (var i = 0; i < this.channels.length; i++) {
                this.stopNote(i);
            }
        }

        public setChannelConfig(n: number, a: OscDesc, b: OscDesc, isAdditive: boolean, feedbackAmt: number) {
            if (n >= this.channels.length) {
                return;
            }
            a.Wave = this.waves[a.WaveForm];
            b.Wave = this.waves[b.WaveForm];

            this.channels[n].A.Config = a;
            this.channels[n].B.Config = b;
            this.channels[n].Additive = isAdditive;
            this.channels[n].Feedback = feedbackAmt;
            var v = 0.0;
            var feedbackFactor = feedbackAmt > 0 ? Math.pow(2.0, feedbackAmt + 8) : 0;
            var radiansPerWave = 2 * Math.PI;
            var dbuPerWave = 1024 * 16.0;
            var volAsDbu = 1.0 * 0x4000 * 0x10000 * 1.0 / 0x4000;
            var m2 = radiansPerWave * volAsDbu / dbuPerWave;
            var m1 = m2 / 2.0 / 0x10000;
            this.channels[n].M1 = m1;
            this.channels[n].M2 = m2;
            this.channels[n].FeedbackFactor = feedbackFactor;
            this.channels[n].ProcessFunc = isAdditive ? this.processChannelOutputAdditive : this.processChannelOutputFM;
        }

        public setChannelVolume(n: number, v: number) {
            if (n >= this.channels.length) {
                return;
            }
            this.channels[n].B.Config.OutputLevel = v;
        }

        public startNote(channel: number, freqNum: number, blockNum: number): void {
            var chan = this.channels[channel];
            function configureOSC(osc: OscState) {
                if (chan.FreqNum == freqNum && chan.BlockNum == blockNum && osc.State == KeyState.Sustain) {
                    return;
                }

                osc.State = KeyState.Attack;
                osc.EnvelopeStep = 0;
            }


            configureOSC(chan.A);
            configureOSC(chan.B);
            chan.FreqNum = freqNum;
            chan.BlockNum = blockNum;
        }

        public stopNote(channel: number) {
            var chan = this.channels[channel];
            function configureOSC(osc: OscState) {
                if (osc.State == KeyState.Off) {
                    return;
                }

                osc.State = KeyState.Release;
            }


            configureOSC(chan.A);
            configureOSC(chan.B);
        }

        public fillAudioBuffer(buffer: Float32Array): boolean {
            var synthOut = 0.0;
            var gain = this.src !== null ? this.src.getGain() : 0.0;
            
            if (this.src == null) {
                for (var i = 0; i < buffer.length; i++) {
                    buffer[i] = 0;
                }
                return true;
            }


            this.timePassed = 1.0 / this.sampleRate;
            for (var i = 0; i < buffer.length; i++) {
                this.timeSinceNote += this.timePassed;

                if (this.timeSinceNote > this.noteTickRate) {
                    this.src.readNote();
                    this.timeSinceNote -= this.noteTickRate;
                }

                this.time += this.timePassed;
                this.synthTime += this.timePassed;
                while (this.synthTime >= OPLConstants.SampleTime) {
                    synthOut = 0.0;
                    for (var j = 0; j < this.channels.length; j++) {
                        synthOut += this.channels[j].ProcessFunc.call(this, this.channels[j]);
                    }
                    this.synthTime -= OPLConstants.SampleTime;
                }

                buffer[i] = synthOut / 2.0 * gain;
            }

            return true;
        }

        private processChannelOutputAdditive(c: Channel): number {
            var a = this.processOsc(c.A, c.FreqNum, c.BlockNum, (c.Output0 + c.Output1) * c.FeedbackFactor * c.M1);
            var b = this.processOsc(c.B, c.FreqNum, c.BlockNum, 0.0);
            c.Output1 = c.Output0;
            c.Output0 = a;
            return a + b;
        }

        private processChannelOutputFM(c: Channel): number {
            var a = this.processOsc(c.A, c.FreqNum, c.BlockNum, (c.Output0 + c.Output1) * c.FeedbackFactor * c.M1);
            var b = this.processOsc(c.B, c.FreqNum, c.BlockNum, a * c.M2);
            c.Output1 = c.Output0;
            c.Output0 = a;
            return b;
        }

        private processOsc(osc: OscState, freqNum: number, blockNum: number, modulator: number): number {
            var state = osc.State;
            var conf = osc.Config;

            if (state == KeyState.Off) {
                return 0.0;
            }


            //TODO: Proper KEYBOARD SPLIT SECTION Implementation - pg.43
            //Actual OutputLevel
            //Actual KSR/KSS etc
            //Feedback modulation
            //Tremelo
            //Vibrato

            var keyScaleNum = blockNum * 2 + (freqNum >> 7);
            var rof = conf.KeyScaling ? keyScaleNum : Math.floor(keyScaleNum / 4);

            function getRate(n: number) {
                return Math.min(n > 0 ? rof + n * 4 : 0, 63);
            }

            switch (osc.State) {
                case KeyState.Attack:
                    var rate = getRate(conf.AttackRate);
                    var timeToAttack = OPLConstants.AttackRates[rate];
                    if (timeToAttack == 0) {
                        osc.Volume = this.VMax;
                        osc.EnvelopeStep = 0;
                        osc.State = KeyState.Decay;
                    } else if (timeToAttack == null) {
                        osc.State = KeyState.Off;
                    } else {
                        var p = 3.0;
                        var steps = Math.floor(timeToAttack / 1000.0 / OPLConstants.SampleTime);
                        osc.Volume = -96.0 * Math.pow((steps - osc.EnvelopeStep) / steps, p);
                        osc.EnvelopeStep++;
                        if (osc.EnvelopeStep >= steps) {
                            osc.EnvelopeStep = 0;
                            osc.Volume = this.VMax;
                            osc.State = KeyState.Decay;
                        }
                    }
                    break;
                case KeyState.Decay:
                    var rate = getRate(conf.DecayRate);
                    var timeToDecay = OPLConstants.DecayRates[rate];
                    if (timeToDecay === 0) {
                        osc.Volume = conf.SustainLevel;
                        osc.EnvelopeStep = 0;
                        osc.State = KeyState.Sustain;
                    } else if (timeToDecay !== null) {
                        var steps = Math.floor(timeToDecay / 1000.0 / OPLConstants.SampleTime);
                        var decreaseAmt = conf.SustainLevel / steps;
                        osc.Volume += decreaseAmt;
                        osc.EnvelopeStep++;
                        if (osc.EnvelopeStep >= steps) {
                            osc.EnvelopeStep = 0;
                            osc.State = KeyState.Sustain;
                        }
                    }
                    break;
                case KeyState.Sustain:
                    if (!conf.SoundSustaining) {
                        osc.State = KeyState.Release;
                    }
                    break;
                case KeyState.Release:
                    var rate = getRate(conf.ReleaseRate);
                    var timeToRelease = OPLConstants.DecayRates[rate];
                    var steps = Math.floor(timeToRelease / 1000.0 / OPLConstants.SampleTime);
                    var decreaseAmt = (this.VMin - conf.SustainLevel) / steps;
                    osc.Volume += decreaseAmt;
                    osc.EnvelopeStep++;
                    if (osc.EnvelopeStep == steps) {
                        osc.Volume = this.VMin;
                        osc.State = KeyState.Off;
                    }
                    break;
            }

            var ksDamping: number = 0;
            if (osc.Config.KeyScaleLevel > 0) {
                var kslm = OPLConstants.KeyScaleMultipliers[conf.KeyScaleLevel];
                ksDamping = -kslm * OPLConstants.KeyScaleLevels[blockNum][freqNum >> 6];
            }

            var freq = OPLConstants.FreqStarts[blockNum] + OPLConstants.FreqSteps[blockNum] * freqNum;
            freq *= (conf.Multiplication == 0 ? 0.5 : conf.Multiplication);

            var vib = conf.Vibrato ? Math.cos(this.time * 2 * Math.PI) * 0.00004 + 1.0 : 1.0;
            osc.Angle += OPLConstants.SampleTime * 2 * Math.PI * freq * vib;

            var angle = osc.Angle + modulator;
            var a2 = Math.abs(angle) % (2 * Math.PI);
            var wave = conf.Wave[Math.floor(a2 * this.sampleCount / 2 / Math.PI)];

            var tremolo = conf.Tremolo ? Math.abs(Math.cos(this.time * Math.PI * 3.7)) * 1 : 0.0;
            return wave * Math.pow(10.0, (osc.Volume + conf.OutputLevel + tremolo + ksDamping) / 10.0);
        }
    }
} 