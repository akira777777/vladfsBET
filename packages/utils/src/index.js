import { Decimal } from 'decimal.js';
import { createHash, createHmac, randomBytes } from 'node:crypto';
// High-precision financial decimal helper (8 decimal places standard)
export function toDecimal(val) {
    return new Decimal(val);
}
export function formatMoney(val, decimals = 2) {
    const d = new Decimal(val);
    return d.toFixed(decimals);
}
export function formatCrypto(val) {
    const d = new Decimal(val);
    return d.toFixed(8);
}
export function sumDecimals(...vals) {
    return vals.reduce((acc, v) => acc.plus(new Decimal(v)), new Decimal(0));
}
export function isPositiveMoney(val) {
    try {
        const d = new Decimal(val);
        return d.isFinite() && d.greaterThan(0);
    }
    catch {
        return false;
    }
}
// Cryptographic Utilities
export function sha256(data) {
    return createHash('sha256').update(data).digest('hex');
}
export function hmacSha256(key, data) {
    return createHmac('sha256', key).update(data).digest('hex');
}
export function generateSecureToken(bytes = 32) {
    return randomBytes(bytes).toString('hex');
}
export function generateIdempotencyKey(prefix = 'tx') {
    return `${prefix}_${Date.now()}_${randomBytes(8).toString('hex')}`;
}
// Provably Fair RNG calculation
// Given serverSeed, clientSeed, nonce -> deterministically produces float in [0, 1)
export function provablyFairFloat(serverSeed, clientSeed, nonce) {
    const hash = hmacSha256(serverSeed, `${clientSeed}:${nonce}`);
    // Take first 8 chars (32 bits)
    const hex = hash.substring(0, 8);
    const intVal = parseInt(hex, 16);
    return intVal / 0x100000000;
}
// Multi-byte deterministic stream generator for provably fair array shuffles and multi-step paths
export function provablyFairStream(serverSeed, clientSeed, nonce, count) {
    const floats = [];
    let round = 0;
    while (floats.length < count) {
        const hash = hmacSha256(serverSeed, `${clientSeed}:${nonce}:${round}`);
        for (let i = 0; i < hash.length && floats.length < count; i += 8) {
            const hex = hash.substring(i, i + 8);
            if (hex.length === 8) {
                floats.push(parseInt(hex, 16) / 0x100000000);
            }
        }
        round++;
    }
    return floats;
}
export const PLINKO_PAYOUTS = {
    8: {
        LOW: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
        MEDIUM: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
        HIGH: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    },
    9: {
        LOW: [5.6, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 5.6],
        MEDIUM: [18, 4, 1.7, 0.9, 0.5, 0.5, 0.9, 1.7, 4, 18],
        HIGH: [43, 7, 2, 0.6, 0.2, 0.2, 0.6, 2, 7, 43],
    },
    10: {
        LOW: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
        MEDIUM: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
        HIGH: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76],
    },
    11: {
        LOW: [8.4, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 8.4],
        MEDIUM: [24, 6, 3, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3, 6, 24],
        HIGH: [120, 14, 4.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 4.2, 14, 120],
    },
    12: {
        LOW: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
        MEDIUM: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
        HIGH: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
    },
    13: {
        LOW: [8.1, 4, 2.5, 1.8, 1.4, 1, 0.7, 0.7, 1, 1.4, 1.8, 2.5, 4, 8.1],
        MEDIUM: [43, 13, 6, 3, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 3, 6, 13, 43],
        HIGH: [260, 37, 11, 4, 1, 0.2, 0.2, 0.2, 0.2, 1, 4, 11, 37, 260],
    },
    14: {
        LOW: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
        MEDIUM: [58, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 58],
        HIGH: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420],
    },
    15: {
        LOW: [15, 8, 3, 2, 1.5, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.5, 2, 3, 8, 15],
        MEDIUM: [88, 18, 11, 5, 3, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 3, 5, 11, 18, 88],
        HIGH: [620, 83, 27, 8, 3, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 3, 8, 27, 83, 620],
    },
    16: {
        LOW: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
        MEDIUM: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
        HIGH: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
    },
};
export function getPlinkoMultipliers(rows, risk) {
    const rowConfig = PLINKO_PAYOUTS[rows] || PLINKO_PAYOUTS[16];
    return rowConfig[risk] || rowConfig.MEDIUM;
}
export function calculatePlinkoDrop(serverSeed, clientSeed, nonce, rows, risk) {
    const stream = provablyFairStream(serverSeed, clientSeed, nonce, rows);
    const path = []; // 0 = left, 1 = right
    let rightMoves = 0;
    for (let i = 0; i < rows; i++) {
        const dir = stream[i] >= 0.5 ? 1 : 0;
        path.push(dir);
        if (dir === 1)
            rightMoves++;
    }
    const binIndex = rightMoves; // In an R-row board, bin index is 0..R
    const multipliers = getPlinkoMultipliers(rows, risk);
    const multiplier = multipliers[binIndex] ?? 1.0;
    return { path, binIndex, multiplier };
}
// ----------------------------------------------------
// 2. MINES Provably Fair & Multiplier Table
// ----------------------------------------------------
export function calculateMinesMultiplier(mineCount, revealedCount) {
    if (revealedCount <= 0)
        return 1.0;
    const safeCount = 25 - mineCount;
    if (revealedCount > safeCount)
        return 0;
    // Combination(25, k) / Combination(25 - mineCount, k) * 0.99
    let mult = 0.99;
    for (let i = 0; i < revealedCount; i++) {
        mult *= (25 - i) / (safeCount - i);
    }
    return Math.floor(mult * 100) / 100;
}
export function generateMinesLayout(serverSeed, clientSeed, nonce, mineCount) {
    const totalTiles = 25;
    const count = Math.max(1, Math.min(24, mineCount));
    const tiles = Array.from({ length: totalTiles }, (_, i) => i);
    const stream = provablyFairStream(serverSeed, clientSeed, nonce, totalTiles);
    // Fisher-Yates shuffle
    for (let i = totalTiles - 1; i > 0; i--) {
        const j = Math.floor(stream[totalTiles - 1 - i] * (i + 1));
        const temp = tiles[i];
        tiles[i] = tiles[j];
        tiles[j] = temp;
    }
    const minePositions = tiles.slice(0, count).sort((a, b) => a - b);
    const grid = Array.from({ length: totalTiles }, (_, idx) => minePositions.includes(idx));
    return { minePositions, grid };
}
// ----------------------------------------------------
// 3. DICE Provably Fair & Multiplier
// ----------------------------------------------------
export function calculateDiceMultiplier(target, isRollUnder) {
    const winChance = isRollUnder ? target : 100 - target;
    const clampedWinChance = Math.max(0.01, Math.min(98.0, winChance));
    // 99% RTP (1% house edge)
    const multiplier = Math.floor((99.0 / clampedWinChance) * 10000) / 10000;
    return { multiplier, winChance: clampedWinChance };
}
export function rollDice(serverSeed, clientSeed, nonce) {
    const float = provablyFairFloat(serverSeed, clientSeed, nonce);
    return Math.floor(float * 10000) / 100; // Returns 0.00 to 99.99
}
// ----------------------------------------------------
// 4. LIMBO Provably Fair
// ----------------------------------------------------
export function rollLimbo(serverSeed, clientSeed, nonce) {
    const float = provablyFairFloat(serverSeed, clientSeed, nonce);
    // House edge 1% -> 99 / (1 - float * 0.99)
    if (float >= 0.99) {
        const huge = Math.floor((99 / (1 - float)) * 100) / 100;
        return Math.min(1000000, huge);
    }
    const result = Math.floor((99 / (100 - float * 100)) * 100) / 100;
    return Math.max(1.0, result);
}
export const HILO_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const HILO_SUITS = ['♠', '♥', '♦', '♣'];
export function generateHiloDeck(serverSeed, clientSeed, nonce) {
    const deck = [];
    for (const suit of HILO_SUITS) {
        for (let r = 0; r < HILO_RANKS.length; r++) {
            deck.push({
                suit,
                rank: HILO_RANKS[r],
                value: r + 2,
            });
        }
    }
    const stream = provablyFairStream(serverSeed, clientSeed, nonce, deck.length);
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(stream[deck.length - 1 - i] * (i + 1));
        const temp = deck[i];
        deck[i] = deck[j];
        deck[j] = temp;
    }
    return deck;
}
export function getHiloOdds(currentCardValue) {
    // Card values 2 to 14
    const totalRanks = 13;
    const rankIndex = currentCardValue - 2; // 0..12
    const higherRanksCount = 12 - rankIndex + 1; // Including same rank for Higher or Equal
    const lowerRanksCount = rankIndex + 1; // Including same rank for Lower or Equal
    const higherChance = Math.max(0.0769, higherRanksCount / totalRanks);
    const lowerChance = Math.max(0.0769, lowerRanksCount / totalRanks);
    // 98.5% RTP (1.5% house edge)
    const higherMultiplier = Math.floor((0.985 / higherChance) * 100) / 100;
    const lowerMultiplier = Math.floor((0.985 / lowerChance) * 100) / 100;
    const sameMultiplier = 12.5;
    return {
        higherMultiplier: Math.max(1.05, higherMultiplier),
        lowerMultiplier: Math.max(1.05, lowerMultiplier),
        sameMultiplier,
        higherChance: Math.round(higherChance * 100),
        lowerChance: Math.round(lowerChance * 100),
    };
}
// ----------------------------------------------------
// 6. CRASH Provably Fair
// ----------------------------------------------------
export function calculateCrashPoint(serverSeed, clientSeed, nonce) {
    const float = provablyFairFloat(serverSeed, clientSeed, nonce);
    // 1% instant crash at 1.00x house edge, else standard crash curve
    if (float < 0.01)
        return 1.0;
    const result = Math.floor((99 / (100 - float * 99)) * 100) / 100;
    return Math.max(1.0, result);
}
// Sanitize inputs
export function sanitizeString(input) {
    return input.trim().replace(/[<>]/g, '');
}
// Date helpers
export function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
