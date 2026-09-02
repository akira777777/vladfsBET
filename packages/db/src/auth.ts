import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";
import { creditDemo, ensurePlayerWallets } from "./ledger";

const scrypt = promisify(scryptCb);
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DEMO_CREDIT = "1000";

export class AuthError extends Error {
  constructor(
    public readonly code:
      | "UNDERAGE"
      | "EMAIL_TAKEN"
      | "PHONE_TAKEN"
      | "INVALID_CREDENTIALS"
      | "TERMS_REQUIRED"
      | "WEAK_PASSWORD"
      | "ACCOUNT_BLOCKED",
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  country: string;
  currency: string;
  dateOfBirth: string;
  phone?: string;
  promoCode?: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  rgAcknowledged: boolean;
  ip?: string;
  userAgent?: string;
};

export type LoginInput = {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !keyHex) {
    return false;
  }
  const key = (await scrypt(password, Buffer.from(saltHex, "hex"), 64)) as Buffer;
  const expected = Buffer.from(keyHex, "hex");
  if (key.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(key, expected);
}

function ageOn(dateOfBirth: Date, now = new Date()): number {
  let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const month = now.getUTCMonth() - dateOfBirth.getUTCMonth();
  if (month < 0 || (month === 0 && now.getUTCDate() < dateOfBirth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

async function minAgeFor(db: PrismaClient, country: string): Promise<number> {
  const jurisdiction = await db.jurisdiction.findUnique({ where: { country } });
  return jurisdiction?.minAge ?? 18;
}

function publicUser(user: {
  id: string;
  email: string;
  country: string;
  currency: string;
  status: string;
  kycStatus: string;
  realMoneyEligible: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    country: user.country,
    currency: user.currency,
    status: user.status,
    kycStatus: user.kycStatus,
    realMoneyEligible: user.realMoneyEligible,
  };
}

async function createSession(
  db: PrismaClient,
  userId: string,
  meta?: { ip?: string; userAgent?: string },
) {
  const sessionToken = randomBytes(32).toString("hex");
  await db.session.create({
    data: {
      userId,
      tokenHash: hashToken(sessionToken),
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return sessionToken;
}

export async function registerPlayer(db: PrismaClient, input: RegisterInput) {
  if (!input.termsAccepted || !input.privacyAccepted || !input.rgAcknowledged) {
    throw new AuthError("TERMS_REQUIRED", "Terms, privacy and responsible-gaming acknowledgement are required");
  }
  if (input.password.length < 10) {
    throw new AuthError("WEAK_PASSWORD", "Password must be at least 10 characters");
  }

  const email = normalizeEmail(input.email);
  const dateOfBirth = new Date(`${input.dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(dateOfBirth.getTime())) {
    throw new AuthError("UNDERAGE", "Date of birth is invalid");
  }
  const minAge = await minAgeFor(db, input.country);
  if (ageOn(dateOfBirth) < minAge) {
    throw new AuthError("UNDERAGE", `Minimum age is ${minAge}`);
  }

  const now = new Date();
  const passwordHash = await hashPassword(input.password);

  let user;
  try {
    user = await db.user.create({
      data: {
        email,
        phone: input.phone?.trim() || null,
        passwordHash,
        country: input.country,
        currency: input.currency,
        dateOfBirth,
        promoCode: input.promoCode,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
        rgAcknowledgedAt: now,
        registrationIp: input.ip,
        registrationCountry: input.country,
        status: "ACTIVE",
        realMoneyEligible: false,
        profile: {
          create: {
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
          },
        },
        consents: {
          create: [
            { kind: "terms", granted: true, version: "v1", ip: input.ip },
            { kind: "privacy", granted: true, version: "v1", ip: input.ip },
            { kind: "responsible_gaming", granted: true, version: "v1", ip: input.ip },
          ],
        },
      },
    });
  } catch (error) {
    const code = (error as { code?: string }).code;
    const target = (error as { meta?: { target?: string[] } }).meta?.target ?? [];
    if (code === "P2002" && target.includes("phone")) {
      throw new AuthError("PHONE_TAKEN", "Phone already registered");
    }
    if (code === "P2002") {
      throw new AuthError("EMAIL_TAKEN", "Email already registered");
    }
    throw error;
  }

  await ensurePlayerWallets(db, user.id, user.currency);
  await creditDemo(db, user.id, user.currency, DEMO_CREDIT, `welcome-demo:${user.id}`);

  const bronze = await db.vipLevel.findUnique({ where: { slug: "bronze" } });
  if (bronze) {
    await db.vipProgress.create({
      data: { userId: user.id, levelId: bronze.id },
    });
  }

  const welcome = await db.bonusTemplate.findUnique({ where: { slug: "welcome-demo" } });
  if (welcome) {
    await db.playerBonus.create({
      data: {
        userId: user.id,
        templateId: welcome.id,
        status: "COMPLETED",
        awarded: DEMO_CREDIT,
        activatedAt: now,
      },
    });
  }

  const sessionToken = await createSession(db, user.id, input);
  return { user: publicUser(user), sessionToken };
}

export async function loginPlayer(db: PrismaClient, input: LoginInput) {
  const email = normalizeEmail(input.email);
  const user = await db.user.findUnique({ where: { email } });
  const ok = user ? await verifyPassword(input.password, user.passwordHash) : false;

  if (!user || !ok) {
    if (user) {
      await db.loginEvent.create({
        data: { userId: user.id, success: false, ip: input.ip, userAgent: input.userAgent, reason: "bad_password" },
      });
    }
    throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password");
  }

  if (["LOCKED", "CLOSED", "SUSPENDED", "SELF_EXCLUDED"].includes(user.status)) {
    await db.loginEvent.create({
      data: { userId: user.id, success: false, ip: input.ip, userAgent: input.userAgent, reason: user.status },
    });
    throw new AuthError("ACCOUNT_BLOCKED", "Account cannot sign in");
  }

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await db.loginEvent.create({
    data: { userId: user.id, success: true, ip: input.ip, userAgent: input.userAgent },
  });

  const sessionToken = await createSession(db, user.id, input);
  return { user: publicUser(user), sessionToken };
}

export async function getSessionUser(db: PrismaClient, sessionToken: string | undefined | null) {
  if (!sessionToken) {
    return null;
  }
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(sessionToken) },
    include: { user: true },
  });
  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }
  await db.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });
  return publicUser(session.user);
}

export async function revokeSession(db: PrismaClient, sessionToken: string | undefined | null) {
  if (!sessionToken) {
    return;
  }
  await db.session.updateMany({
    where: { tokenHash: hashToken(sessionToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getUserSessions(db: PrismaClient, userId: string, currentSessionToken?: string) {
  const currentHash = currentSessionToken ? hashToken(currentSessionToken) : null;
  const sessions = await db.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    ip: s.ip ?? "Unknown IP",
    userAgent: s.userAgent ?? "Unknown Browser / Device",
    lastSeenAt: s.lastSeenAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
    isCurrent: currentHash ? s.tokenHash === currentHash : false,
  }));
}

export async function revokeOtherSessions(db: PrismaClient, userId: string, currentSessionToken: string) {
  const currentHash = hashToken(currentSessionToken);
  return db.session.updateMany({
    where: {
      userId,
      tokenHash: { not: currentHash },
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

export async function changePassword(
  db: PrismaClient,
  userId: string,
  oldPass: string,
  newPass: string,
) {
  if (newPass.length < 10) {
    throw new AuthError("WEAK_PASSWORD", "New password must be at least 10 characters");
  }

  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const ok = await verifyPassword(oldPass, user.passwordHash);
  if (!ok) {
    throw new AuthError("INVALID_CREDENTIALS", "Current password is incorrect");
  }

  const newHash = await hashPassword(newPass);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      actorType: "PLAYER",
      subjectId: userId,
      action: "PASSWORD_CHANGED",
      entity: "User",
      entityId: userId,
    },
  });

  return { ok: true };
}

export async function updateUserProfile(
  db: PrismaClient,
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    address1?: string;
    city?: string;
    postalCode?: string;
  },
) {
  const profile = await db.profile.upsert({
    where: { userId },
    create: {
      userId,
      firstName: data.firstName ?? "Player",
      lastName: data.lastName ?? "",
      address1: data.address1,
      city: data.city,
      postalCode: data.postalCode,
    },
    update: {
      firstName: data.firstName,
      lastName: data.lastName,
      address1: data.address1,
      city: data.city,
      postalCode: data.postalCode,
    },
  });

  return profile;
}

