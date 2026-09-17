import { Prisma, PrismaClient, PlayerStatus } from "@prisma/client";
import { hashSessionToken, verifyPassword } from "./auth";
import { postJournal } from "./ledger";
import { randomBytes } from "node:crypto";

const ADMIN_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export class AdminError extends Error {
  constructor(
    public readonly code:
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "ADMIN_NOT_FOUND"
      | "DUAL_CONTROL_REQUIRED"
      | "INVALID_INPUT",
    message: string,
  ) {
    super(message);
    this.name = "AdminError";
  }
}

export type AdminLoginInput = {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
};

export type AdminActor = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
};

const adminRoleInclude = {
  roles: {
    include: {
      role: {
        include: { permissions: { include: { permission: true } } },
      },
    },
  },
} as const;

function toAdminActor(admin: {
  id: string;
  email: string;
  name: string;
  roles: Array<{
    role: {
      name: string;
      permissions: Array<{ permission: { key: string } }>;
    };
  }>;
}): AdminActor {
  const permissions = new Set<string>();
  const roleNames: string[] = [];
  for (const ar of admin.roles) {
    roleNames.push(ar.role.name);
    for (const rp of ar.role.permissions) {
      permissions.add(rp.permission.key);
    }
  }
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    roles: roleNames,
    permissions: Array.from(permissions),
  };
}

async function createAdminSession(
  db: PrismaClient,
  adminUserId: string,
  meta?: { ip?: string; userAgent?: string },
) {
  const sessionToken = randomBytes(32).toString("hex");
  await db.adminSession.create({
    data: {
      adminUserId,
      tokenHash: hashSessionToken(sessionToken),
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      expiresAt: new Date(Date.now() + ADMIN_SESSION_TTL_MS),
    },
  });
  return sessionToken;
}

export function assertAdminPermission(admin: AdminActor, key: string) {
  if (!admin.permissions.includes(key)) {
    throw new AdminError("FORBIDDEN", `Missing permission: ${key}`);
  }
}

export async function loginAdmin(db: PrismaClient, input: AdminLoginInput) {
  const admin = await db.adminUser.findUnique({
    where: { email: input.email.trim().toLowerCase() },
    include: adminRoleInclude,
  });

  if (!admin || !admin.active) {
    throw new AdminError("UNAUTHORIZED", "Invalid admin credentials or account inactive");
  }

  const ok = await verifyPassword(input.password, admin.passwordHash);
  if (!ok) {
    throw new AdminError("UNAUTHORIZED", "Invalid admin credentials");
  }

  await db.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  const actor = toAdminActor(admin);
  const sessionToken = await createAdminSession(db, admin.id, input);

  await db.auditLog.create({
    data: {
      actorType: "ADMIN",
      adminId: admin.id,
      action: "ADMIN_LOGIN",
      entity: "AdminUser",
      entityId: admin.id,
      ip: input.ip,
    },
  });

  return { admin: actor, sessionToken };
}

export async function getAdminSession(db: PrismaClient, sessionToken: string | undefined | null) {
  if (!sessionToken) {
    return null;
  }
  const session = await db.adminSession.findUnique({
    where: { tokenHash: hashSessionToken(sessionToken) },
    include: { admin: { include: adminRoleInclude } },
  });
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt.getTime() <= Date.now() ||
    !session.admin.active
  ) {
    return null;
  }
  await db.adminSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });
  return toAdminActor(session.admin);
}

export async function revokeAdminSession(db: PrismaClient, sessionToken: string | undefined | null) {
  if (!sessionToken) {
    return;
  }
  await db.adminSession.updateMany({
    where: { tokenHash: hashSessionToken(sessionToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getAdminStatsOverview(db: PrismaClient) {
  const [
    totalPlayers,
    activePlayers,
    roundsAgg,
    depositsAgg,
    withdrawalsAgg,
    pendingWithdrawals,
    openKyc,
    activeAlerts,
  ] = await Promise.all([
    db.user.count({ where: { email: { not: "house@internal.vladfsbet" } } }),
    db.user.count({
      where: {
        lastLoginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    db.gameRound.aggregate({
      _sum: { betAmount: true, winAmount: true },
    }),
    db.deposit.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    db.withdrawal.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    db.withdrawal.count({ where: { status: "REQUESTED" } }),
    db.kycCase.count({ where: { status: "UNDER_REVIEW" } }),
    db.amlAlert.count({ where: { open: true } }),
  ]);

  const totalBets = roundsAgg._sum.betAmount ?? new Prisma.Decimal(0);
  const totalWins = roundsAgg._sum.winAmount ?? new Prisma.Decimal(0);
  const ggr = totalBets.sub(totalWins);
  const ngr = ggr.mul(0.85); // NGR estimating gaming tax/costs

  const totalDeposits = depositsAgg._sum.amount ?? new Prisma.Decimal(0);
  const totalWithdrawals = withdrawalsAgg._sum.amount ?? new Prisma.Decimal(0);

  return {
    totalPlayers,
    activePlayersToday: activePlayers,
    ggr: ggr.toFixed(2),
    ngr: ngr.toFixed(2),
    totalBetsVolume: totalBets.toFixed(2),
    totalWinsVolume: totalWins.toFixed(2),
    totalDepositsVolume: totalDeposits.toFixed(2),
    totalWithdrawalsVolume: totalWithdrawals.toFixed(2),
    pendingWithdrawalsCount: pendingWithdrawals,
    openKycCasesCount: openKyc,
    activeAmlAlertsCount: activeAlerts,
  };
}

export async function adminUpdatePlayerStatus(
  db: PrismaClient,
  adminUserId: string,
  targetUserId: string,
  newStatus: PlayerStatus,
  reason: string,
) {
  const user = await db.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new AdminError("INVALID_INPUT", "Player not found");
  }

  const updated = await db.user.update({
    where: { id: targetUserId },
    data: { status: newStatus },
  });

  if (newStatus === "LOCKED" || newStatus === "SUSPENDED" || newStatus === "CLOSED") {
    // Terminate all player sessions immediately
    await db.session.updateMany({
      where: { userId: targetUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // Audit log
  await db.auditLog.create({
    data: {
      actorType: "ADMIN",
      adminId: adminUserId,
      subjectId: targetUserId,
      action: `PLAYER_STATUS_${newStatus}`,
      entity: "User",
      entityId: targetUserId,
      payload: { previousStatus: user.status, newStatus, reason },
    },
  });

  return updated;
}

export type ManualAdjustmentInput = {
  adminUserId: string;
  targetUserId: string;
  amount: Prisma.Decimal | string | number;
  direction: "CREDIT" | "DEBIT";
  reasonCode: "CORRECTION" | "DISPUTE_SETTLEMENT" | "GOODWILL" | "TEST_CREDIT";
  notes: string;
};

export async function adminManualBalanceAdjustment(
  db: PrismaClient,
  input: ManualAdjustmentInput,
) {
  const adjAmount = new Prisma.Decimal(input.amount);
  if (adjAmount.lte(0)) {
    throw new AdminError("INVALID_INPUT", "Adjustment amount must be greater than zero");
  }

  if (!input.notes || input.notes.trim().length < 5) {
    throw new AdminError("INVALID_INPUT", "Mandatory notes required for manual adjustment");
  }

  const targetUser = await db.user.findUniqueOrThrow({ where: { id: input.targetUserId } });
  const idempotencyKey = `manual-adj:${input.targetUserId}:${Date.now()}:${randomBytes(4).toString("hex")}`;

  const lines =
    input.direction === "CREDIT"
      ? [
          { owner: "house" as const, accountType: "AVAILABLE" as const, direction: "DEBIT" as const, amount: adjAmount },
          { owner: "player" as const, accountType: "AVAILABLE" as const, direction: "CREDIT" as const, amount: adjAmount },
        ]
      : [
          { owner: "player" as const, accountType: "AVAILABLE" as const, direction: "DEBIT" as const, amount: adjAmount },
          { owner: "house" as const, accountType: "AVAILABLE" as const, direction: "CREDIT" as const, amount: adjAmount },
        ];

  const result = await postJournal(db, {
    userId: input.targetUserId,
    type: "ADJUSTMENT",
    currency: targetUser.currency,
    idempotencyKey,
    amount: adjAmount,
    memo: `Manual adjustment [${input.reasonCode}]: ${input.notes}`,
    lines,
  });

  // Record mandatory audit log
  await db.auditLog.create({
    data: {
      actorType: "ADMIN",
      adminId: input.adminUserId,
      subjectId: input.targetUserId,
      action: `MANUAL_ADJUSTMENT_${input.direction}`,
      entity: "LedgerJournal",
      entityId: result.journal.id,
      payload: {
        amount: adjAmount.toFixed(8),
        direction: input.direction,
        reasonCode: input.reasonCode,
        notes: input.notes,
      },
    },
  });

  return result;
}
