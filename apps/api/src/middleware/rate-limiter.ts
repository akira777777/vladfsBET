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
 * Creates an isolated set of rate limiters with its own in-memory store.
 * Used inside createApp() to ensure clean isolation per instance and in tests.
 */
export function createRateLimiters() {
  const memoryStore = new Map<string, RateLimitRecord>();
  let burstTimestamps: number[] = [];

  const burstProtection = (burstLimit = 40, windowMs = 5000): MiddlewareHandler => {
    return async (c, next) => {
      if (c.req.header("x-bypass-rate-limit") === "1" && process.env.NODE_ENV === "test") {
        return next();
      }

      const now = Date.now();
      const windowStart = now - windowMs;
      burstTimestamps = burstTimestamps.filter((ts) => ts > windowStart);

      if (burstTimestamps.length >= burstLimit) {
        const oldest = burstTimestamps[0] ?? now;
        const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));

        c.header("Retry-After", String(retryAfter));
        c.header("Cache-Control", "no-store");
        c.header("RateLimit-Limit", String(burstLimit));
        c.header("RateLimit-Remaining", "0");
        c.header("RateLimit-Reset", String(retryAfter));

        return c.json(
          {
            error: "RATE_LIMITED",
            message: "Flood protection: instance burst limit reached. Please slow down.",
            retryAfter,
          },
          429,
        );
      }

      burstTimestamps.push(now);
      await next();
    };
  };

  const createLimiter = (options: RateLimiterOptions): MiddlewareHandler => {
    const {
      windowMs = 60_000,
      limit,
      keyPrefix = "rl",
      keyGenerator = (c) => `${keyPrefix}:${getClientIp(c)}`,
      message = "Too many requests. Please try again later.",
      skip,
    } = options;

    return async (c, next) => {
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
        c.header("Cache-Control", "no-store");
        c.header("RateLimit-Remaining", "0");

        return c.json(
          {
            error: "RATE_LIMITED",
            message,
            retryAfter: retryAfterSeconds,
          },
          429,
        );
      }

      record.timestamps.push(now);
      await next();
    };
  };

  return {
    burst: burstProtection(40, 5000),
    auth: createLimiter({
      keyPrefix: "auth-shared",
      windowMs: 60_000,
      limit: 10,
      message: "Too many authentication attempts. Please slow down and try again in a minute.",
    }),
    wallet: createLimiter({
      keyPrefix: "wallet",
      windowMs: 60_000,
      limit: 20,
      message: "Too many wallet transactions requested. Please wait before retrying.",
    }),
    gameplay: createLimiter({
      keyPrefix: "gameplay",
      windowMs: 60_000,
      limit: 60,
      message: "Action velocity limit reached. Please wait a moment.",
    }),
    global: createLimiter({
      keyPrefix: "global",
      windowMs: 60_000,
      limit: 120,
      message: "Rate limit exceeded. Please wait a minute before making more requests.",
      skip: (c) => {
        const path = c.req.path;
        return path === "/health" || path === "/ready" || path === "/favicon.ico" || path === "/";
      },
    }),
    reset: () => {
      memoryStore.clear();
      burstTimestamps = [];
    },
  };
}

// Singleton for backward compatibility if needed
const defaultLimiters = createRateLimiters();
export const resetRateLimitStore = () => defaultLimiters.reset();
export const rateLimitProfiles = {
  auth: defaultLimiters.auth,
  wallet: defaultLimiters.wallet,
  gameplay: defaultLimiters.gameplay,
  global: defaultLimiters.global,
};
export const globalBurstProtection = defaultLimiters.burst;
