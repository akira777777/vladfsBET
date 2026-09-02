import { Prisma } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { createTestPlayer, db } from "./test-helpers";
import {
  ensurePlayerWallets,
  getAvailableBalance,
  LedgerError,
  postJournal,
} from "./ledger";

describe("ledger", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("credits player available from the house and updates the projection", async () => {
    const player = await createTestPlayer();
    await ensurePlayerWallets(db, player.id, "EUR");

    await postJournal(db, {
      userId: player.id,
      type: "BONUS",
      currency: "EUR",
      idempotencyKey: `credit-${player.id}`,
      amount: "100.00",
      lines: [
        { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount: "100.00" },
        { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount: "100.00" },
      ],
    });

    expect(await getAvailableBalance(db, player.id, "EUR")).toBe("100.00000000");
  });

  it("rejects a debit that would overdraw a player account", async () => {
    const player = await createTestPlayer();
    await ensurePlayerWallets(db, player.id, "EUR");

    await expect(
      postJournal(db, {
        userId: player.id,
        type: "BET",
        currency: "EUR",
        idempotencyKey: `bet-${player.id}`,
        amount: "10.00",
        lines: [
          { owner: "player", accountType: "AVAILABLE", direction: "DEBIT", amount: "10.00" },
          { owner: "house", accountType: "AVAILABLE", direction: "CREDIT", amount: "10.00" },
        ],
      }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_FUNDS" } satisfies Partial<LedgerError>);
  });

  it("returns the original journal when the idempotency key is reused", async () => {
    const player = await createTestPlayer();
    await ensurePlayerWallets(db, player.id, "EUR");
    const key = `idem-${player.id}`;
    const input = {
      userId: player.id,
      type: "BONUS" as const,
      currency: "EUR",
      idempotencyKey: key,
      amount: "25.00",
      lines: [
        { owner: "house" as const, accountType: "AVAILABLE" as const, direction: "DEBIT" as const, amount: "25.00" },
        { owner: "player" as const, accountType: "AVAILABLE" as const, direction: "CREDIT" as const, amount: "25.00" },
      ],
    };

    const first = await postJournal(db, input);
    const second = await postJournal(db, input);

    expect(second.reused).toBe(true);
    expect(second.journal.id).toBe(first.journal.id);
    expect(await getAvailableBalance(db, player.id, "EUR")).toBe("25.00000000");
  });

  it("rejects unbalanced journals", async () => {
    const player = await createTestPlayer();
    await ensurePlayerWallets(db, player.id, "EUR");

    await expect(
      postJournal(db, {
        userId: player.id,
        type: "ADJUSTMENT",
        currency: "EUR",
        idempotencyKey: `unbalanced-${player.id}`,
        amount: "5.00",
        lines: [
          { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount: "5.00" },
        ],
      }),
    ).rejects.toMatchObject({ code: "UNBALANCED" });
  });

  it("posts a bet then a win without mutating prior lines", async () => {
    const player = await createTestPlayer();
    await ensurePlayerWallets(db, player.id, "EUR");

    await postJournal(db, {
      userId: player.id,
      type: "BONUS",
      currency: "EUR",
      idempotencyKey: `stake-${player.id}`,
      amount: "50",
      lines: [
        { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount: "50" },
        { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount: "50" },
      ],
    });

    await postJournal(db, {
      userId: player.id,
      type: "BET",
      currency: "EUR",
      idempotencyKey: `play-bet-${player.id}`,
      amount: "10",
      lines: [
        { owner: "player", accountType: "AVAILABLE", direction: "DEBIT", amount: "10" },
        { owner: "house", accountType: "AVAILABLE", direction: "CREDIT", amount: "10" },
      ],
    });

    await postJournal(db, {
      userId: player.id,
      type: "WIN",
      currency: "EUR",
      idempotencyKey: `play-win-${player.id}`,
      amount: "20",
      lines: [
        { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount: "20" },
        { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount: "20" },
      ],
    });

    expect(await getAvailableBalance(db, player.id, "EUR")).toBe("60.00000000");

    const lines = await db.ledgerLine.count({
      where: { journal: { userId: player.id } },
    });
    expect(lines).toBe(6);
    expect(new Prisma.Decimal("60").equals("60")).toBe(true);
  });
});
