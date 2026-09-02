// Provably Fair and Mathematical Engine for VladfsBET Originals

export type PlinkoRisk = "LOW" | "MEDIUM" | "HIGH";

export const PLINKO_PAYOUTS: Record<number, Record<PlinkoRisk, number[]>> = {
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

export function getPlinkoMultipliers(rows: number, risk: PlinkoRisk): number[] {
  const rowConfig = PLINKO_PAYOUTS[rows] || PLINKO_PAYOUTS[16];
  return rowConfig[risk] || rowConfig.MEDIUM;
}

export function calculateMinesMultiplier(mineCount: number, revealedCount: number): number {
  if (revealedCount <= 0) return 1.0;
  const safeCount = 25 - mineCount;
  if (revealedCount > safeCount) return 0;
  let mult = 0.99;
  for (let i = 0; i < revealedCount; i++) {
    mult *= (25 - i) / (safeCount - i);
  }
  return Math.floor(mult * 100) / 100;
}

export function calculateDiceMultiplier(target: number, isRollUnder: boolean): { multiplier: number; winChance: number } {
  const winChance = isRollUnder ? target : 100 - target;
  const clampedWinChance = Math.max(0.01, Math.min(98.0, winChance));
  const multiplier = Math.floor((99.0 / clampedWinChance) * 10000) / 10000;
  return { multiplier, winChance: clampedWinChance };
}

export function rollLimbo(randFloat: number): number {
  if (randFloat >= 0.99) {
    return Math.min(1000000, Math.floor((99 / (1 - randFloat)) * 100) / 100);
  }
  return Math.max(1.0, Math.floor((99 / (100 - randFloat * 100)) * 100) / 100);
}

export type HiloCard = {
  suit: "♠" | "♥" | "♦" | "♣";
  rank: string;
  value: number;
};

export function getHiloOdds(currentCardValue: number): {
  higherMultiplier: number;
  lowerMultiplier: number;
  sameMultiplier: number;
  higherChance: number;
  lowerChance: number;
} {
  const totalRanks = 13;
  const rankIndex = currentCardValue - 2;
  const higherRanksCount = 12 - rankIndex + 1;
  const lowerRanksCount = rankIndex + 1;

  const higherChance = Math.max(0.0769, higherRanksCount / totalRanks);
  const lowerChance = Math.max(0.0769, lowerRanksCount / totalRanks);

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
