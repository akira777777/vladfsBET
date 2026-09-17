import type { Context, MiddlewareHandler } from "hono";

export interface RateLimiterOptions {
  /** Time window in milliseconds (default: 60,000ms / 1 min) */
  windowMs?: number;
  /** Maximum requests allowed in the window */
  limit: number;
  /** Key prefix for namespacing */
  keyPrefix?: string;
  /** Custom key generator (default uses client IP) */
  keyGenerator?: (c: Context) => string;
  /** Custom error message */
  message?: string;
  /** Optional skip condition */
  skip?: (c: Context) => boolean;
}

interface RateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitRecord>();

// Periodic cleanup every 60s to prevent unbounded memory growth
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    // Retain only timestamps from the last 5 minutes
    const valid = record.timestamps.filter((ts) => now - ts < 300_000);
    if (valid.length === 0) {
      memoryStore.delete(key);
    } else {
      record.timestamps = valid;
    }
  }
}, 60_000);

// Ensure cleanup timer does not prevent process exit in Node
if (cleanupTimer && typeof cleanupTimer.unref === "function") {
  cleanupTimer.unref();
}

/**
 * Extracts client IP securely considering Cloudflare and reverse-proxy headers
 */
export function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  const cfIp = c.req.header("cf-connecting-ip");
  if (cfIp && cfIp.trim()) return cfIp.trim();

  const realIp = c.req.header("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();

  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  return "127.0.0.1";
}

/**
 * Resets the in-memory store (primarily used for test suites)
 */
export function resetRateLimitStore(): void {
  memoryStore.clear();
}

/**
 * Creates a sliding-window rate limiting middleware for Hono
 */
export function rateLimiter(options: RateLimiterOptions): MiddlewareHandler {
  const {
    windowMs = 60_000,
    limit,
    keyPrefix = "rl",
    keyGenerator = (c) => `${keyPrefix}:${getClientIp(c)}`,
    message = "Too many requests. Please try again later.",
    skip,
  } = options;

  return async (c, next) => {
    // Allow bypassing in test suite if requested
    if (skip && skip(c)) {
      return next();
    }

    if (c.req.header("x-bypass-rate-limit") === "1" && process.env.NODE_ENV === "test") {
      return next();
    }

    const key = keyGenerator(c);
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = memoryStore.get(key);
    if (!record) {
      record = { timestamps: [] };
      memoryStore.set(key, record);
    }

    // Keep only timestamps within the current sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    const currentUsage = record.timestamps.length;
    const remaining = Math.max(0, limit - currentUsage - 1);
    const resetSeconds = Math.max(1, Math.ceil(windowMs / 1000));

    c.header("RateLimit-Limit", String(limit));
    c.header("RateLimit-Remaining", String(remaining));
    c.header("RateLimit-Reset", String(resetSeconds));

    if (currentUsage >= limit) {
      const oldestInWindow = record.timestamps[0] ?? now;
      const retryAfterSeconds = Math.max(1, Math.ceil((oldestInWindow + windowMs - now) / 1000));

      c.header("Retry-After", String(retryAfterSeconds));
      c.header("RateLimit-Remaining", "0");

      return c.json(
        {
          error: "RATE_LIMIT_EXCEEDED",
          message,
          retryAfter: retryAfterSeconds,
        },
        429,
      );
    }

    record.timestamps.push(now);
    await next();
  };
}

/**
 * Pre-configured rate limiting profiles for VladfsBET
 */
export const rateLimitProfiles = {
  /**
   * Auth endpoints: 10 requests / minute
   * Mitigates credential stuffing and brute-force registration/login
   */
  auth: rateLimiter({
    keyPrefix: "auth",
    windowMs: 60_000,
    limit: 10,
    message: "Too many authentication attempts. Please slow down and try again in a minute.",
  }),

  /**
   * Financial / Wallet endpoints: 20 requests / minute
   * Prevents deposit/withdrawal spam and ledger contention
   */
  wallet: rateLimiter({
    keyPrefix: "wallet",
    windowMs: 60_000,
    limit: 20,
    message: "Too many wallet transactions requested. Please wait before retrying.",
  }),

  /**
   * Game rounds & Sports bets: 60 requests / minute
   * Blocks bot auto-clickers and socket flooding
   */
  gameplay: rateLimiter({
    keyPrefix: "gameplay",
    windowMs: 60_000,
    limit: 60,
    message: "Action velocity limit reached. Please wait a moment.",
  }),

  /**
   * Global API protection: 120 requests / minute per IP
   */
  global: rateLimiter({
    keyPrefix: "global",
    windowMs: 60_000,
    limit: 120,
    message: "Rate limit exceeded. Please wait a minute before making more requests.",
    skip: (c) => {
      // Don't limit static assets or health checks
      const path = c.req.path;
      return path === "/health" || path === "/ready" || path === "/favicon.ico" || path === "/";
    },
  }),
};
