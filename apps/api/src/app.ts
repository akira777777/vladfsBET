import "./setup-env.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { ZodError, z } from "zod";
import {
  AdminError,
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
  adminManualBalanceAdjustment,
  adminRejectWithdrawal,
  adminReviewKycCase,
  adminUpdatePlayerStatus,
  applyCoolingOff,
  applySelfExclusion,
  changePassword,
  claimBonusTemplate,
  claimVipCashback,
  createPlayerTicket,
  creditDemo,
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
  processDeposit,
  redeemPromoCode,
  registerPlayer,
  requestWithdrawal,
  resolveAmlAlert,
  revokeOtherSessions,
  revokeSession,
  setResponsibleGamingLimit,
  submitKycDocument,
  updateUserProfile,
  updateTicketStatus,
} from "@vladfsbet/db";
import { evaluateTransactionRisk } from "@vladfsbet/db";

const COOKIE = "vladfsbet_session";
const ADMIN_COOKIE = "vladfsbet_admin_session";

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

const creditSchema = z.object({
  amount: z.string().default("100"),
});

const depositSchema = z.object({
  providerId: z.string(),
  method: z.string(),
  amount: z.string(),
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

const promoCodeSchema = z.object({
  code: z.string().min(1),
});

const claimBonusSchema = z.object({
  templateSlug: z.string(),
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

function clientMeta(c: { req: { header: (name: string) => string | undefined } }) {
  return {
    ip: c.req.header("x-forwarded-for") ?? "127.0.0.1",
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

export function createApp() {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
      credentials: true,
    }),
  );

  app.onError((error, c) => {
    if (error instanceof ZodError) {
      return c.json({ error: "INVALID_INPUT", message: error.issues[0]?.message ?? "Invalid input" }, 400);
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
      return c.json({ error: error.code, message: error.message }, 400);
    }
    console.error("API error:", error);
    return c.json({ error: "INTERNAL", message: "Unexpected error" }, 500);
  });

  // Health checks
  app.get("/health", (c) => c.json({ ok: true, service: "vladfsbet-api", timestamp: new Date() }));
  app.get("/ready", async (c) => {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ ok: true, database: "connected" });
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
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        vipProgress: { include: { level: true } },
      },
    });

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
    const items = await prisma.moneyTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        status: true,
        currency: true,
        amount: true,
        createdAt: true,
      },
    });
    return c.json({
      items: items.map((item) => ({
        ...item,
        amount: item.amount.toFixed(8),
      })),
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

  app.post("/api/wallet/demo-credit", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = creditSchema.parse((await c.req.json().catch(() => ({}))) ?? {});
    const key = c.req.header("idempotency-key") ?? `demo-credit:${user.id}:${body.amount}:${Date.now()}`;
    await creditDemo(prisma, user.id, user.currency, body.amount, key);
    const snapshot = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({ wallet: snapshot, realMoney: false });
  });

  app.post("/api/wallet/deposit", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = depositSchema.parse(await c.req.json());

    // Risk evaluation
    await evaluateTransactionRisk(prisma, user.id, "DEPOSIT", body.amount);

    const key = c.req.header("idempotency-key") ?? `dep:${user.id}:${Date.now()}`;
    const result = await processDeposit(prisma, {
      userId: user.id,
      providerId: body.providerId,
      method: body.method,
      amount: body.amount,
      currency: user.currency,
      idempotencyKey: key,
    });
    const snapshot = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({ deposit: result.deposit, wallet: snapshot });
  });

  app.post("/api/wallet/withdrawal", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = withdrawalSchema.parse(await c.req.json());

    // Risk evaluation
    await evaluateTransactionRisk(prisma, user.id, "WITHDRAWAL", body.amount);

    const key = c.req.header("idempotency-key") ?? `wd:${user.id}:${Date.now()}`;
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
    const category = c.req.query("category");
    const search = c.req.query("search");

    const where: Record<string, any> = {
      active: true,
      demoAvailable: true,
    };
    if (category && category !== "ALL") {
      where.category = category as any;
    }
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const games = await prisma.game.findMany({
      where,
      include: { provider: true },
      orderBy: { title: "asc" },
    });

    return c.json({
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
    });
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
    const slug = c.req.param("slug");
    const game = await prisma.game.findUnique({
      where: { slug },
      include: { provider: true },
    });
    if (!game || !game.active) return c.json({ error: "GAME_NOT_FOUND" }, 404);

    return c.json({
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
    });
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
    const sport = c.req.query("sport");
    const events = await prisma.sportEvent.findMany({
      where: sport ? { sport } : undefined,
      include: { markets: true },
      orderBy: { startsAt: "asc" },
    });
    return c.json({ items: events });
  });

  app.post("/api/sports/bet", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = sportBetSchema.parse(await c.req.json());
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

  app.post("/api/bonuses/claim", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = claimBonusSchema.parse(await c.req.json());
    const bonus = await claimBonusTemplate(prisma, user.id, body.templateSlug);
    const wallet = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({ bonus, wallet });
  });

  app.post("/api/bonuses/redeem-code", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = promoCodeSchema.parse(await c.req.json());
    const result = await redeemPromoCode(prisma, user.id, body.code);
    const wallet = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({ result, wallet });
  });

  app.post("/api/vip/claim-cashback", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const result = await claimVipCashback(prisma, user.id);
    const wallet = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({ result, wallet });
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
    const body = ticketMessageSchema.parse(await c.req.json());
    const message = await addTicketMessage(prisma, c.req.param("id"), user.id, "PLAYER", body.body);
    return c.json({ message }, 201);
  });

  // ----------------------------------------------------
  // Admin Panel APIs
  // ----------------------------------------------------
  app.post("/api/admin/auth/login", async (c) => {
    const body = loginSchema.parse(await c.req.json());
    const result = await loginAdmin(prisma, { ...body, ...clientMeta(c) });
    setSessionCookie(c, `admin_${result.admin.id}`, ADMIN_COOKIE);
    return c.json(result);
  });

  app.get("/api/admin/overview", async (c) => {
    const stats = await getAdminStatsOverview(prisma);
    return c.json({ stats });
  });

  app.get("/api/admin/players", async (c) => {
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
    const body = z.object({ status: z.any(), reason: z.string() }).parse(await c.req.json());
    const updated = await adminUpdatePlayerStatus(prisma, "admin-system", c.req.param("id"), body.status, body.reason);
    return c.json({ player: updated });
  });

  app.get("/api/admin/withdrawals", async (c) => {
    const withdrawals = await prisma.withdrawal.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, kycStatus: true } }, provider: true },
      take: 50,
    });
    return c.json({ items: withdrawals });
  });

  app.post("/api/admin/withdrawals/:id/approve", async (c) => {
    const body = z.object({ reviewNote: z.string().optional() }).parse((await c.req.json().catch(() => ({}))) ?? {});
    const updated = await adminApproveWithdrawal(prisma, c.req.param("id"), "admin-system", body.reviewNote);
    return c.json({ withdrawal: updated });
  });

  app.post("/api/admin/withdrawals/:id/reject", async (c) => {
    const body = z.object({ reason: z.string().min(3) }).parse(await c.req.json());
    const updated = await adminRejectWithdrawal(prisma, c.req.param("id"), "admin-system", body.reason);
    return c.json({ withdrawal: updated });
  });

  app.post("/api/admin/ledger/adjust", async (c) => {
    const body = z
      .object({
        targetUserId: z.string().uuid(),
        amount: z.string(),
        direction: z.enum(["CREDIT", "DEBIT"]),
        reasonCode: z.enum(["CORRECTION", "DISPUTE_SETTLEMENT", "GOODWILL", "TEST_CREDIT"]),
        notes: z.string().min(5),
      })
      .parse(await c.req.json());

    const result = await adminManualBalanceAdjustment(prisma, {
      adminUserId: "admin-system",
      targetUserId: body.targetUserId,
      amount: body.amount,
      direction: body.direction,
      reasonCode: body.reasonCode,
      notes: body.notes,
    });
    return c.json({ result });
  });

  app.get("/api/admin/kyc", async (c) => {
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

    const updated = await adminReviewKycCase(prisma, c.req.param("id"), "admin-system", body.decision, body.reviewNote);
    return c.json({ kycCase: updated });
  });

  app.get("/api/admin/risk/alerts", async (c) => {
    const alerts = await prisma.amlAlert.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, country: true } } },
      take: 50,
    });
    return c.json({ items: alerts });
  });

  app.post("/api/admin/risk/alerts/:id/resolve", async (c) => {
    const body = z.object({ notes: z.string().optional() }).parse((await c.req.json().catch(() => ({}))) ?? {});
    const updated = await resolveAmlAlert(prisma, c.req.param("id"), "admin-system", body.notes);
    return c.json({ alert: updated });
  });

  app.get("/api/admin/support/tickets", async (c) => {
    const tickets = await getAdminTickets(prisma);
    return c.json({ items: tickets });
  });

  app.post("/api/admin/support/tickets/:id/message", async (c) => {
    const body = z.object({ body: z.string().min(1), internal: z.boolean().default(false) }).parse(await c.req.json());
    const message = await addTicketMessage(prisma, c.req.param("id"), "admin-system", "ADMIN", body.body, body.internal);
    return c.json({ message });
  });

  app.get("/api/admin/audit-logs", async (c) => {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return c.json({ items: logs });
  });

  return app;
}
