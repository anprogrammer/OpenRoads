module Managers {
    export class SettingsManager {
        private effectVolume: number = 0.5;
        private musicVolume: number = 0.5;
        private store: Stores.KVStore;

        constructor(store: Stores.KVStore) {
            this.store = store;
            this.effectVolume = JSON.parse(this.store.getValue('evolume') || '0.5');
            this.musicVolume = JSON.parse(this.store.getValue('mvolume') || '0.5');
        }

        public getEffectVolume(): number {
            return this.effectVolume;
        }

        public getMusicVolume(): number {
            return this.musicVolume;
        }

        public setEffectVolume(n: number): void {
            this.effectVolume = n;
            this.store.setValue('evolume', JSON.stringify(n));
        }

        public setMusicVolume(n: number): void {
            this.musicVolume = n;
            this.store.setValue('mvolume', JSON.stringify(n));
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