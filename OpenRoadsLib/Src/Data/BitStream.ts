module Data {
    export interface BitStream {
        getBit(): number;
        eof(): boolean;
    }
    export interface RandomAccessBitStream extends BitStream {
        setPosition(bit: number): void;
        getPosition(): number;
    }
} 