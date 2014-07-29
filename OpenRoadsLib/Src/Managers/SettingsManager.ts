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
        public EffectVolume: NumberSetting;
        public MusicVolume: NumberSetting;
        public MenuDistance: NumberSetting;
        public MenuSize: NumberSetting;

        public WorldScale: NumberSetting;
        public HudScale: NumberSetting;
        public EyeHeight: NumberSetting;
        public BackgroundScale: NumberSetting;

        public FixedHud: BooleanSetting;
        public FixedBackground: BooleanSetting;

        private store: Stores.KVStore;

        constructor(store: Stores.KVStore) {
            this.store = store;
            this.EffectVolume = new NumberSetting(store, 'effectVolume', 0.5);
            this.MusicVolume = new NumberSetting(store, 'musicVolume', 0.5);
            this.MenuDistance = new NumberSetting(store, 'menuDistance', 12.0);
            this.MenuSize = new NumberSetting(store, 'menuSize', 5.0);            

            this.WorldScale = new NumberSetting(store, 'worldScale', 1.0);
            this.HudScale = new NumberSetting(store, 'hudScale', 0.25);
            this.EyeHeight = new NumberSetting(store, 'eyeHeight', 130.0);

            this.BackgroundScale = new NumberSetting(store, 'backgroundScale', 1920.0);

            this.FixedHud = new BooleanSetting(store, 'fixedHud', false);
            this.FixedBackground = new BooleanSetting(store, 'fixedBackground', false);

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