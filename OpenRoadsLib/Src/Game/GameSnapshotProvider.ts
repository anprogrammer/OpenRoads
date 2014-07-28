module Game {
    export interface GameSnapshotProvider {
        reset(): void;
        pushSnapshot(s: GameSnapshot): void;
        getSnapshot(): GameSnapshot;
    }
}