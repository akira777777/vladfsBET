import {
  LedgerDirection,
  LedgerJournalType,
  Prisma,
  PrismaClient,
  WalletAccountType,
} from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export const HOUSE_EMAIL = "house@internal.vladfsbet";

const ACCOUNT_TYPES: WalletAccountType[] = ["AVAILABLE", "BONUS", "LOCKED", "PENDING"];

export class LedgerError extends Error {
  constructor(
    public readonly code:
      | "INSUFFICIENT_FUNDS"
      | "UNBALANCED"
      | "INVALID_AMOUNT"
      | "WALLET_FROZEN"
      | "NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "LedgerError";
  }
}

export type LedgerLineInput = {
  owner: "player" | "house";
  accountType: WalletAccountType;
  direction: LedgerDirection;
  amount: Prisma.Decimal | string | number;
};

export type PostJournalInput = {
  userId: string;
  type: LedgerJournalType;
  currency: string;
  idempotencyKey: string;
  amount: Prisma.Decimal | string | number;
  lines: LedgerLineInput[];
  referenceType?: string;
  referenceId?: string;
  memo?: string;
  metadata?: Prisma.InputJsonValue;
};

function dec(value: Prisma.Decimal | string | number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

function money(value: Prisma.Decimal): string {
  return value.toFixed(8);
}

async function withSerializable<T>(
  db: PrismaClient,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 15000,
        maxWait: 5000,
      });
    } catch (error) {
      last = error;
      const code = (error as { code?: string }).code;
      const metaCode = (error as { meta?: { code?: string } }).meta?.code;
      if (code === "P2034" || code === "40001" || metaCode === "40001") {
        await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw last;
}

export async function ensureHouseWallet(db: Db, currency: string) {
  const now = new Date();
  let house = await db.user.findUnique({ where: { email: HOUSE_EMAIL } });
  if (!house) {
    try {
      house = await db.user.create({
        data: {
          email: HOUSE_EMAIL,
          passwordHash: "unusable",
          country: "ZZ",
          currency,
          dateOfBirth: new Date("1980-01-01"),
          termsAcceptedAt: now,
          privacyAcceptedAt: now,
          rgAcknowledgedAt: now,
          status: "LOCKED",
          realMoneyEligible: false,
          profile: { create: { firstName: "House", lastName: "Ledger" } },
        },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== "P2002") {
        throw error;
      }
      house = await db.user.findUniqueOrThrow({ where: { email: HOUSE_EMAIL } });
    }
  }

  let wallet = await db.wallet.findUnique({
    where: { userId_currency: { userId: house.id, currency } },
    include: { accounts: true },
  });
  if (!wallet) {
    wallet = await db.wallet.create({
      data: {
        userId: house.id,
        currency,
        accounts: {
          create: ACCOUNT_TYPES.map((type) => ({ type })),
        },
      },
      include: { accounts: true },
    });
  }
  return { house, wallet };
}

export async function ensurePlayerWallets(db: Db, userId: string, currency: string) {
  let wallet = await db.wallet.findUnique({
    where: { userId_currency: { userId, currency } },
    include: { accounts: true },
  });
  if (!wallet) {
    wallet = await db.wallet.create({
      data: {
        userId,
        currency,
        accounts: {
          create: ACCOUNT_TYPES.map((type) => ({ type })),
        },
      },
      include: { accounts: true },
    });
  } else if (wallet.accounts.length < ACCOUNT_TYPES.length) {
    const have = new Set(wallet.accounts.map((account) => account.type));
    for (const type of ACCOUNT_TYPES) {
      if (!have.has(type)) {
        await db.walletAccount.create({ data: { walletId: wallet.id, type } });
      }
    }
    wallet = await db.wallet.findUniqueOrThrow({
      where: { id: wallet.id },
      include: { accounts: true },
    });
  }
  await ensureHouseWallet(db, currency);
  return wallet;
}

export async function getAvailableBalance(db: Db, userId: string, currency: string): Promise<string> {
  const wallet = await db.wallet.findUnique({
    where: { userId_currency: { userId, currency } },
    include: { accounts: true },
  });
  const available = wallet?.accounts.find((account) => account.type === "AVAILABLE");
  if (!available) {
    return money(new Prisma.Decimal(0));
  }
  return money(available.cachedBalance);
}

export async function getWalletSnapshot(db: Db, userId: string, currency: string) {
  const wallet = await db.wallet.findUnique({
    where: { userId_currency: { userId, currency } },
    include: { accounts: true },
  });
  if (!wallet) {
    return null;
  }
  const byType = Object.fromEntries(
    wallet.accounts.map((account) => [account.type, money(account.cachedBalance)]),
  ) as Record<WalletAccountType, string>;
  return {
    walletId: wallet.id,
    currency: wallet.currency,
    status: wallet.status,
    available: byType.AVAILABLE ?? money(new Prisma.Decimal(0)),
    bonus: byType.BONUS ?? money(new Prisma.Decimal(0)),
    locked: byType.LOCKED ?? money(new Prisma.Decimal(0)),
    pending: byType.PENDING ?? money(new Prisma.Decimal(0)),
  };
}

async function lockAccount(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM wallet_accounts WHERE id = ${id}::uuid FOR UPDATE
  `;
}

export async function postJournal(db: PrismaClient, input: PostJournalInput) {
  const existing = await db.ledgerJournal.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { lines: true, transaction: true },
  });
  if (existing) {
    return { journal: existing, reused: true };
  }

  if (!input.lines.length) {
    throw new LedgerError("UNBALANCED", "Journal needs at least two lines");
  }

  const amounts = input.lines.map((line) => dec(line.amount));
  if (amounts.some((amount) => amount.lte(0))) {
    throw new LedgerError("INVALID_AMOUNT", "Line amounts must be greater than zero");
  }

  let debit = new Prisma.Decimal(0);
  let credit = new Prisma.Decimal(0);
  for (let i = 0; i < input.lines.length; i++) {
    if (input.lines[i].direction === "DEBIT") {
      debit = debit.add(amounts[i]);
    } else {
      credit = credit.add(amounts[i]);
    }
  }
  if (!debit.eq(credit)) {
    throw new LedgerError("UNBALANCED", "Debits must equal credits");
  }

  try {
    return await withSerializable(db, async (tx) => {
      const replay = await tx.ledgerJournal.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { lines: true, transaction: true },
      });
      if (replay) {
        return { journal: replay, reused: true };
      }

      const playerWallet = await ensurePlayerWallets(tx, input.userId, input.currency);
      if (playerWallet.status !== "ACTIVE") {
        throw new LedgerError("WALLET_FROZEN", "Player wallet is not active");
      }
      const { wallet: houseWallet } = await ensureHouseWallet(tx, input.currency);

      const resolved = input.lines.map((line, index) => {
        const wallet = line.owner === "house" ? houseWallet : playerWallet;
        const account = wallet.accounts.find((item) => item.type === line.accountType);
        if (!account) {
          throw new LedgerError("NOT_FOUND", `Missing ${line.owner} ${line.accountType} account`);
        }
        return { line, amount: amounts[index], account };
      });

      const lockIds = [...new Set(resolved.map((item) => item.account.id))].sort();
      for (const id of lockIds) {
        await lockAccount(tx, id);
      }

      const fresh = await tx.walletAccount.findMany({
        where: { id: { in: lockIds } },
      });
      const byId = new Map(fresh.map((account) => [account.id, account]));

      for (const item of resolved) {
        const account = byId.get(item.account.id);
        if (!account) {
          throw new LedgerError("NOT_FOUND", "Account disappeared under lock");
        }
        const next =
          item.line.direction === "CREDIT"
            ? account.cachedBalance.add(item.amount)
            : account.cachedBalance.sub(item.amount);
        if (item.line.owner === "player" && next.lt(0)) {
          throw new LedgerError("INSUFFICIENT_FUNDS", "Available balance is too low");
        }
        const updated = await tx.walletAccount.update({
          where: { id: account.id },
          data: { cachedBalance: next, version: { increment: 1 } },
        });
        byId.set(account.id, updated);
      }

      const journal = await tx.ledgerJournal.create({
        data: {
          userId: input.userId,
          type: input.type,
          status: "POSTED",
          currency: input.currency,
          idempotencyKey: input.idempotencyKey,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          memo: input.memo,
          metadata: input.metadata,
          postedAt: new Date(),
          lines: {
            create: resolved.map((item) => ({
              accountId: item.account.id,
              direction: item.line.direction,
              amount: item.amount,
            })),
          },
          transaction: {
            create: {
              userId: input.userId,
              type: (input.type === "TRANSFER" ? "ADJUSTMENT" : input.type) as any,
              status: "COMPLETED",
              currency: input.currency,
              amount: dec(input.amount),
              idempotencyKey: `tx:${input.idempotencyKey}`,
              completedAt: new Date(),
            },
          },
        },
        include: { lines: true, transaction: true },
      });

      return { journal, reused: false };
    });
  } catch (error) {
    if (error instanceof LedgerError) {
      throw error;
    }
    const code = (error as { code?: string }).code;
    if (code === "P2002") {
      const journal = await db.ledgerJournal.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { lines: true, transaction: true },
      });
      if (journal) {
        return { journal, reused: true };
      }
    }
    throw error;
  }
}

export async function creditDemo(
  db: PrismaClient,
  userId: string,
  currency: string,
  amount: Prisma.Decimal | string | number,
  idempotencyKey: string,
) {
  return postJournal(db, {
    userId,
    type: "BONUS",
    currency,
    idempotencyKey,
    amount,
    memo: "Demo credits. Not real money.",
    lines: [
      { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount },
      { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount },
    ],
  });
}

export type CreateDepositInput = {
  userId: string;
  providerId: string;
  method: string;
  amount: Prisma.Decimal | string | number;
  currency: string;
  idempotencyKey: string;
};

export async function processDeposit(db: PrismaClient, input: CreateDepositInput) {
  const amount = dec(input.amount);
  if (amount.lte(0)) {
    throw new LedgerError("INVALID_AMOUNT", "Deposit amount must be greater than zero");
  }

  // 1. Post ledger journal to credit player's AVAILABLE account
  const { journal } = await postJournal(db, {
    userId: input.userId,
    type: "DEPOSIT",
    currency: input.currency,
    idempotencyKey: `journal:${input.idempotencyKey}`,
    amount,
    memo: `Deposit via ${input.method} (${input.currency})`,
    lines: [
      { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount },
      { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount },
    ],
  });

  // 2. Create deposit record
  const deposit = await db.deposit.create({
    data: {
      userId: input.userId,
      providerId: input.providerId,
      method: input.method,
      status: "COMPLETED",
      currency: input.currency,
      amount,
      idempotencyKey: input.idempotencyKey,
      completedAt: new Date(),
    },
    include: { provider: true },
  });

  return { deposit, journal };
}

export type RequestWithdrawalInput = {
  userId: string;
  providerId: string;
  method: string;
  amount: Prisma.Decimal | string | number;
  currency: string;
  idempotencyKey: string;
};

export async function requestWithdrawal(db: PrismaClient, input: RequestWithdrawalInput) {
  const amount = dec(input.amount);
  if (amount.lte(0)) {
    throw new LedgerError("INVALID_AMOUNT", "Withdrawal amount must be greater than zero");
  }

  // Check available balance before reserving
  const available = await getAvailableBalance(db, input.userId, input.currency);
  if (new Prisma.Decimal(available).lt(amount)) {
    throw new LedgerError("INSUFFICIENT_FUNDS", "Insufficient available balance for withdrawal");
  }

  // Reserve balance: transfer from player AVAILABLE -> player PENDING
  const { journal } = await postJournal(db, {
    userId: input.userId,
    type: "TRANSFER",
    currency: input.currency,
    idempotencyKey: `reserve-withdrawal:${input.idempotencyKey}`,
    amount,
    memo: `Withdrawal reserved (${input.method})`,
    lines: [
      { owner: "player", accountType: "AVAILABLE", direction: "DEBIT", amount },
      { owner: "player", accountType: "PENDING", direction: "CREDIT", amount },
    ],
  });

  const withdrawal = await db.withdrawal.create({
    data: {
      userId: input.userId,
      providerId: input.providerId,
      method: input.method,
      status: "REQUESTED",
      currency: input.currency,
      amount,
      idempotencyKey: input.idempotencyKey,
    },
    include: { provider: true },
  });

  return { withdrawal, journal };
}

export async function adminApproveWithdrawal(
  db: PrismaClient,
  withdrawalId: string,
  adminUserId: string,
  reviewNote?: string,
) {
  const withdrawal = await db.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: { user: true },
  });

  if (!withdrawal || withdrawal.status !== "REQUESTED") {
    throw new LedgerError("NOT_FOUND", "Withdrawal is not pending review");
  }

  // Finalize withdrawal: player PENDING debited -> house AVAILABLE credited
  await postJournal(db, {
    userId: withdrawal.userId,
    type: "WITHDRAWAL",
    currency: withdrawal.currency,
    idempotencyKey: `settle-withdrawal:${withdrawal.id}:${Date.now()}`,
    amount: withdrawal.amount,
    memo: `Withdrawal approved & completed: ${withdrawal.id}`,
    lines: [
      { owner: "player", accountType: "PENDING", direction: "DEBIT", amount: withdrawal.amount },
      { owner: "house", accountType: "AVAILABLE", direction: "CREDIT", amount: withdrawal.amount },
    ],
  });

  const updated = await db.withdrawal.update({
    where: { id: withdrawalId },
    data: {
      status: "COMPLETED",
      reviewedById: adminUserId,
      reviewedAt: new Date(),
      completedAt: new Date(),
      reviewNote,
    },
    include: { user: true, provider: true },
  });

  await db.auditLog.create({
    data: {
      actorType: "ADMIN",
      adminId: adminUserId,
      subjectId: withdrawal.userId,
      action: "WITHDRAWAL_APPROVED",
      entity: "Withdrawal",
      entityId: withdrawal.id,
      payload: { amount: withdrawal.amount.toFixed(8), currency: withdrawal.currency, reviewNote },
    },
  });

  return updated;
}

export async function adminRejectWithdrawal(
  db: PrismaClient,
  withdrawalId: string,
  adminUserId: string,
  reason: string,
) {
  const withdrawal = await db.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: { user: true },
  });

  if (!withdrawal || withdrawal.status !== "REQUESTED") {
    throw new LedgerError("NOT_FOUND", "Withdrawal is not pending review");
  }

  // Refund from player PENDING -> player AVAILABLE
  await postJournal(db, {
    userId: withdrawal.userId,
    type: "REFUND",
    currency: withdrawal.currency,
    idempotencyKey: `reject-withdrawal-refund:${withdrawal.id}:${Date.now()}`,
    amount: withdrawal.amount,
    memo: `Withdrawal rejected & refunded: ${reason}`,
    lines: [
      { owner: "player", accountType: "PENDING", direction: "DEBIT", amount: withdrawal.amount },
      { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount: withdrawal.amount },
    ],
  });

  const updated = await db.withdrawal.update({
    where: { id: withdrawalId },
    data: {
      status: "REJECTED",
      reviewedById: adminUserId,
      reviewedAt: new Date(),
      failureReason: reason,
      reviewNote: reason,
    },
    include: { user: true, provider: true },
  });

  await db.auditLog.create({
    data: {
      actorType: "ADMIN",
      adminId: adminUserId,
      subjectId: withdrawal.userId,
      action: "WITHDRAWAL_REJECTED",
      entity: "Withdrawal",
      entityId: withdrawal.id,
      payload: { amount: withdrawal.amount.toFixed(8), currency: withdrawal.currency, reason },
    },
  });

  return updated;
}

