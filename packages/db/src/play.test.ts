import { afterAll, describe, expect, it } from "vitest";
import { registerPlayer } from "./auth";
import { getAvailableBalance } from "./ledger";
import { PlayError, playDemoGame } from "./play";
import { db } from "./test-helpers";
import { randomUUID } from "node:crypto";

async function demoPlayer() {
  return registerPlayer(db, {
    firstName: "Play",
    lastName: "Tester",
    email: `play-${randomUUID()}@vladfsbet.local`,
    password: "Correct-Horse-Battery-9",
    country: "ZZ",
    currency: "EUR",
    dateOfBirth: "1991-03-03",
    termsAccepted: true,
    privacyAccepted: true,
    rgAcknowledged: true,
  });
}

describe("playDemoGame", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("settles a losing demo round through the ledger", async () => {
    const { user } = await demoPlayer();
    const result = await playDemoGame(db, {
      userId: user.id,
      slug: "sandbox-slots",
      betAmount: "100",
      rollWin: () => false,
    });

    expect(result.mode).toBe("DEMO");
    expect(result.winAmount).toBe("0.00000000");
    expect(result.round.status).toBe("SETTLED");
    expect(await getAvailableBalance(db, user.id, "EUR")).toBe("900.00000000");
  });

  it("settles a winning demo round as 2x the stake", async () => {
    const { user } = await demoPlayer();
    const result = await playDemoGame(db, {
      userId: user.id,
      slug: "sandbox-roulette",
      betAmount: "100",
      rollWin: () => true,
    });

    expect(result.winAmount).toBe("200.00000000");
    expect(await getAvailableBalance(db, user.id, "EUR")).toBe("1100.00000000");
  });

  it("rejects a bet larger than available demo balance", async () => {
    const { user } = await demoPlayer();
    await expect(
      playDemoGame(db, {
        userId: user.id,
        slug: "sandbox-blackjack",
        betAmount: "5000",
        rollWin: () => false,
      }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_FUNDS" } satisfies Partial<PlayError>);
  });
});
