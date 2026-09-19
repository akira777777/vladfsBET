import { describe, it, expect } from "vitest";
import {
  createCell,
  evaluateClusters,
  generate6x5Grid,
  generateMegawaysSpin,
  resolveFullTumbleRound,
  type SymbolId,
} from "./slot-engine";
import { GATES_OF_VLADFS_THEME, getSlotTheme } from "./slot-themes";

describe("Slot Engine — 6x5 Cascading Tumble & Megaways", () => {
  it("generates a valid 6×5 grid", () => {
    const grid = generate6x5Grid();
    expect(grid).toHaveLength(6);
    expect(grid[0]).toHaveLength(5);
    grid.forEach((col) =>
      col.forEach((cell) => {
        expect(cell.id).toBeTruthy();
        expect(cell.key).toBeTruthy();
      }),
    );
  });

  it("detects 8+ cluster hits and resolves shattered positions", () => {
    const nonMatching: SymbolId[] = ["LOW_A", "LOW_K", "LOW_Q", "LOW_J", "LOW_10"];
    const testGrid = Array.from({ length: 6 }, (_, col) =>
      Array.from({ length: 5 }, (_, row) =>
        createCell(nonMatching[(col * 5 + row) % nonMatching.length]),
      ),
    );
    // Place 8 HIGH_1 symbols
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 2; r++) {
        testGrid[c][r] = createCell("HIGH_1");
      }
    }

    const result = evaluateClusters(testGrid, 10.0, GATES_OF_VLADFS_THEME.symbols);
    expect(result.clusterHits.length).toBeGreaterThanOrEqual(1);
    expect(result.clusterHits[0].count).toBe(8);
    expect(result.shatteredPositions).toHaveLength(8);
  });

  it("resolves multiplier orbs into totalMultiplier and finalWinAmount", () => {
    const nonMatching: SymbolId[] = ["LOW_A", "LOW_K", "LOW_Q", "LOW_J", "LOW_10"];
    const testGrid = Array.from({ length: 6 }, (_, col) =>
      Array.from({ length: 5 }, (_, row) =>
        createCell(nonMatching[(col * 5 + row) % nonMatching.length]),
      ),
    );
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 2; r++) {
        testGrid[c][r] = createCell("HIGH_1");
      }
    }
    testGrid[5][0] = createCell("MULTIPLIER_ORB", 25);

    const round = resolveFullTumbleRound(testGrid, 10.0, GATES_OF_VLADFS_THEME.symbols);
    expect(round.totalMultiplier).toBeGreaterThanOrEqual(25);
    expect(round.finalWinAmount).toBeGreaterThan(0);
  });

  it("generates valid Megaways spins with 64–117,649 ways", () => {
    const mega = generateMegawaysSpin(10.0, GATES_OF_VLADFS_THEME.symbols);
    expect(mega.reelHeights).toHaveLength(6);
    expect(mega.totalWays).toBeGreaterThanOrEqual(64);
    expect(mega.totalWays).toBeLessThanOrEqual(117649);
  });

  it("validates all 6 gallery themes with correct engine defaults", () => {
    const gallery = [
      { slug: "gates-of-vladfs", engine: "CLUSTER_6X5" },
      { slug: "cyber-neon-777", engine: "MEGAWAYS" },
      { slug: "pharaoh-gold-deluxe", engine: "CLUSTER_6X5" },
      { slug: "sugar-rush-frenzy", engine: "CLUSTER_6X5" },
      { slug: "dragon-fortune-888", engine: "MEGAWAYS" },
      { slug: "dead-mans-vault", engine: "CLUSTER_6X5" },
    ] as const;

    for (const { slug, engine } of gallery) {
      const t = getSlotTheme(slug);
      expect(t.id).toBe(slug);
      expect(t.defaultEngine).toBe(engine);
      expect(t.symbols.SCATTER).toBeTruthy();
      expect(t.symbols.WILD).toBeTruthy();
    }
  });

  it("resolves theme aliases correctly", () => {
    expect(getSlotTheme("neon-cyber-slots").defaultEngine).toBe("MEGAWAYS");
    expect(getSlotTheme("sandbox-slots").defaultEngine).toBe("CLUSTER_6X5");
  });
});
