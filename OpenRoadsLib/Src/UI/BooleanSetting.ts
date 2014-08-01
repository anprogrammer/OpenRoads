module UI {
    export class BooleanSetting implements SettingUI {
        private name: string;

        private setting: Managers.BooleanSetting;

        private value: boolean;

        constructor(name: string,
            setting: Managers.BooleanSetting) {
            this.name = name;

            this.setting = setting;

            this.value = setting.getValue();
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
                this.value = d < 0 ? false : true;
                this.setting.setValue(this.value);
            }

            var bright = selected ? '#FFFF77' : '#FFFFFF';
            var dark = selected ? '#777777' : '#444444';

            ctx.fillStyle = bright;
            ctx.font = '12pt Arial bold';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.name, cvs.width / 4, yPos);

            var BH = 5;
            var X = cvs.width / 2 + P;
            var W = cvs.width / 2 - P * 2;
            ctx.fillStyle = bright;
            ctx.fillRect(X + (this.value ? W / 2 : 0), yPos - BH, W / 2, BH * 2);

            ctx.strokeStyle = bright;
            ctx.strokeRect(X, yPos - BH, W, BH * 2);

            ctx.fillStyle = this.value ? bright : dark;
            ctx.fillText('Off', 5 * cvs.width / 8, yPos);

            ctx.fillStyle = this.value ? dark : bright;
            ctx.fillText('On', 7 * cvs.width / 8, yPos);
        }
    }
}