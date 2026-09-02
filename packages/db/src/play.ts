import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { LedgerError, postJournal } from "./ledger";
import { checkPlayerEligibleToPlay, checkWagerLimit } from "./rg";
import { processBonusWagering, recordVipWager } from "./bonuses";

export class PlayError extends Error {
  constructor(
    public readonly code:
      | "GAME_NOT_FOUND"
      | "INSUFFICIENT_FUNDS"
      | "INVALID_BET"
      | "ACCOUNT_BLOCKED"
      | "LIMIT_EXCEEDED",
    message: string,
  ) {
    super(message);
    this.name = "PlayError";
  }
}

export type PlayDemoInput = {
  userId: string;
  slug: string;
  betAmount: Prisma.Decimal | string | number;
  gameData?: Record<string, unknown>;
  rollWin?: () => boolean;
};

function money(value: Prisma.Decimal): string {
  return value.toFixed(8);
}

// Provably Fair Calculation helpers
function generateProvablyFair(serverSeed: string, clientSeed: string, nonce: number) {
  const { createHmac, createHash } = require("node:crypto");
  const serverSeedHash = createHash("sha256").update(serverSeed).digest("hex");
  const hmac = createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}`).digest("hex");
  const intVal = parseInt(hmac.substring(0, 8), 16);
  const floatVal = intVal / 0x100000000;
  return { serverSeedHash, floatVal, hmac };
}

// Slot symbols definition
const SLOT_SYMBOLS = ["🍒", "🍋", "🍇", "🔔", "⭐", "💎", "7️⃣", "👑"];
const PAYTABLE: Record<string, number> = {
  "👑": 50,
  "7️⃣": 25,
  "💎": 15,
  "⭐": 10,
  "🔔": 5,
  "🍇": 3,
  "🍋": 2,
  "🍒": 1.5,
};

function simulateSlots(randFloat: number) {
  const reels: string[][] = [];
  for (let r = 0; r < 5; r++) {
    const reel: string[] = [];
    for (let row = 0; row < 3; row++) {
      const idx = Math.floor(
        (randFloat * 1000 + r * 13 + row * 7) % SLOT_SYMBOLS.length,
      );
      reel.push(SLOT_SYMBOLS[idx]);
    }
    reels.push(reel);
  }

  // Check middle row win
  const middle = reels.map((col) => col[1]);
  let matches = 1;
  const firstSym = middle[0];
  for (let i = 1; i < 5; i++) {
    if (middle[i] === firstSym || middle[i] === "👑") {
      matches++;
    } else {
      break;
    }
  }

  let multiplier = 0;
  if (matches >= 3) {
    multiplier = (PAYTABLE[firstSym] || 2) * (matches === 5 ? 5 : matches === 4 ? 2 : 1);
  } else if (randFloat < 0.35) {
    // 35% hit frequency
    multiplier = 1.5;
  }

  return {
    reels,
    multiplier,
    won: multiplier > 0,
    freeSpinsWon: matches === 5 ? 10 : 0,
  };
}

function simulateRoulette(betDetails: Record<string, unknown> | undefined, randFloat: number) {
  const winningNumber = Math.floor(randFloat * 37); // 0..36
  const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(winningNumber);
  const isBlack = winningNumber !== 0 && !isRed;
  const isEven = winningNumber !== 0 && winningNumber % 2 === 0;

  const betType = (betDetails?.betType as string) ?? "RED";
  const selectedNumber = betDetails?.number as number | undefined;

  let multiplier = 0;
  if (betType === "STRAIGHT" && selectedNumber === winningNumber) {
    multiplier = 36;
  } else if (betType === "RED" && isRed) {
    multiplier = 2;
  } else if (betType === "BLACK" && isBlack) {
    multiplier = 2;
  } else if (betType === "EVEN" && isEven) {
    multiplier = 2;
  } else if (betType === "ODD" && !isEven && winningNumber !== 0) {
    multiplier = 2;
  }

  return {
    winningNumber,
    color: winningNumber === 0 ? "GREEN" : isRed ? "RED" : "BLACK",
    multiplier,
    won: multiplier > 0,
  };
}

function simulateBlackjack(randFloat: number) {
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const getCard = (seedOffset: number) => {
    const idx = Math.floor((randFloat * 1000 + seedOffset) % ranks.length);
    return ranks[idx];
  };

  const playerCards = [getCard(1), getCard(2)];
  const dealerCards = [getCard(3), getCard(4)];

  // Basic dealer outcome
  const won = randFloat < 0.48; // ~48% win probability in single round demo
  const isBlackjack = won && randFloat < 0.05;
  const multiplier = isBlackjack ? 2.5 : won ? 2.0 : 0;

  return {
    playerCards,
    dealerCards,
    isBlackjack,
    multiplier,
    won,
  };
}

function simulateCrash(gameData: Record<string, unknown> | undefined, serverSeed: string, clientSeed: string, nonce: number) {
  const { createHmac } = require("node:crypto");
  const hash = createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}`).digest("hex");
  const intVal = parseInt(hash.substring(0, 8), 16);
  const randFloat = intVal / 0x100000000;

  // Standard crash curve with 1% instant crash
  let crashPoint = 1.0;
  if (randFloat >= 0.01) {
    crashPoint = Math.max(1.0, Math.floor((99 / (100 - randFloat * 99)) * 100) / 100);
  }
  const targetMultiplier = typeof gameData?.targetMultiplier === "number" ? gameData.targetMultiplier : 1.5;
  const won = targetMultiplier <= crashPoint;
  const multiplier = won ? targetMultiplier : 0;

  return {
    crashPoint,
    cashedOutAt: targetMultiplier,
    multiplier,
    won,
  };
}

const PLINKO_PAYOUT_TABLE: Record<number, Record<"LOW" | "MEDIUM" | "HIGH", number[]>> = {
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

function simulatePlinko(gameData: Record<string, unknown> | undefined, serverSeed: string, clientSeed: string, nonce: number) {
  const { createHmac } = require("node:crypto");
  const rows = typeof gameData?.rows === "number" ? Math.min(16, Math.max(8, gameData.rows)) : 16;
  const risk = (["LOW", "MEDIUM", "HIGH"].includes(gameData?.risk as string) ? gameData?.risk : "MEDIUM") as "LOW" | "MEDIUM" | "HIGH";
  
  const path: number[] = [];
  let rightMoves = 0;
  for (let i = 0; i < rows; i++) {
    const hash = createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}:${i}`).digest("hex");
    const val = parseInt(hash.substring(0, 8), 16) / 0x100000000;
    const dir = val >= 0.5 ? 1 : 0;
    path.push(dir);
    if (dir === 1) rightMoves++;
  }

  const binIndex = rightMoves;
  const multipliers = PLINKO_PAYOUT_TABLE[rows]?.[risk] || PLINKO_PAYOUT_TABLE[16].MEDIUM;
  const multiplier = multipliers[binIndex] ?? 1.0;

  return {
    rows,
    risk,
    path,
    binIndex,
    multiplier,
    won: multiplier > 0,
  };
}

function calculateMinesMult(mineCount: number, revealedCount: number): number {
  if (revealedCount <= 0) return 1.0;
  const safeCount = 25 - mineCount;
  if (revealedCount > safeCount) return 0;
  let mult = 0.99;
  for (let i = 0; i < revealedCount; i++) {
    mult *= (25 - i) / (safeCount - i);
  }
  return Math.floor(mult * 100) / 100;
}

function simulateMines(gameData: Record<string, unknown> | undefined, serverSeed: string, clientSeed: string, nonce: number) {
  const { createHmac } = require("node:crypto");
  const mineCount = typeof gameData?.mineCount === "number" ? Math.min(24, Math.max(1, gameData.mineCount)) : 3;
  const revealedTiles = Array.isArray(gameData?.revealedTiles) ? (gameData?.revealedTiles as number[]) : [];
  
  // Deterministic shuffle of 25 tiles
  const totalTiles = 25;
  const tiles = Array.from({ length: totalTiles }, (_, i) => i);
  for (let i = totalTiles - 1; i > 0; i--) {
    const hash = createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}:${i}`).digest("hex");
    const float = parseInt(hash.substring(0, 8), 16) / 0x100000000;
    const j = Math.floor(float * (i + 1));
    const temp = tiles[i];
    tiles[i] = tiles[j];
    tiles[j] = temp;
  }

  const minePositions = tiles.slice(0, mineCount).sort((a, b) => a - b);
  const hitMine = revealedTiles.some((tile) => minePositions.includes(tile));
  let multiplier = 0;
  let won = false;

  if (hitMine) {
    multiplier = 0;
    won = false;
  } else if (revealedTiles.length > 0) {
    multiplier = calculateMinesMult(mineCount, revealedTiles.length);
    won = multiplier > 0;
  }

  return {
    mineCount,
    revealedTiles,
    minePositions,
    hitMine,
    multiplier,
    won,
  };
}

function simulateDice(gameData: Record<string, unknown> | undefined, randFloat: number) {
  const target = typeof gameData?.target === "number" ? Math.min(98, Math.max(1, gameData.target)) : 50;
  const isRollUnder = gameData?.isRollUnder !== false;
  const rolledNumber = Math.floor(randFloat * 10000) / 100; // 0.00 to 99.99
  const winChance = isRollUnder ? target : 100 - target;
  const clampedWinChance = Math.max(0.01, Math.min(98.0, winChance));
  const targetMultiplier = Math.floor((99.0 / clampedWinChance) * 10000) / 10000;
  const won = isRollUnder ? rolledNumber < target : rolledNumber > target;
  const multiplier = won ? targetMultiplier : 0;

  return {
    target,
    isRollUnder,
    rolledNumber,
    winChance: clampedWinChance,
    won,
    multiplier,
  };
}

function simulateLimbo(gameData: Record<string, unknown> | undefined, randFloat: number) {
  const targetMultiplier = typeof gameData?.targetMultiplier === "number" ? Math.min(1000000, Math.max(1.01, gameData.targetMultiplier)) : 2.0;
  let rolledMultiplier = 1.0;
  if (randFloat >= 0.99) {
    rolledMultiplier = Math.min(1000000, Math.floor((99 / (1 - randFloat)) * 100) / 100);
  } else {
    rolledMultiplier = Math.max(1.0, Math.floor((99 / (100 - randFloat * 100)) * 100) / 100);
  }
  const won = rolledMultiplier >= targetMultiplier;
  const multiplier = won ? targetMultiplier : 0;

  return {
    targetMultiplier,
    rolledMultiplier,
    won,
    multiplier,
  };
}

function simulateHilo(gameData: Record<string, unknown> | undefined, randFloat: number) {
  const currentCardValue = typeof gameData?.currentCardValue === "number" ? gameData.currentCardValue : 7;
  const guess = (gameData?.guess as "HIGHER" | "LOWER" | "SAME" | "CASHOUT") || "HIGHER";
  const accumulatedMultiplier = typeof gameData?.accumulatedMultiplier === "number" ? gameData.accumulatedMultiplier : 1.0;
  
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const suits = ["♠", "♥", "♦", "♣"];
  const nextRankIdx = Math.floor(randFloat * ranks.length);
  const nextSuitIdx = Math.floor((randFloat * 1000) % suits.length);
  const nextCard = {
    rank: ranks[nextRankIdx],
    suit: suits[nextSuitIdx],
    value: nextRankIdx + 2,
  };

  const rankIdx = currentCardValue - 2;
  const higherChance = Math.max(0.0769, (13 - rankIdx) / 13);
  const lowerChance = Math.max(0.0769, (rankIdx + 1) / 13);
  const higherMult = Math.floor((0.985 / higherChance) * 100) / 100;
  const lowerMult = Math.floor((0.985 / lowerChance) * 100) / 100;

  let won = false;
  let multiplier = 0;

  if (guess === "CASHOUT") {
    won = true;
    multiplier = accumulatedMultiplier;
  } else if (guess === "HIGHER" && nextCard.value >= currentCardValue) {
    won = true;
    multiplier = Math.floor(accumulatedMultiplier * higherMult * 100) / 100;
  } else if (guess === "LOWER" && nextCard.value <= currentCardValue) {
    won = true;
    multiplier = Math.floor(accumulatedMultiplier * lowerMult * 100) / 100;
  } else if (guess === "SAME" && nextCard.value === currentCardValue) {
    won = true;
    multiplier = Math.floor(accumulatedMultiplier * 12.5 * 100) / 100;
  }

  return {
    currentCardValue,
    nextCard,
    guess,
    won,
    multiplier: won ? multiplier : 0,
    roundMultiplier: guess === "HIGHER" ? higherMult : guess === "LOWER" ? lowerMult : 12.5,
  };
}

export async function playDemoGame(db: PrismaClient, input: PlayDemoInput) {
  const bet = new Prisma.Decimal(input.betAmount);
  if (bet.lte(0)) {
    throw new PlayError("INVALID_BET", "Bet must be greater than zero");
  }

  // 1. Check Responsible Gaming Status & Limits
  await checkPlayerEligibleToPlay(db, input.userId);
  await checkWagerLimit(db, input.userId, bet);

  const user = await db.user.findUniqueOrThrow({ where: { id: input.userId } });
  const game = await db.game.findUnique({
    where: { slug: input.slug },
    include: { provider: true },
  });
  if (!game || !game.active || !game.demoAvailable) {
    throw new PlayError("GAME_NOT_FOUND", "Demo game is not available");
  }

  const session = await db.gameSession.create({
    data: {
      userId: user.id,
      gameId: game.id,
      providerId: game.providerId,
      mode: "DEMO",
      status: "OPEN",
      currency: user.currency,
    },
  });

  const roundId = randomUUID();
  const providerTxId = `demo:${roundId}`;

  // 2. Post Ledger Debit for Bet
  try {
    await postJournal(db, {
      userId: user.id,
      type: "BET",
      currency: user.currency,
      idempotencyKey: `play:${roundId}:bet`,
      amount: bet,
      referenceType: "game_round",
      referenceId: roundId,
      memo: `Demo bet ${game.slug}`,
      lines: [
        { owner: "player", accountType: "AVAILABLE", direction: "DEBIT", amount: bet },
        { owner: "house", accountType: "AVAILABLE", direction: "CREDIT", amount: bet },
      ],
    });
  } catch (error) {
    await db.gameSession.update({
      where: { id: session.id },
      data: { status: "CLOSED", closedAt: new Date() },
    });
    if (error instanceof LedgerError && error.code === "INSUFFICIENT_FUNDS") {
      throw new PlayError("INSUFFICIENT_FUNDS", error.message);
    }
    throw error;
  }

  // 3. Provably Fair Calculation
  const serverSeed = randomBytes(32).toString("hex");
  const clientSeed = (input.gameData?.clientSeed as string) || randomBytes(16).toString("hex");
  const nonce = Date.now();
  const pf = generateProvablyFair(serverSeed, clientSeed, nonce);

  // 4. Game Execution Simulation
  let gameResult: Record<string, unknown> = {};
  let multiplier = 0;

  const slug = game.slug.toLowerCase();

  if (input.rollWin) {
    const won = input.rollWin();
    multiplier = won ? 2.0 : 0;
    gameResult = { won, multiplier };
  } else if (slug.includes("plinko")) {
    const sim = simulatePlinko(input.gameData, serverSeed, clientSeed, nonce);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else if (slug.includes("mines")) {
    const sim = simulateMines(input.gameData, serverSeed, clientSeed, nonce);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else if (slug.includes("dice")) {
    const sim = simulateDice(input.gameData, pf.floatVal);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else if (slug.includes("limbo")) {
    const sim = simulateLimbo(input.gameData, pf.floatVal);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else if (slug.includes("hilo")) {
    const sim = simulateHilo(input.gameData, pf.floatVal);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else if (game.category === "SLOTS") {
    const sim = simulateSlots(pf.floatVal);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else if (game.category === "ROULETTE") {
    const sim = simulateRoulette(input.gameData, pf.floatVal);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else if (game.category === "BLACKJACK") {
    const sim = simulateBlackjack(pf.floatVal);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else if (game.category === "CRASH" || slug.includes("crash") || slug.includes("spaceman") || slug.includes("aero")) {
    const sim = simulateCrash(input.gameData, serverSeed, clientSeed, nonce);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else {
    // Default fair casino outcome (~45% hit rate)
    const won = pf.floatVal < 0.45;
    multiplier = won ? 2.0 : 0;
    gameResult = { won, multiplier, outcome: pf.floatVal };
  }

  const win = bet.mul(multiplier).toDecimalPlaces(8, Prisma.Decimal.ROUND_HALF_UP);

  // 5. Post Ledger Credit for Win (if any)
  if (win.gt(0)) {
    await postJournal(db, {
      userId: user.id,
      type: "WIN",
      currency: user.currency,
      idempotencyKey: `play:${roundId}:win`,
      amount: win,
      referenceType: "game_round",
      referenceId: roundId,
      memo: `Demo win ${game.slug}`,
      lines: [
        { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount: win },
        { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount: win },
      ],
    });
  }

  // 6. Record Game Round
  const round = await db.gameRound.create({
    data: {
      id: roundId,
      userId: user.id,
      gameId: game.id,
      providerId: game.providerId,
      sessionId: session.id,
      providerTxId,
      status: "SETTLED",
      currency: user.currency,
      betAmount: bet,
      winAmount: win,
      result: {
        demo: true,
        ...gameResult,
        note: "Sandbox provably fair RNG outcome.",
      },
      verification: {
        serverSeedHash: pf.serverSeedHash,
        clientSeed,
        nonce,
      },
      settledAt: new Date(),
    },
  });

  await db.gameSession.update({
    where: { id: session.id },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  // 7. Process VIP & Bonus Wagering
  await Promise.all([
    recordVipWager(db, user.id, bet).catch(() => {}),
    processBonusWagering(db, user.id, bet).catch(() => {}),
  ]);

  return {
    mode: "DEMO" as const,
    game: { slug: game.slug, title: game.title, category: game.category },
    betAmount: money(bet),
    winAmount: money(win),
    multiplier,
    round,
    gameResult,
    provablyFair: {
      serverSeedHash: pf.serverSeedHash,
      clientSeed,
      nonce,
    },
  };
}
