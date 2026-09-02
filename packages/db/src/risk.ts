import { Prisma, PrismaClient } from "@prisma/client";

export class RiskError extends Error {
  constructor(
    public readonly code: "ALERT_NOT_FOUND" | "INVALID_ACTION",
    message: string,
  ) {
    super(message);
    this.name = "RiskError";
  }
}

export type RiskCheckResult = {
  passed: boolean;
  riskScore: number;
  flags: string[];
};

export async function evaluateTransactionRisk(
  db: PrismaClient,
  userId: string,
  type: "DEPOSIT" | "WITHDRAWAL" | "BET",
  amount: Prisma.Decimal | string | number,
): Promise<RiskCheckResult> {
  const decAmount = new Prisma.Decimal(amount);
  const flags: string[] = [];
  let riskScore = 0;

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [user, deposits24h, withdrawals24h, recentDepositsCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: { kycCases: true, fingerprints: true },
    }),
    db.deposit.aggregate({
      where: { userId, status: "COMPLETED", createdAt: { gte: dayAgo } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    db.withdrawal.aggregate({
      where: { userId, status: "COMPLETED", createdAt: { gte: dayAgo } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    db.deposit.count({
      where: { userId, createdAt: { gte: hourAgo } },
    }),
  ]);

  if (!user) {
    return { passed: false, riskScore: 100, flags: ["USER_NOT_FOUND"] };
  }

  // Check 1: Large single transaction threshold (> $5,000)
  if (decAmount.gte(5000)) {
    flags.push("LARGE_SINGLE_TRANSACTION");
    riskScore += 30;
  }

  // Check 2: High deposit velocity in 1 hour (> 5 deposits)
  if (type === "DEPOSIT" && recentDepositsCount >= 5) {
    flags.push("HIGH_DEPOSIT_VELOCITY_1H");
    riskScore += 25;
  }

  // Check 3: Withdrawal without KYC Approved
  if (type === "WITHDRAWAL" && user.kycStatus !== "APPROVED") {
    flags.push("WITHDRAWAL_WITHOUT_APPROVED_KYC");
    riskScore += 40;
  }

  // Check 4: Rapid turnover / rapid withdrawal
  if (type === "WITHDRAWAL") {
    const totalDep24h = deposits24h._sum.amount ?? new Prisma.Decimal(0);
    if (totalDep24h.gt(0) && decAmount.gt(totalDep24h.mul(5))) {
      flags.push("RAPID_HIGH_WITHDRAWAL_RATIO");
      riskScore += 30;
    }
  }

  // Generate AML Alert if riskScore >= 40
  if (riskScore >= 40) {
    await db.amlAlert.create({
      data: {
        userId,
        ruleKey: flags.join("_"),
        severity: riskScore >= 70 ? "HIGH" : "MEDIUM",
        payload: {
          transactionType: type,
          amount: decAmount.toFixed(8),
          flags,
          riskScore,
        },
        open: true,
      },
    });

    await db.riskEvent.create({
      data: {
        userId,
        kind: type,
        score: riskScore,
        payload: { flags, amount: decAmount.toFixed(8) },
      },
    });
  }

  return {
    passed: riskScore < 80,
    riskScore,
    flags,
  };
}

export async function resolveAmlAlert(
  db: PrismaClient,
  alertId: string,
  adminUserId: string,
  notes?: string,
) {
  const alert = await db.amlAlert.findUnique({ where: { id: alertId } });
  if (!alert) {
    throw new RiskError("ALERT_NOT_FOUND", "AML Alert not found");
  }

  const updated = await db.amlAlert.update({
    where: { id: alertId },
    data: {
      open: false,
      resolvedAt: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      actorType: "ADMIN",
      adminId: adminUserId,
      subjectId: alert.userId,
      action: "AML_ALERT_RESOLVED",
      entity: "AmlAlert",
      entityId: alertId,
      payload: { notes, ruleKey: alert.ruleKey },
    },
  });

  return updated;
}
