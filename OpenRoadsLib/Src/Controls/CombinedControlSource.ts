module Controls {
    export class CombinedControlSource implements ControlSource {
        private sources: Controls.ControlSource[] = [];

        public addSource(src: Controls.ControlSource) {
            this.sources.push(src);
        }

        private foldVal<T>(gvFunc: (src: ControlSource) => T) {
            var val: T = null;
            for (var i = 0; i < this.sources.length; i++) {
                val = val || gvFunc(this.sources[i]);
            }
            return val;
        }

        update(): void {
            for (var i = 0; i < this.sources.length; i++) {
                this.sources[i].update();
            }
        }

        getTurnAmount(): number {
            return this.foldVal((src) => src.getTurnAmount());
        }

        getAccelAmount(): number {
            return this.foldVal((src) => src.getAccelAmount());
        }

        getJump(): boolean {
            return this.foldVal((src) => src.getJump());
        }

        getLeft(): boolean {
            return this.foldVal((src) => src.getLeft());
        }

        getRight(): boolean {
            return this.foldVal((src) => src.getRight());
        }

        getUp(): boolean {
            return this.foldVal((src) => src.getUp());
        }

        getDown(): boolean {
            return this.foldVal((src) => src.getDown());
        }

        getEnter(): boolean {
            return this.foldVal((src) => src.getEnter());
        }

        getExit(): boolean {
            return this.foldVal((src) => src.getExit());
        }

        getSwitchMonitor(): boolean {
            return this.foldVal((src) => src.getSwitchMonitor());
        }

        getResetOrientation(): boolean {
            return this.foldVal((src) => src.getResetOrientation());
        }
    }
} 