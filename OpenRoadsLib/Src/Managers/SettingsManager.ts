module Managers {
    export class Setting<T> {
        private name: string;
        private value: T;
        private store: Stores.KVStore;
        constructor(store: Stores.KVStore, name: string, defaultValue: T) {
            this.store = store;
            this.name = name;
            this.value = JSON.parse(store.getValue(name) || JSON.stringify(defaultValue));
        }

        public getValue(): T {
            return this.value;
        }

        public setValue(val: T) {
            this.value = val;
            this.store.setValue(this.name, JSON.stringify(val));
        }
    }

    export class NumberSetting extends Setting<number> {
        constructor(store: Stores.KVStore, name: string, defaultValue: number) {
            super(store, name, defaultValue);
        }
    }
    
    export class BooleanSetting extends Setting<boolean> {
        constructor(store: Stores.KVStore, name: string, defaultValue: boolean) {
            super(store, name, defaultValue);
        }
    }
    

    export class SettingsManager {
        public MonitorIdx: NumberSetting;

        public EffectVolume: NumberSetting;
        public MusicVolume: NumberSetting;
        public MenuDistance: NumberSetting;
        public MenuSize: NumberSetting;

        public UseInterpolation: BooleanSetting;
        public EnableVSync: BooleanSetting;

        public WorldScale: NumberSetting;
        public HudScale: NumberSetting;
        public HudHeight: NumberSetting;
        public HudDist: NumberSetting;
        public ShowHud: BooleanSetting;
        public EyeHeight: NumberSetting;
        public VRDistanceFromShip: NumberSetting;
        public BackgroundScale: NumberSetting;

        private store: Stores.KVStore;

        constructor(store: Stores.KVStore) {
            this.store = store;
            this.MonitorIdx = new NumberSetting(store, 'monitorIdx', 0);
            this.EffectVolume = new NumberSetting(store, 'effectVolume', 0.5);
            this.MusicVolume = new NumberSetting(store, 'musicVolume', 0.5);
            this.MenuDistance = new NumberSetting(store, 'menuDistance', 1.6);
            this.MenuSize = new NumberSetting(store, 'menuSize', 1.0);            

            this.UseInterpolation = new BooleanSetting(store, 'useInterpolation', true);
            this.EnableVSync = new BooleanSetting(store, 'useVsync', true);

            this.WorldScale = new NumberSetting(store, 'worldScale', 44.0);
            this.HudScale = new NumberSetting(store, 'hudScale', 0.21);
            this.HudHeight = new NumberSetting(store, 'hudPosHeight', 46.6);
            this.HudDist = new NumberSetting(store, 'hudPosDist', 33.0);
            this.EyeHeight = new NumberSetting(store, 'eyeHeight', 154.0);
            this.VRDistanceFromShip = new NumberSetting(store, 'eyeDistance', 1.76);
            this.ShowHud = new BooleanSetting(store, 'showHud', true);

            this.BackgroundScale = new NumberSetting(store, 'backgroundScale', 3456.0);
        }

        public wonLevelCount(levelNum: number): number {
            var c = this.store.getValue('wonlevel_' + levelNum);
            return parseInt(c) || 0;
        }

        public incrementWonLevelCount(levelNum: number): void {
            this.store.setValue('wonlevel_' + levelNum, '' + (this.wonLevelCount(levelNum) + 1));
        }
    }
}
