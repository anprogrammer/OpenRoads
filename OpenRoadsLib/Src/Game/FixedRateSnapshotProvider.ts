 module Game {
     export class FixedRateSnapshotProvider implements GameSnapshotProvider {
         private snapshot: GameSnapshot = null;

         reset(): void {
             this.snapshot = null;
         }

         pushSnapshot(s: GameSnapshot): void {
             this.snapshot = s;
         }
         
         getSnapshot(): GameSnapshot {
             return this.snapshot;
         }
     }
}