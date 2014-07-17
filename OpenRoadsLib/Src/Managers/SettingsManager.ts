module Managers {
    export class SettingsManager {
        public PlayMusic: boolean = true;
        private Muted: boolean = true;
        private volume: number = 0.25;
        private store: Stores.KVStore;

        constructor(store: Stores.KVStore) {
            this.store = store;
            this.Muted = JSON.parse(this.store.getValue('muted') || 'false');
        }

        public getMuted(): boolean {
            return this.Muted;
        }

        public setMuted(m: boolean) {
            this.Muted = m;
            this.store.setValue('muted', JSON.stringify(m));
        }

        public getVolume(): number {
            return this.Muted ? 0.0 : this.volume;
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