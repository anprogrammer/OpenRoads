module Game {
    export class CarSprite {
        private sprite: Drawing.Sprite;
        private frame: number;
        private playedDeath: boolean;
        private finishedDeath: boolean;
        constructor(gl: WebGLRenderingContext, managers: Managers.ManagerSet) {
            this.sprite = managers.Graphics.get3DSprite(gl, managers, managers.Textures.getTexture(gl, "CARS.LZS"));
            this.sprite.VHigh.x = 1.0;
            this.sprite.VHigh.y = 0.0;

            this.sprite.ULow.y = 0.0;
            this.sprite.UHigh.x = 0.0;

            this.sprite.Size.x = 30;
            this.sprite.Size.y = this.sprite.Texture.Width;
            this.sprite.State.EnableDepthTest = true;
            this.frame = 0;
            this.playedDeath = false;
            this.finishedDeath = false;
        }

        public update(state: StateManager): void {
            this.sprite.Position.x = state.currentXPosition - 95 - this.sprite.Size.x / 2;
            this.sprite.Position.y = 102 - (state.currentYPosition - 80) - this.sprite.Texture.Width;
            this.sprite.Position.z = -(state.currentZPosition) * 46.0; //TODO: Take viewMatrix and such into account in Sprite2D

            var minX = 95, maxX = 417;
            var xp = (state.currentXPosition - minX) / (maxX - minX);
            var idx = 14 + Math.floor(xp * 7) * 9 + this.frame % 3;

            if (state.yVelocity > -state.gravityAcceleration * 4) {
                idx += 3;
            } else if (state.yVelocity < state.gravityAcceleration * 4) {
                idx += 6;
            }

            if (state.isDead) {
                if (!this.playedDeath) {
                    this.playedDeath = true;
                    this.frame = 0;
                }

                var deathFNum = 14;
                idx = Math.min(deathFNum, Math.floor(this.frame / 2.0));
                if (idx === deathFNum) {
                    this.finishedDeath = true;
                }
            }

            this.sprite.ULow.y = idx * 30 / this.sprite.Texture.Height;
            this.sprite.UHigh.y = (idx + 1) * 30 / this.sprite.Texture.Height;

            this.frame++;
        }

        public draw(view: TSM.mat4, cam: Engine.CameraState): void {
            if (!this.finishedDeath) {
                this.sprite.ModelMatrix.setIdentity();
                view.copy(this.sprite.ViewMatrix);
                cam.ProjectionMatrix.copy(this.sprite.ProjectionMatrix);

                this.sprite.draw();
            }
        }

        public hasAnimationFinished(): boolean {
            return this.finishedDeath;
        }
    }
}