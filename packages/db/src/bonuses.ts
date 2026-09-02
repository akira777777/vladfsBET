import { BonusType, PlayerBonusStatus, Prisma, PrismaClient } from "@prisma/client";
import { LedgerError, postJournal } from "./ledger";

export class BonusError extends Error {
  constructor(
    public readonly code:
      | "BONUS_NOT_FOUND"
      | "PROMO_CODE_INVALID"
      | "ALREADY_ACTIVE"
      | "NOT_ELIGIBLE"
      | "WAGERING_INCOMPLETE",
    message: string,
  ) {
    super(message);
    this.name = "BonusError";
  }
}

export async function claimBonusTemplate(
  db: PrismaClient,
  userId: string,
  templateSlug: string,
) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: { wallets: { include: { accounts: true } } },
  });

  const template = await db.bonusTemplate.findUnique({
    where: { slug: templateSlug },
  });

  if (!template || !template.active) {
    throw new BonusError("BONUS_NOT_FOUND", "Bonus is not available");
  }

  // Check if player already claimed this template if it's a welcome bonus
  if (template.type === "WELCOME") {
    const existing = await db.playerBonus.findFirst({
      where: { userId, templateId: template.id },
    });
    if (existing) {
      throw new BonusError("ALREADY_ACTIVE", "Welcome bonus has already been claimed");
    }
  }

  const bonusAmount = template.amount ?? new Prisma.Decimal(100);
  const wageringMultiplier = template.wageringMultiplier || 30;
  const wageringRequired = bonusAmount.mul(wageringMultiplier);
  const now = new Date();
  const expiresAt = template.expiresInHours
    ? new Date(now.getTime() + template.expiresInHours * 60 * 60 * 1000)
    : null;

  // Credit player's BONUS account via double-entry journal
  await postJournal(db, {
    userId,
    type: "BONUS",
    currency: user.currency,
    idempotencyKey: `bonus:${template.slug}:${userId}:${Date.now()}`,
    amount: bonusAmount,
    memo: `Bonus credited: ${template.name}`,
    lines: [
      { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount: bonusAmount },
      { owner: "player", accountType: "BONUS", direction: "CREDIT", amount: bonusAmount },
    ],
  });

  const playerWallet = user.wallets.find((w) => w.currency === user.currency);
  const bonusAccount = playerWallet?.accounts.find((a) => a.type === "BONUS");
  if (!bonusAccount) {
    throw new Error("Bonus account not found");
  }

  const playerBonus = await db.playerBonus.create({
    data: {
      userId,
      templateId: template.id,
      status: "ACTIVATED",
      awarded: bonusAmount,
      activatedAt: now,
      expiresAt,
      bonusWallet: {
        create: {
          accountId: bonusAccount.id,
          remaining: bonusAmount,
          wagered: new Prisma.Decimal(0),
          wageringRequired,
        },
      },
    },
    include: { template: true, bonusWallet: true },
  });

  return playerBonus;
}

export async function redeemPromoCode(db: PrismaClient, userId: string, codeStr: string) {
  const code = await db.promoCode.findUnique({
    where: { code: codeStr.toUpperCase().trim() },
    include: { promotion: true },
  });

  if (!code || !code.active) {
    throw new BonusError("PROMO_CODE_INVALID", "Promo code is invalid or expired");
  }

  if (code.maxRedemptions && code.redeemed >= code.maxRedemptions) {
    throw new BonusError("PROMO_CODE_INVALID", "Promo code has reached maximum redemptions");
  }

  // Increment redemption
  await db.promoCode.update({
    where: { id: code.id },
    data: { redeemed: { increment: 1 } },
  });

  // Credit promo code bonus reward
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const rewardAmount = new Prisma.Decimal(50);

  await postJournal(db, {
    userId,
    type: "BONUS",
    currency: user.currency,
    idempotencyKey: `promo:${code.id}:${userId}:${Date.now()}`,
    amount: rewardAmount,
    memo: `Promo Code Reward: ${code.code}`,
    lines: [
      { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount: rewardAmount },
      { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount: rewardAmount },
    ],
  });

  return { code: code.code, reward: rewardAmount.toFixed(2), title: code.promotion.title };
}

export async function processBonusWagering(
  db: PrismaClient,
  userId: string,
  betAmount: Prisma.Decimal,
) {
  const activeBonus = await db.playerBonus.findFirst({
    where: {
      userId,
      status: "ACTIVATED",
      bonusWallet: { isNot: null },
    },
    include: { bonusWallet: true, user: true },
  });

  if (!activeBonus || !activeBonus.bonusWallet) return;

  const bw = activeBonus.bonusWallet;
  const newWagered = bw.wagered.add(betAmount);

  if (newWagered.gte(bw.wageringRequired)) {
    // Wagering requirement completed! Transfer remaining bonus balance to AVAILABLE
    await db.bonusWallet.update({
      where: { id: bw.id },
      data: { wagered: bw.wageringRequired },
    });

    await db.playerBonus.update({
      where: { id: activeBonus.id },
      data: { status: "COMPLETED" },
    });

    // Transfer from BONUS to AVAILABLE account
    if (bw.remaining.gt(0)) {
      await postJournal(db, {
        userId,
        type: "TRANSFER",
        currency: activeBonus.user.currency,
        idempotencyKey: `bonus-complete:${activeBonus.id}:${Date.now()}`,
        amount: bw.remaining,
        memo: "Bonus wagering completed, funds converted to cash",
        lines: [
          { owner: "player", accountType: "BONUS", direction: "DEBIT", amount: bw.remaining },
          { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount: bw.remaining },
        ],
      });
    }
  } else {
    await db.bonusWallet.update({
      where: { id: bw.id },
      data: { wagered: newWagered },
    });
  }
}

export async function recordVipWager(
  db: PrismaClient,
  userId: string,
  betAmount: Prisma.Decimal,
) {
  let progress = await db.vipProgress.findUnique({
    where: { userId },
    include: { level: true },
  });

  if (!progress) {
    const bronze = await db.vipLevel.findUnique({ where: { slug: "bronze" } });
    if (!bronze) return;
    progress = await db.vipProgress.create({
      data: { userId, levelId: bronze.id },
      include: { level: true },
    });
  }

  const addedPoints = betAmount.mul(1); // 1 point per $1 wagered
  const newPoints = progress.points.add(addedPoints);
  const newLifetimeWager = progress.lifetimeWager.add(betAmount);

  // Check if eligible for next level
  const nextLevels = await db.vipLevel.findMany({
    where: { pointsRequired: { lte: newPoints } },
    orderBy: { rank: "desc" },
    take: 1,
  });

  const bestLevel = nextLevels[0] ?? progress.level;

  await db.vipProgress.update({
    where: { userId },
    data: {
      points: newPoints,
      lifetimeWager: newLifetimeWager,
      levelId: bestLevel.id,
    },
  });
}

export async function claimVipCashback(db: PrismaClient, userId: string) {
  const progress = await db.vipProgress.findUnique({
    where: { userId },
    include: { level: true, user: true },
  });

  if (!progress || progress.level.cashbackBps <= 0) {
    throw new BonusError("NOT_ELIGIBLE", "No VIP cashback currently available for your tier");
  }

  // Calculate cashback based on net loss over last 7 days * cashbackBps
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const aggregate = await db.gameRound.aggregate({
    where: { userId, createdAt: { gte: since } },
    _sum: { betAmount: true, winAmount: true },
  });

  const totalBets = aggregate._sum.betAmount ?? new Prisma.Decimal(0);
  const totalWins = aggregate._sum.winAmount ?? new Prisma.Decimal(0);
  const netLoss = totalBets.sub(totalWins);

  if (netLoss.lte(0)) {
    throw new BonusError("NOT_ELIGIBLE", "No net loss in the period to calculate cashback on");
  }

  const rate = new Prisma.Decimal(progress.level.cashbackBps).div(10000);
  const cashbackAmount = netLoss.mul(rate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  if (cashbackAmount.lte(0)) {
    throw new BonusError("NOT_ELIGIBLE", "Calculated cashback amount is 0");
  }

  await postJournal(db, {
    userId,
    type: "BONUS",
    currency: progress.user.currency,
    idempotencyKey: `vip-cashback:${userId}:${Date.now()}`,
    amount: cashbackAmount,
    memo: `VIP ${progress.level.name} Cashback (${(progress.level.cashbackBps / 100).toFixed(1)}%)`,
    lines: [
      { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount: cashbackAmount },
      { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount: cashbackAmount },
    ],
  });

  return { amount: cashbackAmount.toFixed(2), tier: progress.level.name };
}
