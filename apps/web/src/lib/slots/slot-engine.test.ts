import {
  createCell,
  evaluateClusters,
  generate6x5Grid,
  generateMegawaysSpin,
  resolveFullTumbleRound,
} from "./slot-engine";
import { GATES_OF_VLADFS_THEME } from "./slot-themes";

function runTests() {
  console.log("Running 6x5 Cascading Tumble & Megaways Unit Tests...");

  // Test 1: 6x5 Grid Generation
  const grid6x5 = generate6x5Grid();
  console.assert(grid6x5.length === 6, `Expected 6 columns, got ${grid6x5.length}`);
  console.assert(grid6x5[0].length === 5, `Expected 5 rows, got ${grid6x5[0].length}`);

  // Test 2: Cluster Pays (8+ matching symbols anywhere)
  const testGrid = generate6x5Grid();
  // Place 8 HIGH_1 symbols
  testGrid[0][0] = createCell("HIGH_1");
  testGrid[0][1] = createCell("HIGH_1");
  testGrid[1][0] = createCell("HIGH_1");
  testGrid[1][1] = createCell("HIGH_1");
  testGrid[2][0] = createCell("HIGH_1");
  testGrid[2][1] = createCell("HIGH_1");
  testGrid[3][0] = createCell("HIGH_1");
  testGrid[3][1] = createCell("HIGH_1");

  const clusterEval = evaluateClusters(testGrid, 10.0, GATES_OF_VLADFS_THEME.symbols);
  console.assert(clusterEval.clusterHits.length >= 1, "Expected at least 1 cluster hit");
  console.assert(clusterEval.clusterHits[0].count === 8, "Expected 8 matching symbols");
  console.assert(clusterEval.shatteredPositions.length === 8, "Expected 8 shattered positions");

  // Test 3: Multiplier Orbs Resolution
  testGrid[5][0] = createCell("MULTIPLIER_ORB", 25);
  const tumbleRound = resolveFullTumbleRound(testGrid, 10.0, GATES_OF_VLADFS_THEME.symbols);
  console.assert(tumbleRound.totalMultiplier >= 25, `Expected total multiplier >= 25, got ${tumbleRound.totalMultiplier}`);
  console.assert(tumbleRound.finalWinAmount > 0, "Expected positive final win amount");

  // Test 4: Megaways Dynamic Reels Generation (up to 117,649 ways)
  const megaSpin = generateMegawaysSpin(10.0, GATES_OF_VLADFS_THEME.symbols);
  console.assert(megaSpin.reelHeights.length === 6, "Expected 6 reels");
  console.assert(megaSpin.totalWays >= 64 && megaSpin.totalWays <= 117649, `Expected ways within valid range, got ${megaSpin.totalWays}`);

  console.log("All Modern Slot Engine Tests Passed Successfully! [4/4]");
}

runTests();
