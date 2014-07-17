module Managers {
    export class ManagerSet {
        public Streams: StreamManager;
        public Shaders: ShaderManager;
        public Textures: TextureManager;
        public Sounds: SoundManager;
        public Player: Music.Player;
        public Frames: Engine.FrameManager;
        public Keyboard: Engine.KeyboardManager;
        public Settings: Managers.SettingsManager;
        public Graphics: Shaders.ShaderProvider;
        public Canvas: Drawing.CanvasProvider;
        public Audio: Sounds.AudioProvider;
        public VR: VR.VRProvider;

        constructor(streams: StreamManager, shaders: ShaderManager) {
            this.Streams = streams;
            this.Shaders = shaders;
        }
    }
} 