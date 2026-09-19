import { describe, it, expect } from "vitest";
import {
  getPlinkoMultipliers,
  calculateMinesMultiplier,
  calculateDiceMultiplier,
  rollLimbo,
  getHiloOdds,
} from "./provably-fair";

describe("Provably Fair Originals Suite", () => {
  it("verifies Plinko multiplier bins & payout matrix for rows 8-16", () => {
    for (let rows = 8; rows <= 16; rows++) {
      const low = getPlinkoMultipliers(rows, "LOW");
      const med = getPlinkoMultipliers(rows, "MEDIUM");
      const high = getPlinkoMultipliers(rows, "HIGH");

      expect(low.length).toBe(rows + 1);
      expect(med.length).toBe(rows + 1);
      expect(high.length).toBe(rows + 1);
      expect(high[0]).toBeGreaterThan(1.0);
      expect(high[high.length - 1]).toBeGreaterThan(1.0);
    }
  });

  it("verifies Mines combinatorics & monotonic multiplier growth", () => {
    const mult1 = calculateMinesMultiplier(3, 1);
    const mult3 = calculateMinesMultiplier(3, 3);
    const mult5 = calculateMinesMultiplier(3, 5);

    expect(mult1).toBeGreaterThan(1.0);
    expect(mult3).toBeGreaterThan(mult1);
    expect(mult5).toBeGreaterThan(mult3);
  });

  it("verifies Quantum Dice multipliers & win chances", () => {
    const dice50Under = calculateDiceMultiplier(50, true);

    expect(Math.abs(dice50Under.multiplier - 1.98)).toBeLessThanOrEqual(0.01);
    expect(dice50Under.winChance).toBe(50);
  });

  it("verifies Limbo multiplier distribution", () => {
    const limboLow = rollLimbo(0.1);
    const limboHigh = rollLimbo(0.995);

    expect(limboLow).toBeGreaterThanOrEqual(1.0);
    expect(limboHigh).toBeGreaterThan(10.0);
  });

  it("verifies Hilo dynamic card odds", () => {
    const hiloAce = getHiloOdds(14); // Ace high
    const hiloTwo = getHiloOdds(2);  // Two low

    expect(hiloAce.lowerMultiplier).toBeLessThan(hiloAce.higherMultiplier);
    expect(hiloTwo.higherMultiplier).toBeLessThan(hiloTwo.lowerMultiplier);
  });
});
