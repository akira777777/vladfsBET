import { Decimal } from 'decimal.js';
export declare function toDecimal(val: string | number | Decimal): Decimal;
export declare function formatMoney(val: string | number | Decimal, decimals?: number): string;
export declare function formatCrypto(val: string | number | Decimal): string;
export declare function sumDecimals(...vals: (string | number | Decimal)[]): Decimal;
export declare function isPositiveMoney(val: string | number | Decimal): boolean;
export declare function sha256(data: string): string;
export declare function hmacSha256(key: string, data: string): string;
export declare function generateSecureToken(bytes?: number): string;
export declare function generateIdempotencyKey(prefix?: string): string;
export declare function provablyFairFloat(serverSeed: string, clientSeed: string, nonce: number): number;
export declare function provablyFairStream(serverSeed: string, clientSeed: string, nonce: number, count: number): number[];
export type PlinkoRisk = 'LOW' | 'MEDIUM' | 'HIGH';
export declare const PLINKO_PAYOUTS: Record<number, Record<PlinkoRisk, number[]>>;
export declare function getPlinkoMultipliers(rows: number, risk: PlinkoRisk): number[];
export declare function calculatePlinkoDrop(serverSeed: string, clientSeed: string, nonce: number, rows: number, risk: PlinkoRisk): {
    path: number[];
    binIndex: number;
    multiplier: number;
};
export declare function calculateMinesMultiplier(mineCount: number, revealedCount: number): number;
export declare function generateMinesLayout(serverSeed: string, clientSeed: string, nonce: number, mineCount: number): {
    minePositions: number[];
    grid: boolean[];
};
export declare function calculateDiceMultiplier(target: number, isRollUnder: boolean): {
    multiplier: number;
    winChance: number;
};
export declare function rollDice(serverSeed: string, clientSeed: string, nonce: number): number;
export declare function rollLimbo(serverSeed: string, clientSeed: string, nonce: number): number;
export type HiloCard = {
    suit: '♠' | '♥' | '♦' | '♣';
    rank: string;
    value: number;
};
export declare const HILO_RANKS: string[];
export declare const HILO_SUITS: ('♠' | '♥' | '♦' | '♣')[];
export declare function generateHiloDeck(serverSeed: string, clientSeed: string, nonce: number): HiloCard[];
export declare function getHiloOdds(currentCardValue: number): {
    higherMultiplier: number;
    lowerMultiplier: number;
    sameMultiplier: number;
    higherChance: number;
    lowerChance: number;
};
export declare function calculateCrashPoint(serverSeed: string, clientSeed: string, nonce: number): number;
export declare function sanitizeString(input: string): string;
export declare function calculateAge(dob: string | Date): number;
