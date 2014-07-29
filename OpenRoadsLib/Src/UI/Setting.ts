module UI {
    export enum SettingAction {
        None,
        Increase,
        Decrease
    }

    export interface SettingUI {
        drawAndUpdate(cvs: HTMLCanvasElement, ctx: CanvasRenderingContext2D, fti: Engine.FrameTimeInfo, yPos: number, selected: boolean, action: SettingAction): void;
    }
} 