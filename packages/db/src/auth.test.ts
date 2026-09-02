import { afterAll, describe, expect, it } from "vitest";
import { AuthError, getSessionUser, loginPlayer, registerPlayer } from "./auth";
import { getAvailableBalance } from "./ledger";
import { db } from "./test-helpers";
import { randomUUID } from "node:crypto";

function adultInput(overrides: Record<string, unknown> = {}) {
  return {
    firstName: "Ada",
    lastName: "Lovelace",
    email: `ada-${randomUUID()}@vladfsbet.local`,
    password: "Correct-Horse-Battery-9",
    country: "ZZ",
    currency: "EUR",
    dateOfBirth: "1990-05-10",
    termsAccepted: true,
    privacyAccepted: true,
    rgAcknowledged: true,
    ...overrides,
  };
}

describe("auth", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("rejects a player under the jurisdiction minimum age", async () => {
    await expect(
      registerPlayer(db, adultInput({ dateOfBirth: "2015-01-01" })),
    ).rejects.toMatchObject({ code: "UNDERAGE" } satisfies Partial<AuthError>);
  });

  it("rejects duplicate email", async () => {
    const input = adultInput();
    await registerPlayer(db, input);
    await expect(registerPlayer(db, { ...input, email: input.email })).rejects.toMatchObject({
      code: "EMAIL_TAKEN",
    });
  });

  it("registers an adult, opens wallets, and credits demo balance via the ledger", async () => {
    const result = await registerPlayer(db, adultInput());
    expect(result.user.realMoneyEligible).toBe(false);
    expect(result.sessionToken).toMatch(/^[a-f0-9]{64}$/);
    expect(await getAvailableBalance(db, result.user.id, "EUR")).toBe("1000.00000000");

    const sessionUser = await getSessionUser(db, result.sessionToken);
    expect(sessionUser?.id).toBe(result.user.id);
  });

  it("logs in with the correct password and rejects a wrong one", async () => {
    const input = adultInput();
    await registerPlayer(db, input);

    const ok = await loginPlayer(db, { email: input.email, password: input.password });
    expect(ok.user.email).toBe(input.email);

    await expect(
      loginPlayer(db, { email: input.email, password: "wrong-password" }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });
});
