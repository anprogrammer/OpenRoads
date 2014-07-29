module UI {
    export enum SettingAction {
        None,
        Increase,
        Decrease
    }

    export class NumberSetting {
        private name: string;

        private min: number;
        private max: number;
        private minLabel: string;
        private maxLabel: string;

        private getter: () => number;
        private setter: (n: number) => void;

        private value: number;

        constructor(name: string,
            min: number, max: number,
            minLabel: string, maxLabel: string,
            getter: () => number,
            setter: (n: number) => void) {
            this.name = name;

            this.min = min;
            this.max = max;

            this.minLabel = minLabel;
            this.maxLabel = maxLabel;

            this.getter = getter;
            this.setter = setter;

            this.value = getter();
        }

        public drawAndUpdate(cvs: HTMLCanvasElement, ctx: CanvasRenderingContext2D, fti: Engine.FrameTimeInfo, yPos: number, selected: boolean, action: SettingAction): void {
            var P = 4;

            var d = 0.0;
            if (action === SettingAction.Decrease) {
                d = -1.0;
            } else if (action === SettingAction.Increase) {
                d = 1.0;
            }

            if (d !== 0.0) {
                this.value = Math.min(this.max, Math.max(this.min, this.value + fti.getPhysicsStep() * (this.max - this.min) * d / 2.0));
                this.setter(this.value);
            }

            var bright = selected ? '#FFFF77' : '#FFFFFF';
            var dark = selected ? '#777777' : '#444444';

            ctx.fillStyle = bright;
            ctx.font = '10pt Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.name, cvs.width / 4, yPos);

            var percent = (this.value - this.min) / (this.max - this.min);
            var BH = 5;
            ctx.fillStyle = dark;
            ctx.fillRect(cvs.width / 2 + P, yPos - BH, (cvs.width / 2 - P * 2), BH * 2);
            ctx.fillStyle = bright;
            ctx.fillRect(cvs.width / 2 + P, yPos - BH, (cvs.width / 2 - P * 2) * percent, BH * 2);
        }
    }
}