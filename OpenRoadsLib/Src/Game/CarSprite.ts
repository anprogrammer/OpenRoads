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

        public updateAnimation(snap: GameSnapshot, level: Levels.Level): void {
            this.frame++;
        }

        public updatePosition(snap: GameSnapshot, level: Levels.Level): void {
            var frame = Math.max(0, this.frame - 1);

            this.sprite.Position.x = snap.Position.x - 95 - this.sprite.Size.x / 2;
            this.sprite.Position.y = 102 - (snap.Position.y - 80) - this.sprite.Texture.Width;
            this.sprite.Position.z = -(snap.Position.z) * 46.0 + 1.0;

            var minX = 95, maxX = 417;
            var xp = (snap.Position.x - minX) / (maxX - minX);
            var idx = 14 + Math.floor(xp * 7) * 9 + frame % 3;

            var gravityAccel = level.getGravityAcceleration();
            if (snap.Velocity.y > -gravityAccel * 4) {
                idx += 3;
            } else if (snap.Velocity.y < gravityAccel * 4) {
                idx += 6;
            }

            if (snap.CraftState === ShipState.Exploded) {
                if (!this.playedDeath) {
                    this.playedDeath = true;
                    this.frame = 0;
                    frame = 0;
                }

                var deathFNum = 14;
                idx = Math.min(deathFNum, Math.floor(frame / 2.0));
                if (idx === deathFNum) {
                    this.finishedDeath = true;
                }
            }

            this.sprite.ULow.y = idx * 30 / this.sprite.Texture.Height;
            this.sprite.UHigh.y = ((idx + 1) * 30 - 1) / this.sprite.Texture.Height;
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