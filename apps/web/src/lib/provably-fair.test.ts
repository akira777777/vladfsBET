import {
  PLINKO_PAYOUTS,
  getPlinkoMultipliers,
  calculateMinesMultiplier,
  calculateDiceMultiplier,
  rollLimbo,
  getHiloOdds,
} from "./provably-fair";

console.log("🎲 Running Provably Fair Originals Suite Tests...\n");

// 1. Plinko Tests
console.log("1. Testing Plinko Multiplier Bins & Payout Matrix...");
for (let rows = 8; rows <= 16; rows++) {
  const low = getPlinkoMultipliers(rows, "LOW");
  const med = getPlinkoMultipliers(rows, "MEDIUM");
  const high = getPlinkoMultipliers(rows, "HIGH");

  if (low.length !== rows + 1 || med.length !== rows + 1 || high.length !== rows + 1) {
    throw new Error(`Plinko row ${rows} bin length mismatch`);
  }
  if (high[0] <= 1.0 || high[high.length - 1] <= 1.0) {
    throw new Error(`Plinko high risk edge bin payout error for row ${rows}`);
  }
}
console.log("  ✓ Plinko 8-16 rows payout matrix verified.");

// 2. Mines Combinatorics Tests
console.log("2. Testing Mines Combinatorics & Multiplier Growth...");
const mult1 = calculateMinesMultiplier(3, 1);
const mult3 = calculateMinesMultiplier(3, 3);
const mult5 = calculateMinesMultiplier(3, 5);

if (mult1 <= 1.0 || mult3 <= mult1 || mult5 <= mult3) {
  throw new Error(`Mines multiplier should monotonically increase with revealed gems`);
}
console.log(`  ✓ 3 Mines: 1st gem=${mult1}x, 3rd gem=${mult3}x, 5th gem=${mult5}x.`);

// 3. Dice Math Tests
console.log("3. Testing Quantum Dice Multipliers & Win Chances...");
const dice50Under = calculateDiceMultiplier(50, true);
const dice25Over = calculateDiceMultiplier(75, false);

if (Math.abs(dice50Under.multiplier - 1.98) > 0.01) {
  throw new Error(`Dice 50% multiplier should be 1.98x, got ${dice50Under.multiplier}`);
}
if (dice50Under.winChance !== 50) {
  throw new Error(`Dice win chance should be 50%, got ${dice50Under.winChance}`);
}
console.log(`  ✓ Dice 50/50 roll: Multiplier=${dice50Under.multiplier}x, Win Chance=${dice50Under.winChance}%`);

// 4. Limbo Distribution Tests
console.log("4. Testing Limbo Multiplier Distribution...");
const limboLow = rollLimbo(0.1);
const limboHigh = rollLimbo(0.995);

if (limboLow < 1.0) throw new Error("Limbo should be at least 1.0x");
if (limboHigh <= 10.0) throw new Error("Limbo high percentile should yield high multiplier");
console.log(`  ✓ Limbo low roll=${limboLow}x, high roll=${limboHigh}x`);

// 5. Hilo Probability Tests
console.log("5. Testing Hilo Dynamic Card Odds...");
const hiloAce = getHiloOdds(14); // Ace high
const hiloTwo = getHiloOdds(2);  // Two low
const hiloSeven = getHiloOdds(7);// Seven mid

if (hiloAce.lowerMultiplier >= hiloAce.higherMultiplier) {
  throw new Error("Lowering on an Ace should have higher win probability / lower payout multiplier");
}
if (hiloTwo.higherMultiplier >= hiloTwo.lowerMultiplier) {
  throw new Error("Higher on a 2 should have higher win probability / lower payout multiplier");
}
console.log(`  ✓ Hilo Ace: Lower=${hiloAce.lowerMultiplier}x (${hiloAce.lowerChance}%), Higher=${hiloAce.higherMultiplier}x (${hiloAce.higherChance}%)`);
console.log(`  ✓ Hilo 2: Higher=${hiloTwo.higherMultiplier}x (${hiloTwo.higherChance}%), Lower=${hiloTwo.lowerMultiplier}x (${hiloTwo.lowerChance}%)`);

console.log("\n✅ ALL PROVABLY FAIR ORIGINALS TESTS PASSED SUCCESSFULLY! [5/5]");
