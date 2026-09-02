export type SymbolId =
  | "WILD"
  | "SCATTER"
  | "MULTIPLIER_ORB"
  | "HIGH_1"
  | "HIGH_2"
  | "HIGH_3"
  | "HIGH_4"
  | "MED_1"
  | "MED_2"
  | "LOW_A"
  | "LOW_K"
  | "LOW_Q"
  | "LOW_J"
  | "LOW_10";

export interface SymbolDefinition {
  id: SymbolId;
  name: string;
  isWild?: boolean;
  isScatter?: boolean;
  isMultiplier?: boolean;
  isSpecial?: boolean;
  // Multipliers relative to line bet / base bet for 3, 4, 5 matches (or cluster 8-9, 10-11, 12+)
  payouts: {
    3: number;
    4: number;
    5: number;
    // Cluster tier multipliers (relative to total bet)
    cluster8?: number;
    cluster10?: number;
    cluster12?: number;
  };
  color: string;
  glowColor: string;
  description?: string;
}

export interface SymbolCell {
  id: SymbolId;
  multiplierValue?: number; // 2, 3, 5, 10, 25, 50, 100, 250, 500
  isWinning?: boolean;
  isExploding?: boolean;
  isNew?: boolean;
  key: string;
}

export type Grid = SymbolCell[][]; // [col][row]

export type GridMode = "CLUSTER_6X5" | "MEGAWAYS_DYNAMIC";

export interface ClusterHit {
  symbolId: SymbolId;
  count: number; // 8+ matching symbols
  winAmount: number;
  multiplier: number;
  positions: { col: number; row: number }[];
}

export interface PaylineHit {
  lineIndex: number;
  symbolId: SymbolId;
  matchCount: number;
  multiplier: number;
  winAmount: number;
  positions: { col: number; row: number }[];
}

export interface ScatterHit {
  count: number;
  winAmount: number;
  positions: { col: number; row: number }[];
  freeSpinsAwarded: number;
}

export interface MultiplierOrbHit {
  value: number;
  position: { col: number; row: number };
}

export interface TumbleStep {
  stepIndex: number;
  grid: Grid;
  clusterHits: ClusterHit[];
  scatterHit: ScatterHit | null;
  multiplierOrbs: MultiplierOrbHit[];
  stepWin: number;
  accumulatedStepWin: number;
  shatteredPositions: { col: number; row: number }[];
}

export interface TumbleRoundResult {
  initialGrid: Grid;
  finalGrid: Grid;
  tumbleSteps: TumbleStep[];
  totalBaseWin: number;
  totalMultiplier: number;
  finalWinAmount: number;
  isFreeSpinsTriggered: boolean;
  freeSpinsAwarded: number;
  isBigWin: boolean;
  isMegaWin: boolean;
  isUltraWin: boolean;
  isEpicWin: boolean;
}

export interface MegawaysSpinResult {
  grid: Grid;
  reelHeights: number[]; // 6 columns, each 2..7 rows
  totalWays: number;
  wayHits: {
    symbolId: SymbolId;
    matchCount: number;
    waysCount: number;
    winAmount: number;
    positions: { col: number; row: number }[];
  }[];
  scatterHit: ScatterHit | null;
  totalWin: number;
  isFreeSpinsTriggered: boolean;
  isBigWin: boolean;
  isMegaWin: boolean;
  isUltraWin: boolean;
  isEpicWin: boolean;
}

// 20 Standard Las Vegas Video Slot Paylines
export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [1, 0, 1, 2, 1],
  [1, 2, 1, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2],
  [2, 1, 1, 1, 0],
  [0, 1, 1, 1, 2],
  [1, 0, 1, 0, 1],
  [1, 2, 1, 2, 1],
  [0, 2, 0, 2, 0],
];

export const TOTAL_PAYLINES = 20;

// Standard Reel Weights
export const DEFAULT_SYMBOL_WEIGHTS: Record<SymbolId, number> = {
  MULTIPLIER_ORB: 3,
  SCATTER: 4,
  WILD: 6,
  HIGH_1: 8,
  HIGH_2: 10,
  HIGH_3: 12,
  HIGH_4: 14,
  MED_1: 18,
  MED_2: 20,
  LOW_A: 26,
  LOW_K: 28,
  LOW_Q: 30,
  LOW_J: 32,
  LOW_10: 34,
};

// Possible multiplier orb values & probability weights
export const MULTIPLIER_VALUES: { value: number; weight: number }[] = [
  { value: 2, weight: 35 },
  { value: 3, weight: 25 },
  { value: 5, weight: 18 },
  { value: 10, weight: 10 },
  { value: 25, weight: 6 },
  { value: 50, weight: 3 },
  { value: 100, weight: 2 },
  { value: 250, weight: 0.8 },
  { value: 500, weight: 0.2 },
];

export function pickRandomMultiplier(): number {
  const totalWeight = MULTIPLIER_VALUES.reduce((sum, m) => sum + m.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of MULTIPLIER_VALUES) {
    if (random < item.weight) {
      return item.value;
    }
    random -= item.weight;
  }
  return 2;
}

let cellKeyCounter = 0;
export function createCell(id: SymbolId, multiplierValue?: number): SymbolCell {
  cellKeyCounter++;
  return {
    id,
    multiplierValue: id === "MULTIPLIER_ORB" ? multiplierValue || pickRandomMultiplier() : undefined,
    key: `cell_${Date.now()}_${cellKeyCounter}_${Math.random().toString(36).substring(2, 7)}`,
  };
}

// -------------------------------------------------------------
// 1. 6x5 CLUSTER PAYS & CASCADING TUMBLE ENGINE
// -------------------------------------------------------------

export function generate6x5Grid(
  weights: Record<SymbolId, number> = DEFAULT_SYMBOL_WEIGHTS,
  forceFeature?: "FREE_SPINS" | "BIG_WIN" | "MULTIPLIER_BOMB" | "MEGA_JACKPOT",
): Grid {
  const symbolPool: SymbolId[] = [];
  (Object.keys(weights) as SymbolId[]).forEach((sym) => {
    const w = weights[sym] || 1;
    for (let i = 0; i < w; i++) {
      symbolPool.push(sym);
    }
  });

  const pick = (): SymbolId => symbolPool[Math.floor(Math.random() * symbolPool.length)];

  const grid: Grid = [];
  for (let col = 0; col < 6; col++) {
    const colCells: SymbolCell[] = [];
    for (let row = 0; row < 5; row++) {
      const sym = pick();
      colCells.push(createCell(sym));
    }
    grid.push(colCells);
  }

  // Feature Force Injectors
  if (forceFeature === "FREE_SPINS") {
    grid[0][1] = createCell("SCATTER");
    grid[2][0] = createCell("SCATTER");
    grid[4][3] = createCell("SCATTER");
    grid[5][2] = createCell("SCATTER");
  } else if (forceFeature === "MULTIPLIER_BOMB") {
    grid[1][1] = createCell("MULTIPLIER_ORB", 25);
    grid[4][2] = createCell("MULTIPLIER_ORB", 50);
    // Add winning cluster of HIGH_1
    for (let c = 0; c < 3; c++) {
      for (let r = 0; r < 3; r++) {
        grid[c][r] = createCell("HIGH_1");
      }
    }
  } else if (forceFeature === "BIG_WIN") {
    // 12 HIGH_1 symbols across grid
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 3; r++) {
        grid[c][r] = createCell("HIGH_1");
      }
    }
    grid[5][0] = createCell("MULTIPLIER_ORB", 10);
  } else if (forceFeature === "MEGA_JACKPOT") {
    for (let c = 0; c < 6; c++) {
      for (let r = 0; r < 5; r++) {
        grid[c][r] = createCell("HIGH_1");
      }
    }
    grid[0][0] = createCell("MULTIPLIER_ORB", 100);
    grid[5][4] = createCell("MULTIPLIER_ORB", 50);
  }

  return grid;
}

// Evaluate Cluster Wins (8+ matching anywhere on 6x5 grid)
export function evaluateClusters(
  grid: Grid,
  betAmount: number,
  symbolsMap: Record<SymbolId, SymbolDefinition>,
): {
  clusterHits: ClusterHit[];
  scatterHit: ScatterHit | null;
  multiplierOrbs: MultiplierOrbHit[];
  shatteredPositions: { col: number; row: number }[];
  stepWin: number;
} {
  const symbolCounts: Record<SymbolId, { count: number; positions: { col: number; row: number }[] }> = {} as any;
  const multiplierOrbs: MultiplierOrbHit[] = [];

  for (let col = 0; col < 6; col++) {
    for (let row = 0; row < 5; row++) {
      const cell = grid[col]?.[row];
      if (!cell) continue;

      if (cell.id === "MULTIPLIER_ORB") {
        multiplierOrbs.push({
          value: cell.multiplierValue || 2,
          position: { col, row },
        });
        continue;
      }

      if (!symbolCounts[cell.id]) {
        symbolCounts[cell.id] = { count: 0, positions: [] };
      }
      symbolCounts[cell.id].count++;
      symbolCounts[cell.id].positions.push({ col, row });
    }
  }

  const clusterHits: ClusterHit[] = [];
  const shatteredPositions: { col: number; row: number }[] = [];
  let stepWin = 0;

  // Check 8+ matches for standard symbols
  (Object.keys(symbolCounts) as SymbolId[]).forEach((symId) => {
    if (symId === "SCATTER" || symId === "MULTIPLIER_ORB") return;

    const data = symbolCounts[symId];
    if (data.count >= 8) {
      const def = symbolsMap[symId];
      // Payout tiers: 8-9, 10-11, 12+
      let payoutMult = 1.0;
      if (def?.payouts) {
        if (data.count >= 12) {
          payoutMult = def.payouts.cluster12 || def.payouts[5] * 2.5 || 10;
        } else if (data.count >= 10) {
          payoutMult = def.payouts.cluster10 || def.payouts[4] * 1.8 || 4;
        } else {
          payoutMult = def.payouts.cluster8 || def.payouts[3] * 1.2 || 1.5;
        }
      }

      const winAmount = betAmount * payoutMult;
      stepWin += winAmount;

      clusterHits.push({
        symbolId: symId,
        count: data.count,
        winAmount,
        multiplier: payoutMult,
        positions: data.positions,
      });

      data.positions.forEach((pos) => shatteredPositions.push(pos));
    }
  });

  // Evaluate Scatters (4+ Scatters on 6x5 grid trigger Free Spins!)
  let scatterHit: ScatterHit | null = null;
  const scatterData = symbolCounts["SCATTER"];
  if (scatterData && scatterData.count >= 4) {
    const freeSpins = scatterData.count >= 6 ? 20 : scatterData.count === 5 ? 15 : 10;
    const scatterMult = scatterData.count >= 6 ? 100 : scatterData.count === 5 ? 20 : 3;
    const winAmount = betAmount * scatterMult;
    stepWin += winAmount;

    scatterHit = {
      count: scatterData.count,
      winAmount,
      positions: scatterData.positions,
      freeSpinsAwarded: freeSpins,
    };
  }

  return {
    clusterHits,
    scatterHit,
    multiplierOrbs,
    shatteredPositions,
    stepWin,
  };
}

// Perform Tumble Drop: remove shattered symbols, apply gravity, fill top with new symbols
export function performTumbleDrop(
  currentGrid: Grid,
  shatteredPositions: { col: number; row: number }[],
  weights: Record<SymbolId, number> = DEFAULT_SYMBOL_WEIGHTS,
): Grid {
  const symbolPool: SymbolId[] = [];
  (Object.keys(weights) as SymbolId[]).forEach((sym) => {
    const w = weights[sym] || 1;
    for (let i = 0; i < w; i++) {
      symbolPool.push(sym);
    }
  });
  const pick = (): SymbolId => symbolPool[Math.floor(Math.random() * symbolPool.length)];

  const isShattered = (col: number, row: number) =>
    shatteredPositions.some((p) => p.col === col && p.row === row);

  const nextGrid: Grid = [];

  for (let col = 0; col < 6; col++) {
    const survivingCells: SymbolCell[] = [];
    for (let row = 0; row < 5; row++) {
      if (!isShattered(col, row)) {
        survivingCells.push({ ...currentGrid[col][row], isNew: false, isWinning: false });
      }
    }

    // Number of new cells to drop from top
    const missingCount = 5 - survivingCells.length;
    const newCells: SymbolCell[] = [];
    for (let i = 0; i < missingCount; i++) {
      const sym = pick();
      const cell = createCell(sym);
      cell.isNew = true;
      newCells.push(cell);
    }

    // New cells drop on top, surviving cells fall to bottom
    nextGrid.push([...newCells, ...survivingCells]);
  }

  return nextGrid;
}

// Resolve full multi-step Tumble Sequence until no more winning clusters form
export function resolveFullTumbleRound(
  initialGrid: Grid,
  betAmount: number,
  symbolsMap: Record<SymbolId, SymbolDefinition>,
  weights: Record<SymbolId, number> = DEFAULT_SYMBOL_WEIGHTS,
): TumbleRoundResult {
  const tumbleSteps: TumbleStep[] = [];
  let currentGrid = initialGrid;
  let accumulatedStepWin = 0;
  let totalBaseWin = 0;
  let allMultiplierOrbs: MultiplierOrbHit[] = [];
  let isFreeSpinsTriggered = false;
  let freeSpinsAwarded = 0;

  const maxTumbles = 15; // Safeguard limit
  let stepIndex = 0;

  while (stepIndex < maxTumbles) {
    const evalResult = evaluateClusters(currentGrid, betAmount, symbolsMap);

    // Collect multiplier orbs
    evalResult.multiplierOrbs.forEach((orb) => {
      if (!allMultiplierOrbs.some((o) => o.position.col === orb.position.col && o.position.row === orb.position.row)) {
        allMultiplierOrbs.push(orb);
      }
    });

    if (evalResult.scatterHit) {
      isFreeSpinsTriggered = true;
      freeSpinsAwarded = Math.max(freeSpinsAwarded, evalResult.scatterHit.freeSpinsAwarded);
    }

    accumulatedStepWin += evalResult.stepWin;
    totalBaseWin += evalResult.stepWin;

    tumbleSteps.push({
      stepIndex,
      grid: currentGrid,
      clusterHits: evalResult.clusterHits,
      scatterHit: evalResult.scatterHit,
      multiplierOrbs: evalResult.multiplierOrbs,
      stepWin: evalResult.stepWin,
      accumulatedStepWin,
      shatteredPositions: evalResult.shatteredPositions,
    });

    // If no winning clusters, tumble sequence finishes!
    if (evalResult.clusterHits.length === 0) {
      break;
    }

    // Drop new symbols
    currentGrid = performTumbleDrop(currentGrid, evalResult.shatteredPositions, weights);
    stepIndex++;
  }

  // Calculate combined multiplier from all charged orbs
  const sumMultiplierOrbs = allMultiplierOrbs.reduce((sum, orb) => sum + orb.value, 0);
  const totalMultiplier = sumMultiplierOrbs > 0 ? sumMultiplierOrbs : 1;
  const finalWinAmount = totalBaseWin * totalMultiplier;

  const winRatio = finalWinAmount / (betAmount || 1);
  const isBigWin = winRatio >= 10 && winRatio < 25;
  const isMegaWin = winRatio >= 25 && winRatio < 50;
  const isUltraWin = winRatio >= 50 && winRatio < 100;
  const isEpicWin = winRatio >= 100;

  return {
    initialGrid,
    finalGrid: currentGrid,
    tumbleSteps,
    totalBaseWin,
    totalMultiplier,
    finalWinAmount,
    isFreeSpinsTriggered,
    freeSpinsAwarded,
    isBigWin,
    isMegaWin,
    isUltraWin,
    isEpicWin,
  };
}

// -------------------------------------------------------------
// 2. DYNAMIC REEL HEIGHTS / MEGAWAYS (Up to 117,649 Ways)
// -------------------------------------------------------------

export function generateMegawaysSpin(
  betAmount: number,
  symbolsMap: Record<SymbolId, SymbolDefinition>,
  weights: Record<SymbolId, number> = DEFAULT_SYMBOL_WEIGHTS,
): MegawaysSpinResult {
  const symbolPool: SymbolId[] = [];
  (Object.keys(weights) as SymbolId[]).forEach((sym) => {
    if (sym === "MULTIPLIER_ORB") return; // Multiplier orbs are exclusive to tumble mode
    const w = weights[sym] || 1;
    for (let i = 0; i < w; i++) {
      symbolPool.push(sym);
    }
  });
  const pick = (): SymbolId => symbolPool[Math.floor(Math.random() * symbolPool.length)];

  // 6 reels with dynamic height between 2 and 7 symbols
  const reelHeights: number[] = [
    Math.floor(Math.random() * 6) + 2,
    Math.floor(Math.random() * 6) + 2,
    Math.floor(Math.random() * 6) + 2,
    Math.floor(Math.random() * 6) + 2,
    Math.floor(Math.random() * 6) + 2,
    Math.floor(Math.random() * 6) + 2,
  ];

  const totalWays = reelHeights.reduce((prod, h) => prod * h, 1);

  const grid: Grid = [];
  for (let col = 0; col < 6; col++) {
    const colCells: SymbolCell[] = [];
    for (let row = 0; row < reelHeights[col]; row++) {
      colCells.push(createCell(pick()));
    }
    grid.push(colCells);
  }

  // Evaluate Adjacent Ways (Left to Right)
  const wayHits: MegawaysSpinResult["wayHits"] = [];
  let totalWin = 0;

  const candidateSymbols: SymbolId[] = ["HIGH_1", "HIGH_2", "HIGH_3", "HIGH_4", "MED_1", "MED_2", "LOW_A", "LOW_K", "LOW_Q", "LOW_J", "LOW_10"];

  candidateSymbols.forEach((sym) => {
    let matchCount = 0;
    const waysPerReel: number[] = [];
    const positions: { col: number; row: number }[] = [];

    for (let col = 0; col < 6; col++) {
      let matchingInCol = 0;
      for (let row = 0; row < reelHeights[col]; row++) {
        const cell = grid[col][row];
        if (cell.id === sym || cell.id === "WILD") {
          matchingInCol++;
          positions.push({ col, row });
        }
      }

      if (matchingInCol > 0) {
        matchCount++;
        waysPerReel.push(matchingInCol);
      } else {
        break; // Chain broken
      }
    }

    if (matchCount >= 3) {
      const def = symbolsMap[sym];
      const waysCount = waysPerReel.reduce((p, c) => p * c, 1);
      const baseMult = matchCount === 6 ? def?.payouts[5] * 1.5 : matchCount === 5 ? def?.payouts[5] : matchCount === 4 ? def?.payouts[4] : def?.payouts[3];
      const winAmount = (betAmount / 20) * (baseMult || 1) * waysCount;
      totalWin += winAmount;

      wayHits.push({
        symbolId: sym,
        matchCount,
        waysCount,
        winAmount,
        positions,
      });
    }
  });

  // Evaluate Scatters in Megaways
  let scatterCount = 0;
  const scatterPositions: { col: number; row: number }[] = [];
  for (let c = 0; c < 6; c++) {
    for (let r = 0; r < reelHeights[c]; r++) {
      if (grid[c][r].id === "SCATTER") {
        scatterCount++;
        scatterPositions.push({ col: c, row: r });
      }
    }
  }

  let scatterHit: ScatterHit | null = null;
  let isFreeSpinsTriggered = false;
  if (scatterCount >= 4) {
    isFreeSpinsTriggered = true;
    scatterHit = {
      count: scatterCount,
      winAmount: betAmount * (scatterCount >= 6 ? 100 : scatterCount === 5 ? 25 : 5),
      positions: scatterPositions,
      freeSpinsAwarded: scatterCount >= 6 ? 20 : scatterCount === 5 ? 15 : 12,
    };
    totalWin += scatterHit.winAmount;
  }

  const winRatio = totalWin / (betAmount || 1);
  return {
    grid,
    reelHeights,
    totalWays,
    wayHits,
    scatterHit,
    totalWin,
    isFreeSpinsTriggered,
    isBigWin: winRatio >= 10 && winRatio < 25,
    isMegaWin: winRatio >= 25 && winRatio < 50,
    isUltraWin: winRatio >= 50 && winRatio < 100,
    isEpicWin: winRatio >= 100,
  };
}

// Reel strip generation for smooth animations
export function generateReelStrip(
  targetColSymbols: SymbolId[] = ["HIGH_1", "HIGH_2", "HIGH_3"],
  stripLength = 30,
  weights: Record<SymbolId, number> = DEFAULT_SYMBOL_WEIGHTS,
): SymbolId[] {
  const symbolPool: SymbolId[] = [];
  (Object.keys(weights) as SymbolId[]).forEach((sym) => {
    const w = weights[sym] || 1;
    for (let i = 0; i < w; i++) {
      symbolPool.push(sym);
    }
  });
  const pick = (): SymbolId => symbolPool[Math.floor(Math.random() * symbolPool.length)];

  const strip: SymbolId[] = [];
  for (let i = 0; i < stripLength - 3; i++) {
    strip.push(pick());
  }
  strip.push(targetColSymbols[0] || "HIGH_1", targetColSymbols[1] || "HIGH_2", targetColSymbols[2] || "HIGH_3");
  return strip;
}
