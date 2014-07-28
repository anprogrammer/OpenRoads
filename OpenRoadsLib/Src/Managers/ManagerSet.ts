module Managers {
    export class ManagerSet {
        public Streams: StreamManager;
        public Shaders: ShaderManager;
        public Textures: TextureManager;
        public Sounds: SoundManager;
        public Frames: Engine.FrameManager;
        public Controls: Controls.ControlSource;
        public Settings: Managers.SettingsManager;
        public Graphics: Shaders.ShaderProvider;
        public Canvas: Drawing.CanvasProvider;
        public Audio: Sounds.AudioProvider;
        public VR: VR.VRProvider;
        public SnapshotProvider: Game.GameSnapshotProvider;

        constructor(streams: StreamManager, shaders: ShaderManager) {
            this.Streams = streams;
            this.Shaders = shaders;
        }
    }
} 