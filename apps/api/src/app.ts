import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { ZodError, z } from "zod";
import { getClientIp, createRateLimiters } from "./middleware/rate-limiter.js";
import { adaptiveBodyLimit, platformSecureHeaders, requestTimeout } from "./middleware/security.js";
import {
  AdminError,
  type AdminActor,
  Prisma,
  assertAdminPermission,
  AuthError,
  BonusError,
  KycError,
  LedgerError,
  PlayError,
  RgError,
  RiskError,
  SportsError,
  SupportError,
  addTicketMessage,
  adminApproveWithdrawal,
  adminRejectWithdrawal,
  adminReviewKycCase,
  adminUpdatePlayerStatus,
  applyCoolingOff,
  applySelfExclusion,
  changePassword,
  createPlayerTicket,
  getAdminSession,
  getAdminStatsOverview,
  getAdminTickets,
  getOrCreatePlayerKycCase,
  getPlayerRgSummary,
  getPlayerSportBets,
  getPlayerTickets,
  getSessionUser,
  getUserSessions,
  getWalletSnapshot,
  loginAdmin,
  loginPlayer,
  playDemoGame,
  placeSportBet,
  postJournal,
  prisma,
  registerPlayer,
  requestWithdrawal,
  resolveAmlAlert,
  revokeAdminSession,
  revokeOtherSessions,
  revokeSession,
  setResponsibleGamingLimit,
  submitKycDocument,
  updateUserProfile,
  updateTicketStatus,
  checkPlayerEligibleToPlay,
  checkWagerLimit,
} from "@vladfsbet/db";
import { evaluateTransactionRisk } from "@vladfsbet/db";

const COOKIE = "vladfsbet_session";
const ADMIN_COOKIE = "vladfsbet_admin_session";

type AppEnv = {
  Variables: {
    requestId: string;
    admin?: AdminActor;
  };
};

// In-memory high performance TTL cache
const responseCache = new Map<string, { data: unknown; expiresAt: number }>();

// Periodic cleanup of expired cache entries (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of responseCache.entries()) {
      if (now > entry.expiresAt) {
        responseCache.delete(key);
      }
    }
    // Also enforce max size by removing oldest entries
    if (responseCache.size > 1000) {
      const keysToDelete = responseCache.size - 1000;
      const iterator = responseCache.keys();
      for (let i = 0; i < keysToDelete; i++) {
        const key = iterator.next().value;
        if (key) responseCache.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

function getCached<T>(key: string): T | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T, ttlMs: number): void {
  if (responseCache.size > 1000) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// Schemas
const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(10),
  country: z.string().length(2),
  currency: z.string().length(3),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: z.string().min(6).optional(),
  promoCode: z.string().optional(),
  termsAccepted: z.boolean(),
  privacyAccepted: z.boolean(),
  rgAcknowledged: z.boolean(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(10),
});

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  address1: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
});

const withdrawalSchema = z.object({
  providerId: z.string(),
  method: z.string(),
  amount: z.string(),
});

const playSchema = z.object({
  betAmount: z.string(),
  gameData: z.record(z.unknown()).optional(),
});

const sportBetSchema = z.object({
  eventId: z.string(),
  marketId: z.string(),
  selectionName: z.string(),
  odds: z.string(),
  stake: z.string(),
});

const kycUploadSchema = z.object({
  type: z.enum(["PASSPORT", "NATIONAL_ID", "DRIVERS_LICENSE", "UTILITY_BILL", "BANK_STATEMENT"]),
  fileName: z.string(),
  fileBufferBase64: z.string().optional(),
});

const rgLimitSchema = z.object({
  type: z.enum(["DEPOSIT", "LOSS", "WAGER", "SESSION_TIME"]),
  amount: z.string().optional(),
  minutes: z.number().optional(),
  periodHours: z.number().default(24),
});

const coolingOffSchema = z.object({
  hours: z.number().min(24).max(720), // 1 to 30 days
  reason: z.string().optional(),
});

const selfExclusionSchema = z.object({
  months: z.number().optional(),
  permanent: z.boolean().default(false),
  reason: z.string().optional(),
});

const ticketSchema = z.object({
  subject: z.string().min(3),
  category: z.string().default("GENERAL"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  message: z.string().min(5),
});

const ticketMessageSchema = z.object({
  body: z.string().min(1),
});

const gameCategorySchema = z.enum([
  "SLOTS",
  "NEW",
  "POPULAR",
  "JACKPOTS",
  "TABLE_GAMES",
  "ROULETTE",
  "BLACKJACK",
  "BACCARAT",
  "POKER",
  "CRASH",
  "LIVE_CASINO",
]);

const gamesQuerySchema = z.object({
  category: z.union([z.literal("ALL"), gameCategorySchema]).default("ALL"),
  search: z.string().trim().max(100).default(""),
});

const updatePlayerStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "LOCKED"]),
  reason: z.string().trim().min(3).max(500),
});

function clientMeta(c: { req: { header: (name: string) => string | undefined } }) {
  return {
    ip: getClientIp(c),
    userAgent: c.req.header("user-agent") ?? undefined,
  };
}

function setSessionCookie(c: Parameters<typeof setCookie>[0], token: string, name = COOKIE) {
  setCookie(c, name, token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });
}

function requireAdminPermission(c: { get: (key: "admin") => AdminActor | undefined }, key: string) {
  const admin = c.get("admin");
  if (!admin) {
    throw new AdminError("UNAUTHORIZED", "Admin sign in required");
  }
  assertAdminPermission(admin, key);
  return admin;
}

export function createApp() {
  const app = new Hono<AppEnv>();
  const limiters = createRateLimiters();

  app.use("*", async (c, next) => {
    const incoming = c.req.header("x-request-id")?.trim();
    const requestId = incoming && incoming.length <= 128 ? incoming : randomUUID();
    c.set("requestId", requestId);
    c.header("x-request-id", requestId);
    const started = Date.now();
    await next();
    const status = c.res.status;
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      requestId,
      method: c.req.method,
      path: c.req.path,
      status,
      ms: Date.now() - started,
      ip: getClientIp(c),
    });
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  });

  // 1. Per-client burst flood protection (40 requests in 10s)
  app.use("*", limiters.burst);

  // 2. Security headers (HSTS, frameguard, nosniff, referrer-policy)
  app.use("*", platformSecureHeaders);

  // 3. Start the deadline before reading the request body.
  app.use("*", requestTimeout);

  // 4. Adaptive payload size limits (128KB standard, 10MB for KYC documents)
  app.use("*", adaptiveBodyLimit);

  // 5. CORS
  const ALLOWED_ORIGINS = new Set([
    process.env.PUBLIC_APP_URL,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ].filter(Boolean) as string[]);

  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) return "";
        if (ALLOWED_ORIGINS.has(origin)) return origin;
        // Allow Vercel preview deployments
        if (origin.endsWith(".vercel.app")) return origin;
        return "";
      },
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With", "Idempotency-Key"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    }),
  );

  // 6. Rate Limiting layers
  app.use("/api/*", limiters.global);
  app.use("/api/auth/*", limiters.auth);
  app.use("/api/admin/auth/*", limiters.auth);
  app.use("/api/wallet/*", limiters.wallet);
  app.use("/api/games/*/play", limiters.gameplay);
  app.use("/api/sports/bet", limiters.gameplay);

  app.use("/api/admin/*", async (c, next) => {
    if (c.req.path === "/api/admin/auth/login") {
      return next();
    }
    const admin = await getAdminSession(prisma, getCookie(c, ADMIN_COOKIE));
    if (!admin) {
      return c.json(
        { error: "UNAUTHENTICATED", message: "Admin sign in required", requestId: c.get("requestId") },
        401,
      );
    }
    c.set("admin", admin);
    await next();
  });

  app.onError((error, c) => {
    const requestId = c.get("requestId");
    if (error instanceof HTTPException) {
      return error.getResponse();
    }
    if (error instanceof ZodError) {
      return c.json({ error: "INVALID_INPUT", message: error.issues[0]?.message ?? "Invalid input", requestId }, 400);
    }
    if (error instanceof AuthError && error.code === "UNDERAGE") {
      return c.json({ error: error.code, message: error.message, requestId }, 403);
    }
    if (error instanceof AdminError && error.code === "UNAUTHORIZED") {
      return c.json({ error: error.code, message: error.message, requestId }, 401);
    }
    if (error instanceof AdminError && error.code === "FORBIDDEN") {
      return c.json({ error: error.code, message: error.message, requestId }, 403);
    }
    if (
      error instanceof AuthError ||
      error instanceof LedgerError ||
      error instanceof PlayError ||
      error instanceof RgError ||
      error instanceof BonusError ||
      error instanceof SportsError ||
      error instanceof KycError ||
      error instanceof RiskError ||
      error instanceof SupportError ||
      error instanceof AdminError
    ) {
      return c.json({ error: error.code, message: error.message, requestId }, 400);
    }
    console.error("API error:", error);
    return c.json({ error: "INTERNAL", message: (error as Error)?.message ?? "Unexpected error", requestId }, 500);
  });

  // Root & Health checks
  app.get("/", (c) =>
    c.json({
      name: "VladfsBET API",
      version: "1.0.0",
      status: "operational",
      environment: process.env.NODE_ENV ?? "production",
      endpoints: {
        health: "/health",
        ready: "/ready",
        games: "/api/games",
        me: "/api/auth/me",
        wallet: "/api/wallet",
      },
    }),
  );
  app.get("/favicon.ico", (c) => c.body(null, 204));
  app.get("/health", (c) => c.json({ ok: true, service: "vladfsbet-api", timestamp: new Date() }));
  app.get("/ready", async (c) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return c.json({ ok: true, database: "connected" });
    } catch (err) {
      return c.json({ ok: false, database: "disconnected", error: (err as Error)?.message }, 503);
    }
  });

  // ----------------------------------------------------
  // Auth Endpoints
  // ----------------------------------------------------
  app.post("/api/auth/register", async (c) => {
    const body = registerSchema.parse(await c.req.json());
    const result = await registerPlayer(prisma, { ...body, ...clientMeta(c) });
    setSessionCookie(c, result.sessionToken);
    return c.json({ user: result.user }, 201);
  });

  app.post("/api/auth/login", async (c) => {
    const body = loginSchema.parse(await c.req.json());
    const result = await loginPlayer(prisma, { ...body, ...clientMeta(c) });
    setSessionCookie(c, result.sessionToken);
    return c.json({ user: result.user });
  });

  app.post("/api/auth/logout", async (c) => {
    await revokeSession(prisma, getCookie(c, COOKIE));
    deleteCookie(c, COOKIE, { path: "/" });
    return c.json({ ok: true });
  });

  app.get("/api/auth/me", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) {
      return c.json({ error: "UNAUTHENTICATED", message: "Sign in required" }, 401);
    }
    const [fullUser, snapshot] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        include: {
          profile: true,
          vipProgress: { include: { level: true } },
        },
      }),
      getWalletSnapshot(prisma, user.id, user.currency),
    ]);

    return c.json({
      user: {
        ...user,
        profile: fullUser?.profile,
        vipTier: fullUser?.vipProgress?.level
          ? {
              name: fullUser.vipProgress.level.name,
              slug: fullUser.vipProgress.level.slug,
              points: fullUser.vipProgress.points.toFixed(0),
              rank: fullUser.vipProgress.level.rank,
              cashbackBps: fullUser.vipProgress.level.cashbackBps,
            }
          : undefined,
      },
      wallet: snapshot,
    });
  });

  app.post("/api/auth/change-password", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = changePasswordSchema.parse(await c.req.json());
    await changePassword(prisma, user.id, body.oldPassword, body.newPassword);
    return c.json({ ok: true, message: "Password updated successfully" });
  });

  app.post("/api/auth/profile", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = updateProfileSchema.parse(await c.req.json());
    const profile = await updateUserProfile(prisma, user.id, body);
    return c.json({ profile });
  });

  app.get("/api/auth/sessions", async (c) => {
    const token = getCookie(c, COOKIE);
    const user = await getSessionUser(prisma, token);
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const sessions = await getUserSessions(prisma, user.id, token);
    return c.json({ sessions });
  });

  app.post("/api/auth/sessions/revoke-others", async (c) => {
    const token = getCookie(c, COOKIE);
    const user = await getSessionUser(prisma, token);
    if (!user || !token) return c.json({ error: "UNAUTHENTICATED" }, 401);
    await revokeOtherSessions(prisma, user.id, token);
    return c.json({ ok: true });
  });

  // ----------------------------------------------------
  // Wallet & Payments
  // ----------------------------------------------------
  app.get("/api/wallet", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const snapshot = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({ wallet: snapshot, realMoney: false });
  });

  app.get("/api/wallet/transactions", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const cursor = c.req.query("cursor");
    const limit = Math.min(Number(c.req.query("limit") ?? 50), 100);
    const items = await prisma.moneyTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        type: true,
        status: true,
        currency: true,
        amount: true,
        createdAt: true,
      },
    });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return c.json({
      items: page.map((item) => ({
        ...item,
        amount: item.amount.toFixed(8),
      })),
      nextCursor: hasMore ? page[page.length - 1]?.id : null,
    });
  });

  app.get("/api/wallet/payment-methods", async (c) => {
    const providers = await prisma.paymentProvider.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return c.json({
      items: providers.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        sandbox: p.sandbox,
      })),
    });
  });

  app.post("/api/wallet/withdrawal", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = withdrawalSchema.parse(await c.req.json());

    // Risk evaluation — block high-risk withdrawals
    const riskResult = await evaluateTransactionRisk(prisma, user.id, "WITHDRAWAL", body.amount);
    if (!riskResult.passed) {
      return c.json(
        {
          error: "WITHDRAWAL_RISK_BLOCKED",
          message: "Withdrawal flagged for manual review. Please contact support.",
          requestId: c.get("requestId"),
        },
        403,
      );
    }

    const key = c.req.header("idempotency-key") ?? `wd:${user.id}:${body.providerId}:${body.amount}:${Math.floor(Date.now() / 60000)}`;
    const result = await requestWithdrawal(prisma, {
      userId: user.id,
      providerId: body.providerId,
      method: body.method,
      amount: body.amount,
      currency: user.currency,
      idempotencyKey: key,
    });
    const snapshot = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({ withdrawal: result.withdrawal, wallet: snapshot });
  });

  // ----------------------------------------------------
  // Casino Games
  // ----------------------------------------------------
  app.get("/api/games", async (c) => {
    c.header("Cache-Control", "public, max-age=15, stale-while-revalidate=60");
    const { category, search } = gamesQuerySchema.parse(c.req.query());
    const cacheKey = `games:${category}:${search}`;

    const cached = getCached<unknown>(cacheKey);
    if (cached) {
      return c.json(cached);
    }

    const where: Prisma.GameWhereInput = {
      active: true,
      demoAvailable: true,
      category: category === "ALL" ? undefined : category,
      title: search ? { contains: search, mode: "insensitive" } : undefined,
    };

    const games = await prisma.game.findMany({
      where,
      include: { provider: true },
      orderBy: { title: "asc" },
    });

    const payload = {
      items: games.map((game) => ({
        id: game.id,
        slug: game.slug,
        title: game.title,
        category: game.category,
        provider: game.provider.name,
        description: game.description,
        rtpBps: game.rtpBps,
        volatility: game.volatility,
        minBet: game.minBet?.toFixed(2),
        maxBet: game.maxBet?.toFixed(2),
        tags: game.tags,
        demo: true,
      })),
    };

    setCached(cacheKey, payload, 30_000);
    return c.json(payload);
  });

  app.get("/api/games/favorites", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const rows = await prisma.favoriteGame.findMany({
      where: { userId: user.id },
      include: { game: true },
    });
    return c.json({ slugs: rows.map((row) => row.game.slug) });
  });

  app.post("/api/games/:slug/favorite", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const slug = c.req.param("slug");
    const game = await prisma.game.findUnique({ where: { slug } });
    if (!game || !game.active) return c.json({ error: "GAME_NOT_FOUND" }, 404);

    const existing = await prisma.favoriteGame.findUnique({
      where: { userId_gameId: { userId: user.id, gameId: game.id } },
    });
    if (existing) {
      await prisma.favoriteGame.delete({
        where: { userId_gameId: { userId: user.id, gameId: game.id } },
      });
    } else {
      await prisma.favoriteGame.create({
        data: { userId: user.id, gameId: game.id },
      });
    }

    const rows = await prisma.favoriteGame.findMany({
      where: { userId: user.id },
      include: { game: true },
    });
    return c.json({ favorited: !existing, slugs: rows.map((row) => row.game.slug) });
  });

  app.get("/api/games/:slug", async (c) => {
    c.header("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
    const slug = c.req.param("slug");
    const cacheKey = `game:${slug}`;
    const cached = getCached<unknown>(cacheKey);
    if (cached) {
      return c.json(cached);
    }

    const game = await prisma.game.findUnique({
      where: { slug },
      include: { provider: true },
    });
    if (!game || !game.active) return c.json({ error: "GAME_NOT_FOUND" }, 404);

    const payload = {
      game: {
        id: game.id,
        slug: game.slug,
        title: game.title,
        category: game.category,
        provider: game.provider.name,
        description: game.description,
        rtpBps: game.rtpBps,
        volatility: game.volatility,
        minBet: game.minBet?.toFixed(2),
        maxBet: game.maxBet?.toFixed(2),
        tags: game.tags,
        demo: true,
      },
    };

    setCached(cacheKey, payload, 60_000);
    return c.json(payload);
  });

  app.post("/api/games/:slug/play", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = playSchema.parse(await c.req.json());
    const result = await playDemoGame(prisma, {
      userId: user.id,
      slug: c.req.param("slug"),
      betAmount: body.betAmount,
      gameData: body.gameData,
    });
    const wallet = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({
      mode: result.mode,
      game: result.game,
      betAmount: result.betAmount,
      winAmount: result.winAmount,
      multiplier: result.multiplier,
      roundId: result.round.id,
      gameResult: result.gameResult,
      provablyFair: result.provablyFair,
      wallet,
    });
  });

  // ----------------------------------------------------
  // Sportsbook
  // ----------------------------------------------------
  app.get("/api/sports/events", async (c) => {
    c.header("Cache-Control", "public, max-age=10, stale-while-revalidate=30");
    const sport = c.req.query("sport") ?? "ALL";
    const cacheKey = `sports:${sport}`;
    const cached = getCached<unknown>(cacheKey);
    if (cached) {
      return c.json(cached);
    }

    const events = await prisma.sportEvent.findMany({
      where: sport !== "ALL" ? { sport } : undefined,
      include: { markets: true },
      orderBy: { startsAt: "asc" },
    });
    const payload = { items: events };
    setCached(cacheKey, payload, 15_000);
    return c.json(payload);
  });

  app.post("/api/sports/bet", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = sportBetSchema.parse(await c.req.json());

    // Responsible Gaming checks (self-exclusion + wager limits)
    await checkPlayerEligibleToPlay(prisma, user.id);
    await checkWagerLimit(prisma, user.id, body.stake);

    const bet = await placeSportBet(prisma, {
      userId: user.id,
      eventId: body.eventId,
      marketId: body.marketId,
      selectionName: body.selectionName,
      odds: body.odds,
      stake: body.stake,
    });
    const wallet = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({ bet, wallet });
  });

  app.get("/api/sports/my-bets", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const bets = await getPlayerSportBets(prisma, user.id);
    return c.json({ items: bets });
  });

  // ----------------------------------------------------
  // Bonuses & VIP
  // ----------------------------------------------------
  app.get("/api/bonuses", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const bonuses = await prisma.playerBonus.findMany({
      where: { userId: user.id },
      include: { template: true, bonusWallet: true },
      orderBy: { createdAt: "desc" },
    });
    return c.json({
      items: bonuses.map((b) => ({
        id: b.id,
        slug: b.template.slug,
        name: b.template.name,
        type: b.template.type,
        awarded: b.awarded.toFixed(2),
        status: b.status,
        remaining: b.bonusWallet?.remaining.toFixed(2) ?? "0.00",
        wagered: b.bonusWallet?.wagered.toFixed(2) ?? "0.00",
        wageringRequired: b.bonusWallet?.wageringRequired.toFixed(2) ?? "0.00",
        terms: b.template.terms,
      })),
    });
  });

  app.get("/api/bonuses/templates", async (c) => {
    const templates = await prisma.bonusTemplate.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });
    return c.json({ items: templates });
  });

  // ----------------------------------------------------
  // KYC Verification
  // ----------------------------------------------------
  app.get("/api/kyc/case", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const kycCase = await getOrCreatePlayerKycCase(prisma, user.id);
    return c.json({ kycCase });
  });

  app.post("/api/kyc/upload", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = kycUploadSchema.parse(await c.req.json());
    const result = await submitKycDocument(prisma, {
      userId: user.id,
      type: body.type,
      fileName: body.fileName,
      fileBufferBase64: body.fileBufferBase64,
    });
    return c.json({ result });
  });

  // ----------------------------------------------------
  // Responsible Gaming
  // ----------------------------------------------------
  app.get("/api/responsible-gaming/summary", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const summary = await getPlayerRgSummary(prisma, user.id);
    return c.json({ summary });
  });

  app.post("/api/responsible-gaming/limit", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = rgLimitSchema.parse(await c.req.json());
    const limit = await setResponsibleGamingLimit(prisma, {
      userId: user.id,
      type: body.type,
      amount: body.amount,
      minutes: body.minutes,
      periodHours: body.periodHours,
    });
    return c.json({ limit });
  });

  app.post("/api/responsible-gaming/cooling-off", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = coolingOffSchema.parse(await c.req.json());
    const result = await applyCoolingOff(prisma, {
      userId: user.id,
      hours: body.hours,
      reason: body.reason,
    });
    deleteCookie(c, COOKIE, { path: "/" });
    return c.json(result);
  });

  app.post("/api/responsible-gaming/self-exclude", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = selfExclusionSchema.parse(await c.req.json());
    const result = await applySelfExclusion(prisma, {
      userId: user.id,
      months: body.months,
      permanent: body.permanent,
      reason: body.reason,
    });
    deleteCookie(c, COOKIE, { path: "/" });
    return c.json(result);
  });

  // ----------------------------------------------------
  // Player Notifications
  // ----------------------------------------------------
  app.get("/api/notifications", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) {
      return c.json({
        items: [
          {
            id: "anon-welcome",
            title: "Welcome to VladfsBET",
            message: "Register your free demo account to claim 1,000 complimentary credits and test our provably fair games.",
            timestamp: "Now",
            type: "BONUS",
            read: false,
          },
          {
            id: "anon-provably-fair",
            title: "Provably Fair RNG Verification",
            message: "All Vladfs Originals utilize HMAC-SHA256 seed commitments for mathematical transparency.",
            timestamp: "1h ago",
            type: "SECURITY",
            read: true,
          },
        ],
      });
    }

    const [transactions, kycCase, vipProgress] = await Promise.all([
      prisma.moneyTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.kycCase.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vipProgress.findUnique({
        where: { userId: user.id },
        include: { level: true },
      }),
    ]);

    const items = [];

    if (vipProgress?.level) {
      items.push({
        id: `vip-${vipProgress.level.slug}`,
        title: `${vipProgress.level.name} Tier Active`,
        message: `Your VIP tier awards ${(vipProgress.level.cashbackBps / 100).toFixed(1)}% weekly cashback on net gaming activity.`,
        timestamp: "Active",
        type: "BONUS",
        read: false,
      });
    }

    if (kycCase) {
      items.push({
        id: `kyc-${kycCase.id}`,
        title: kycCase.status === "APPROVED" ? "Identity Verification Approved" : "KYC Case Under Review",
        message:
          kycCase.status === "APPROVED"
            ? "Your regulatory compliance documents have been verified by staff."
            : "Your uploaded documents are queued for compliance review.",
        timestamp: kycCase.updatedAt.toLocaleDateString(),
        type: "SECURITY",
        read: kycCase.status === "APPROVED",
      });
    }

    for (const tx of transactions) {
      items.push({
        id: `tx-${tx.id}`,
        title: `${tx.type} ${tx.status === "COMPLETED" ? "Confirmed" : tx.status}`,
        message: `${tx.amount.toFixed(2)} ${tx.currency} double-entry ledger transaction processed.`,
        timestamp: tx.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "WALLET",
        read: true,
      });
    }

    items.push({
      id: "platform-tourney-live",
      title: "Active Leaderboard Sprint",
      message: "The Gates of Vladfs Grand Sprint is live with 10,000x multiplier prizes!",
      timestamp: "Today",
      type: "TOURNAMENT",
      read: false,
    });

    return c.json({ items });
  });

  // ----------------------------------------------------
  // Customer Support
  // ----------------------------------------------------
  app.get("/api/support/tickets", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const tickets = await getPlayerTickets(prisma, user.id);
    return c.json({ items: tickets });
  });

  app.post("/api/support/tickets", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = ticketSchema.parse(await c.req.json());
    const ticket = await createPlayerTicket(prisma, {
      userId: user.id,
      subject: body.subject,
      category: body.category,
      priority: body.priority,
      message: body.message,
    });
    return c.json({ ticket }, 201);
  });

  app.post("/api/support/tickets/:id/message", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    // Verify ticket ownership to prevent IDOR
    const ticket = await prisma.supportTicket.findUnique({ where: { id: c.req.param("id") } });
    if (!ticket || ticket.userId !== user.id) {
      return c.json({ error: "TICKET_NOT_FOUND", message: "Support ticket not found", requestId: c.get("requestId") }, 404);
    }
    const body = ticketMessageSchema.parse(await c.req.json());
    const message = await addTicketMessage(prisma, ticket.id, user.id, "PLAYER", body.body);
    return c.json({ message }, 201);
  });

  // ----------------------------------------------------
  // Admin Panel APIs
  // ----------------------------------------------------
  app.post("/api/admin/auth/login", async (c) => {
    const body = loginSchema.parse(await c.req.json());
    const result = await loginAdmin(prisma, { ...body, ...clientMeta(c) });
    setSessionCookie(c, result.sessionToken, ADMIN_COOKIE);
    return c.json({ admin: result.admin });
  });

  app.get("/api/admin/auth/me", async (c) => {
    return c.json({ admin: c.get("admin") });
  });

  app.post("/api/admin/auth/logout", async (c) => {
    await revokeAdminSession(prisma, getCookie(c, ADMIN_COOKIE));
    deleteCookie(c, ADMIN_COOKIE, { path: "/" });
    return c.json({ ok: true });
  });

  app.get("/api/admin/overview", async (c) => {
    requireAdminPermission(c, "analytics.read");
    const stats = await getAdminStatsOverview(prisma);
    return c.json({ stats });
  });

  app.get("/api/admin/players", async (c) => {
    requireAdminPermission(c, "players.read");
    const search = c.req.query("search");
    const players = await prisma.user.findMany({
      where: {
        email: { not: "house@internal.vladfsbet", contains: search ?? undefined, mode: "insensitive" },
      },
      include: {
        profile: true,
        wallets: { include: { accounts: true } },
        kycCases: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return c.json({
      items: players.map((p) => ({
        id: p.id,
        email: p.email,
        name: p.profile ? `${p.profile.firstName} ${p.profile.lastName}` : "Unnamed",
        country: p.country,
        currency: p.currency,
        status: p.status,
        kycStatus: p.kycStatus,
        createdAt: p.createdAt.toISOString(),
        availableBalance: p.wallets[0]?.accounts.find((a) => a.type === "AVAILABLE")?.cachedBalance.toFixed(2) ?? "0.00",
      })),
    });
  });

  app.post("/api/admin/players/:id/status", async (c) => {
    const admin = requireAdminPermission(c, "players.write");
    const body = updatePlayerStatusSchema.parse(await c.req.json());
    const updated = await adminUpdatePlayerStatus(prisma, admin.id, c.req.param("id"), body.status, body.reason);
    return c.json({ player: updated });
  });

  app.get("/api/admin/withdrawals", async (c) => {
    requireAdminPermission(c, "withdrawals.review");
    const withdrawals = await prisma.withdrawal.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, kycStatus: true } }, provider: true },
      take: 50,
    });
    return c.json({ items: withdrawals });
  });

  app.post("/api/admin/withdrawals/:id/approve", async (c) => {
    const admin = requireAdminPermission(c, "withdrawals.review");
    const body = z.object({ reviewNote: z.string().optional() }).parse((await c.req.json().catch(() => ({}))) ?? {});
    const updated = await adminApproveWithdrawal(prisma, c.req.param("id"), admin.id, body.reviewNote);
    return c.json({ withdrawal: updated });
  });

  app.post("/api/admin/withdrawals/:id/reject", async (c) => {
    const admin = requireAdminPermission(c, "withdrawals.review");
    const body = z.object({ reason: z.string().min(3) }).parse(await c.req.json());
    const updated = await adminRejectWithdrawal(prisma, c.req.param("id"), admin.id, body.reason);
    return c.json({ withdrawal: updated });
  });

  app.get("/api/admin/kyc", async (c) => {
    requireAdminPermission(c, "kyc.review");
    const cases = await prisma.kycCase.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, country: true } }, documents: true },
      take: 50,
    });
    return c.json({ items: cases });
  });

  app.post("/api/admin/kyc/:id/review", async (c) => {
    const body = z
      .object({
        decision: z.enum(["APPROVED", "REJECTED", "REQUIRES_INFORMATION"]),
        reviewNote: z.string().optional(),
      })
      .parse(await c.req.json());

    const admin = requireAdminPermission(c, "kyc.review");
    const updated = await adminReviewKycCase(prisma, c.req.param("id"), admin.id, body.decision, body.reviewNote);
    return c.json({ kycCase: updated });
  });

  app.get("/api/admin/risk/alerts", async (c) => {
    requireAdminPermission(c, "risk.review");
    const alerts = await prisma.amlAlert.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, country: true } } },
      take: 50,
    });
    return c.json({ items: alerts });
  });

  app.post("/api/admin/risk/alerts/:id/resolve", async (c) => {
    const body = z.object({ notes: z.string().optional() }).parse((await c.req.json().catch(() => ({}))) ?? {});
    const admin = requireAdminPermission(c, "risk.review");
    const updated = await resolveAmlAlert(prisma, c.req.param("id"), admin.id, body.notes);
    return c.json({ alert: updated });
  });

  app.get("/api/admin/support/tickets", async (c) => {
    requireAdminPermission(c, "support.read");
    const tickets = await getAdminTickets(prisma);
    return c.json({ items: tickets });
  });

  app.post("/api/admin/support/tickets/:id/message", async (c) => {
    const admin = requireAdminPermission(c, "support.write");
    const body = z.object({ body: z.string().min(1), internal: z.boolean().default(false) }).parse(await c.req.json());
    const message = await addTicketMessage(prisma, c.req.param("id"), admin.id, "ADMIN", body.body, body.internal);
    return c.json({ message });
  });

  app.get("/api/admin/audit-logs", async (c) => {
    requireAdminPermission(c, "audit.read");
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { admin: { select: { email: true, name: true } } },
      take: 100,
    });
    return c.json({ items: logs });
  });

  // ----------------------------------------------------
  // CMS & Content Management
  // ----------------------------------------------------
  app.get("/api/cms/entries", async (c) => {
    const type = c.req.query("type");
    const locale = c.req.query("locale") || "en";

    const entries = await prisma.cmsEntry.findMany({
      where: {
        published: true,
        ...(type ? { type } : {}),
        locale,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (entries.length === 0 && (!type || type === "banner")) {
      return c.json({
        items: [
          {
            id: "fallback-banner-1",
            type: "banner",
            slug: "gates-of-vladfs",
            locale: "en",
            title: "Gates of Vladfs 10,000x Megaways",
            published: true,
            body: {
              subtitle: "Zeus lightning multipliers up to 25x and tumbling reels",
              ctaText: "Play Slot",
              ctaUrl: "/casino/gates-of-vladfs",
              badge: "HOT RELEASE",
              accent: "gold",
            },
          },
          {
            id: "fallback-banner-2",
            type: "banner",
            slug: "vip-cashback",
            locale: "en",
            title: "VIP Loyalty Club Cashback",
            published: true,
            body: {
              subtitle: "Up to 15% weekly automated cashback across 5 tiers",
              ctaText: "Explore VIP",
              ctaUrl: "/vip",
              badge: "EXCLUSIVE",
              accent: "purple",
            },
          },
          {
            id: "fallback-banner-3",
            type: "banner",
            slug: "provably-fair-originals",
            locale: "en",
            title: "Provably Fair Cryptographic Originals",
            published: true,
            body: {
              subtitle: "HMAC-SHA256 verified outcomes with instant client-seed verifier",
              ctaText: "Verify Fairness",
              ctaUrl: "/provably-fair",
              badge: "RNG CERTIFIED",
              accent: "cyan",
            },
          },
        ],
      });
    }

    return c.json({ items: entries });
  });

  app.get("/api/admin/cms", async (c) => {
    requireAdminPermission(c, "cms.read");
    const type = c.req.query("type");
    const items = await prisma.cmsEntry.findMany({
      where: type ? { type } : undefined,
      orderBy: { updatedAt: "desc" },
    });
    return c.json({ items });
  });

  app.post("/api/admin/cms", async (c) => {
    const admin = requireAdminPermission(c, "cms.write");
    const schema = z.object({
      id: z.string().uuid().optional(),
      type: z.string().min(1),
      slug: z.string().min(1),
      locale: z.string().default("en"),
      title: z.string().min(1),
      body: z.any(),
      published: z.boolean().default(false),
    });
    const body = schema.parse(await c.req.json());

    const entry = body.id
      ? await prisma.cmsEntry.update({
          where: { id: body.id },
          data: {
            type: body.type,
            slug: body.slug,
            locale: body.locale,
            title: body.title,
            body: body.body,
            published: body.published,
          },
        })
      : await prisma.cmsEntry.upsert({
          where: {
            type_slug_locale: {
              type: body.type,
              slug: body.slug,
              locale: body.locale,
            },
          },
          update: {
            title: body.title,
            body: body.body,
            published: body.published,
          },
          create: {
            type: body.type,
            slug: body.slug,
            locale: body.locale,
            title: body.title,
            body: body.body,
            published: body.published,
          },
        });

    await prisma.auditLog.create({
      data: {
        actorType: "ADMIN",
        adminId: admin.id,
        action: body.id ? "CMS_ENTRY_UPDATED" : "CMS_ENTRY_CREATED",
        entity: "CmsEntry",
        entityId: entry.id,
        ip: getClientIp(c),
        payload: { type: entry.type, slug: entry.slug, title: entry.title, published: entry.published },
      },
    });

    return c.json({ entry });
  });

  app.delete("/api/admin/cms/:id", async (c) => {
    const admin = requireAdminPermission(c, "cms.write");
    const id = c.req.param("id");
    await prisma.cmsEntry.delete({ where: { id } }).catch(() => undefined);

    await prisma.auditLog.create({
      data: {
        actorType: "ADMIN",
        adminId: admin.id,
        action: "CMS_ENTRY_DELETED",
        entity: "CmsEntry",
        entityId: id,
        ip: getClientIp(c),
      },
    });

    return c.json({ ok: true });
  });

  // ----------------------------------------------------
  // Analytics & Event Ingestion
  // ----------------------------------------------------
  app.post("/api/analytics/event", async (c) => {
    const schema = z.object({
      event: z.string().min(1).max(64),
      properties: z.record(z.any()).optional(),
      path: z.string().optional(),
    });
    const body = schema.parse(await c.req.json().catch(() => ({})));

    // Persist analytics events — fire-and-forget to avoid blocking response
    const user = await getSessionUser(prisma, getCookie(c, COOKIE)).catch(() => null);
    prisma.auditLog.create({
      data: {
        actorType: user ? "PLAYER" : "SYSTEM",
        subjectId: user?.id,
        action: `ANALYTICS_${body.event.toUpperCase()}`,
        entity: "Analytics",
        ip: getClientIp(c),
        payload: { event: body.event, properties: body.properties, path: body.path },
      },
    }).catch(() => { /* Silently fail — analytics must not crash the API */ });

    return c.json({ ok: true, received: true, event: body.event });
  });

  app.get("/api/admin/analytics", async (c) => {
    requireAdminPermission(c, "analytics.read");

    // Check cache first
    const cacheKey = "admin:analytics:overview";
    const cached = getCached(cacheKey);
    if (cached) {
      return c.json(cached);
    }

    // Single aggregated query for overview counts
    const [overviewResult] = await prisma.$queryRaw<
      Array<{
        total_users: bigint;
        active_users: bigint;
        kyc_approved: bigint;
        deposits_count: bigint;
        withdrawals_count: bigint;
        bets_count: bigint;
      }>
    >`SELECT
      (SELECT count(*) FROM "users" WHERE email <> 'house@internal.vladfsbet') as total_users,
      (SELECT count(*) FROM "users" WHERE status = 'ACTIVE' AND email <> 'house@internal.vladfsbet') as active_users,
      (SELECT count(*) FROM "kyc_cases" WHERE status = 'APPROVED') as kyc_approved,
      (SELECT count(*) FROM "money_transactions" WHERE type = 'DEPOSIT' AND status = 'COMPLETED') as deposits_count,
      (SELECT count(*) FROM "money_transactions" WHERE type = 'WITHDRAWAL' AND status = 'COMPLETED') as withdrawals_count,
      (SELECT count(*) FROM "game_sessions") as bets_count`;

    const totalUsers = Number(overviewResult.total_users);
    const activeUsers = Number(overviewResult.active_users);
    const kycApproved = Number(overviewResult.kyc_approved);
    const depositsCount = Number(overviewResult.deposits_count);
    const withdrawalsCount = Number(overviewResult.withdrawals_count);
    const betsCount = Number(overviewResult.bets_count);

    const funnel = [
      { stage: "Platform Visitors", count: Math.max(totalUsers * 12, 1000) },
      { stage: "Registered Players", count: totalUsers },
      { stage: "KYC Verified", count: kycApproved },
      { stage: "First Deposit", count: depositsCount },
      { stage: "Active Bettors", count: Math.min(activeUsers, Math.max(betsCount, 1)) },
    ];

    // Aggregate category distribution in single query with JOIN
    const categoryTurnover = await prisma.$queryRaw<
      Array<{ category: string; total: Prisma.Decimal }>
    >`SELECT g.category, COALESCE(SUM(gr."betAmount"), 0) as total
      FROM "game_rounds" gr
      JOIN "games" g ON gr."gameId" = g.id
      WHERE gr.status = 'SETTLED'
      GROUP BY g.category
      ORDER BY total DESC`;

    const totalTurnover = categoryTurnover.reduce(
      (s, v) => s.add(v.total),
      new Prisma.Decimal(0)
    );
    const categoryDistribution = categoryTurnover.map((v) => ({
      name: v.category,
      share: totalTurnover.gt(0) ? Number(v.total.div(totalTurnover).mul(100).toFixed(1)) : 0,
      turnover: v.total.toFixed(2),
    }));

    const response = {
      overview: {
        totalUsers,
        activeUsers,
        depositsCount,
        withdrawalsCount,
        betsCount,
      },
      funnel,
      categoryDistribution,
    };

    // Cache for 5 minutes
    setCached(cacheKey, response, 5 * 60 * 1000);
    return c.json(response);
  });

  return app;
}
