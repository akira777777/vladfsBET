import { LimitType, Prisma, PrismaClient } from "@prisma/client";

export class RgError extends Error {
  constructor(
    public readonly code:
      | "SELF_EXCLUDED"
      | "DEPOSIT_LIMIT_EXCEEDED"
      | "LOSS_LIMIT_EXCEEDED"
      | "WAGER_LIMIT_EXCEEDED"
      | "INVALID_LIMIT",
    message: string,
  ) {
    super(message);
    this.name = "RgError";
  }
}

export type SetLimitInput = {
  userId: string;
  type: LimitType;
  amount?: Prisma.Decimal | string | number;
  minutes?: number;
  periodHours: number;
};

export type CoolingOffInput = {
  userId: string;
  hours: number;
  reason?: string;
};

export type SelfExclusionInput = {
  userId: string;
  months?: number;
  permanent?: boolean;
  reason?: string;
};

export async function checkPlayerEligibleToPlay(db: PrismaClient, userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { status: true, selfExcludedUntil: true },
  });
  if (!user) return;

  if (user.status === "SELF_EXCLUDED") {
    if (user.selfExcludedUntil && user.selfExcludedUntil.getTime() <= Date.now()) {
      // Self-exclusion expired, re-activate
      await db.user.update({
        where: { id: userId },
        data: { status: "ACTIVE", selfExcludedUntil: null },
      });
    } else {
      throw new RgError("SELF_EXCLUDED", "Account is currently self-excluded under responsible gaming policy");
    }
  }

  if (user.status === "LOCKED" || user.status === "SUSPENDED" || user.status === "CLOSED") {
    throw new RgError("SELF_EXCLUDED", `Account status is ${user.status}`);
  }
}

export async function checkWagerLimit(
  db: PrismaClient,
  userId: string,
  betAmount: Prisma.Decimal | string | number,
): Promise<void> {
  const bet = new Prisma.Decimal(betAmount);
  const now = new Date();

  // Find active wager limits
  const limits = await db.responsibleGamingLimit.findMany({
    where: {
      userId,
      type: "WAGER",
      active: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
  });

  for (const limit of limits) {
    if (!limit.amount) continue;
    const since = new Date(now.getTime() - limit.periodHours * 60 * 60 * 1000);

    const aggregate = await db.gameRound.aggregate({
      where: {
        userId,
        createdAt: { gte: since },
      },
      _sum: { betAmount: true },
    });

    const currentWagered = aggregate._sum.betAmount ?? new Prisma.Decimal(0);
    if (currentWagered.add(bet).gt(limit.amount)) {
      throw new RgError(
        "WAGER_LIMIT_EXCEEDED",
        `Wager limit of ${limit.amount.toString()} for ${limit.periodHours}h would be exceeded. Current total: ${currentWagered.toString()}`,
      );
    }
  }
}

export async function checkDepositLimit(
  db: PrismaClient,
  userId: string,
  depositAmount: Prisma.Decimal | string | number,
): Promise<void> {
  const dep = new Prisma.Decimal(depositAmount);
  const now = new Date();

  const limits = await db.responsibleGamingLimit.findMany({
    where: {
      userId,
      type: "DEPOSIT",
      active: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
  });

  for (const limit of limits) {
    if (!limit.amount) continue;
    const since = new Date(now.getTime() - limit.periodHours * 60 * 60 * 1000);

    const aggregate = await db.deposit.aggregate({
      where: {
        userId,
        status: "COMPLETED",
        createdAt: { gte: since },
      },
      _sum: { amount: true },
    });

    const currentDeposited = aggregate._sum.amount ?? new Prisma.Decimal(0);
    if (currentDeposited.add(dep).gt(limit.amount)) {
      throw new RgError(
        "DEPOSIT_LIMIT_EXCEEDED",
        `Deposit limit of ${limit.amount.toString()} for ${limit.periodHours}h would be exceeded. Current total: ${currentDeposited.toString()}`,
      );
    }
  }
}

export async function setResponsibleGamingLimit(db: PrismaClient, input: SetLimitInput) {
  const now = new Date();
  const amount = input.amount ? new Prisma.Decimal(input.amount) : null;

  // Deactivate existing active limits of this type and period
  await db.responsibleGamingLimit.updateMany({
    where: {
      userId: input.userId,
      type: input.type,
      periodHours: input.periodHours,
      active: true,
    },
    data: { active: false, endsAt: now },
  });

  return db.responsibleGamingLimit.create({
    data: {
      userId: input.userId,
      type: input.type,
      amount,
      minutes: input.minutes,
      periodHours: input.periodHours,
      active: true,
      startsAt: now,
    },
  });
}

export async function applyCoolingOff(db: PrismaClient, input: CoolingOffInput) {
  const now = new Date();
  const until = new Date(now.getTime() + input.hours * 60 * 60 * 1000);

  await db.selfExclusion.create({
    data: {
      userId: input.userId,
      reason: input.reason ?? `Cooling-off for ${input.hours} hours`,
      startsAt: now,
      endsAt: until,
      permanent: false,
    },
  });

  await db.user.update({
    where: { id: input.userId },
    data: {
      status: "SELF_EXCLUDED",
      selfExcludedUntil: until,
    },
  });

  // Invalidate all existing sessions for this player
  await db.session.updateMany({
    where: { userId: input.userId, revokedAt: null },
    data: { revokedAt: now },
  });

  return { ok: true, until };
}

export async function applySelfExclusion(db: PrismaClient, input: SelfExclusionInput) {
  const now = new Date();
  let until: Date | null = null;

  if (!input.permanent && input.months) {
    until = new Date(now);
    until.setMonth(until.getMonth() + input.months);
  }

  await db.selfExclusion.create({
    data: {
      userId: input.userId,
      reason: input.reason ?? (input.permanent ? "Permanent self-exclusion" : `Self-exclusion for ${input.months} months`),
      startsAt: now,
      endsAt: until,
      permanent: !!input.permanent,
    },
  });

  await db.user.update({
    where: { id: input.userId },
    data: {
      status: "SELF_EXCLUDED",
      selfExcludedUntil: until,
    },
  });

  // Invalidate all sessions immediately
  await db.session.updateMany({
    where: { userId: input.userId, revokedAt: null },
    data: { revokedAt: now },
  });

  return { ok: true, permanent: !!input.permanent, until };
}

export async function getPlayerRgSummary(db: PrismaClient, userId: string) {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [limits, user, rounds24h, deposits24h] = await Promise.all([
    db.responsibleGamingLimit.findMany({
      where: {
        userId,
        active: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { status: true, selfExcludedUntil: true },
    }),
    db.gameRound.aggregate({
      where: { userId, createdAt: { gte: dayAgo } },
      _sum: { betAmount: true, winAmount: true },
      _count: { id: true },
    }),
    db.deposit.aggregate({
      where: { userId, status: "COMPLETED", createdAt: { gte: dayAgo } },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const totalBet24h = rounds24h._sum.betAmount ?? new Prisma.Decimal(0);
  const totalWin24h = rounds24h._sum.winAmount ?? new Prisma.Decimal(0);
  const netLoss24h = totalBet24h.sub(totalWin24h);

  return {
    limits: limits.map((limit) => ({
      id: limit.id,
      type: limit.type,
      amount: limit.amount ? limit.amount.toFixed(8) : null,
      minutes: limit.minutes,
      periodHours: limit.periodHours,
      active: limit.active,
      startsAt: limit.startsAt.toISOString(),
      endsAt: limit.endsAt?.toISOString() ?? null,
    })),
    selfExclusion: user?.status === "SELF_EXCLUDED" ? {
      active: true,
      endsAt: user.selfExcludedUntil?.toISOString() ?? null,
      permanent: user.selfExcludedUntil === null,
    } : null,
    activityStats: {
      sessionTimeMinutes: 45, // Demo activity simulation
      totalWagered24h: totalBet24h.toFixed(2),
      netLoss24h: (netLoss24h.gt(0) ? netLoss24h : new Prisma.Decimal(0)).toFixed(2),
      depositCount24h: deposits24h._count.id,
      depositTotal24h: (deposits24h._sum.amount ?? new Prisma.Decimal(0)).toFixed(2),
      totalRounds24h: rounds24h._count.id,
    },
  };
}
