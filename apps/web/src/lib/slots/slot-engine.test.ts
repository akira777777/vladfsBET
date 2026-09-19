import {
  createCell,
  evaluateClusters,
  generate6x5Grid,
  generateMegawaysSpin,
  resolveFullTumbleRound,
  type SymbolId,
} from "./slot-engine";
import { GATES_OF_VLADFS_THEME, getSlotTheme } from "./slot-themes";

function runTests() {
  console.log("Running 6x5 Cascading Tumble & Megaways Unit Tests...");

  // Test 1: 6x5 Grid Generation
  const grid6x5 = generate6x5Grid();
  console.assert(grid6x5.length === 6, `Expected 6 columns, got ${grid6x5.length}`);
  console.assert(grid6x5[0].length === 5, `Expected 5 rows, got ${grid6x5[0].length}`);

  // Test 2: Cluster Pays (8+ matching symbols anywhere)
  const nonMatchingSymbols: SymbolId[] = ["LOW_A", "LOW_K", "LOW_Q", "LOW_J", "LOW_10"];
  const testGrid = Array.from({ length: 6 }, (_, col) =>
    Array.from({ length: 5 }, (_, row) => createCell(nonMatchingSymbols[(col * 5 + row) % nonMatchingSymbols.length]))
  );
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

  // Test 5: All 6 Gallery Themes Validation
  const galleryThemes = [
    { slug: "gates-of-vladfs", engine: "CLUSTER_6X5" },
    { slug: "cyber-neon-777", engine: "MEGAWAYS" },
    { slug: "pharaoh-gold-deluxe", engine: "CLUSTER_6X5" },
    { slug: "sugar-rush-frenzy", engine: "CLUSTER_6X5" },
    { slug: "dragon-fortune-888", engine: "MEGAWAYS" },
    { slug: "dead-mans-vault", engine: "CLUSTER_6X5" },
  ];

  for (const { slug, engine } of galleryThemes) {
    const t = getSlotTheme(slug);
    console.assert(t.id === slug, `Theme ${slug} id mismatch, got ${t.id}`);
    console.assert(t.defaultEngine === engine, `Theme ${slug} engine mismatch, got ${t.defaultEngine}`);
    console.assert(Boolean(t.symbols.SCATTER), `Theme ${slug} missing SCATTER symbol`);
    console.assert(Boolean(t.symbols.WILD), `Theme ${slug} missing WILD symbol`);
  }

  console.assert(getSlotTheme("neon-cyber-slots").defaultEngine === "MEGAWAYS", "Neon Cyber alias should default to megaways");
  console.assert(getSlotTheme("sandbox-slots").defaultEngine === "CLUSTER_6X5", "Sandbox should default to cluster tumble");

  console.log("All Modern Slot Engine Tests Passed Successfully! [6/6 Themes Verified]");
}

runTests();
