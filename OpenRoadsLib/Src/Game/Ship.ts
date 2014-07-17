module Game {
    export interface Position {
        getXPosition(): number;
        getYPosition(): number;
        getZPosition(): number;
    }

    export class Ship implements Position {
        private xPosition: number;
        private yPosition: number;
        private zPosition: number;
        constructor(xPosition: number, yPosition: number, zPosition: number) {
            this.xPosition = xPosition;
            this.yPosition = yPosition;
            this.zPosition = zPosition;
        }

        public getXPosition(): number {
            return this.xPosition;
        }

        public getYPosition(): number {
            return this.yPosition;
        }

        public getZPosition(): number {
            return this.zPosition;
        }
    }
} 