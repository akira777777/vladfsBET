import { randomUUID } from "node:crypto";
import ipaddr from "ipaddr.js";
import { createClient } from "redis";
import type { Context, MiddlewareHandler } from "hono";

export interface RateLimiterOptions {
  windowMs?: number;
  limit: number;
  keyPrefix?: string;
  message?: string;
  skip?: (c: Context) => boolean;
}

interface Result { allowed: boolean; remaining: number; retryAfterMs: number }
interface Record { timestamps: number[] }
type Store = (key: string, now: number, windowMs: number, limit: number) => Promise<Result>;

const MAX_LOCAL_KEYS = 20_000;

function parseIp(value: string | undefined): ipaddr.IPv4 | ipaddr.IPv6 | undefined {
  if (!value) return undefined;
  try { return ipaddr.process(value.trim().replace(/^\[|\]$/g, "")); } catch { return undefined; }
}

function canonicalIp(value: string | undefined): string | undefined { return parseIp(value)?.toString(); }

function configuredProxyRanges(): Array<[ipaddr.IPv4 | ipaddr.IPv6, number]> {
  return (process.env.TRUSTED_PROXY_CIDRS ?? "").split(",").map((value) => value.trim()).filter(Boolean)
    .flatMap((value) => { try { return [ipaddr.parseCIDR(value)]; } catch { return []; } });
}

function trustedProxy(value: string | undefined): boolean {
  const address = parseIp(value);
  return Boolean(address && configuredProxyRanges().some(([range, bits]) =>
    address.kind() === range.kind() && address.match(range as never, bits)));
}

/** Uses forwarding headers only when the hosting platform or proxy is explicitly trusted. */
export function getClientIp(c: {
  req: { header: (name: string) => string | undefined };
  env?: { incoming?: { socket?: { remoteAddress?: string } } };
}): string {
  if (process.env.VERCEL === "1") {
    return canonicalIp(c.req.header("x-vercel-forwarded-for")?.split(",")[0]) ?? "unknown";
  }
  if (process.env.TRUSTED_PROXY_PROVIDER === "cloudflare") {
    return canonicalIp(c.req.header("cf-connecting-ip")) ?? "unknown";
  }

  const peer = canonicalIp(c.env?.incoming?.socket?.remoteAddress);
  if (peer && trustedProxy(peer)) {
    const forwarded = (c.req.header("x-forwarded-for") ?? "").split(",")
      .map((value) => canonicalIp(value)).filter(Boolean) as string[];
    let client = peer;
    for (let index = forwarded.length - 1; index >= 0 && trustedProxy(client); index--) client = forwarded[index]!;
    return client;
  }
  return peer ?? "local";
}

function bucketForIp(ip: string): string {
  const address = parseIp(ip);
  if (!address || address.kind() === "ipv4") return address?.toString() ?? ip;
  const prefix = address.toByteArray().slice(0, 8).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `ipv6-64:${prefix}`;
}

function createMemoryStore(): { consume: Store; reset: () => void } {
  const records = new Map<string, Record>();
  return {
    async consume(key, now, windowMs, limit) {
      const record = records.get(key) ?? { timestamps: [] };
      record.timestamps = record.timestamps.filter((timestamp) => timestamp > now - windowMs);
      if (!records.has(key) && records.size >= MAX_LOCAL_KEYS) {
        const oldest = records.keys().next().value as string | undefined;
        if (oldest) records.delete(oldest);
      }
      if (records.has(key)) records.delete(key);
      records.set(key, record);
      if (record.timestamps.length >= limit) {
        return { allowed: false, remaining: 0, retryAfterMs: Math.max(1, record.timestamps[0]! + windowMs - now) };
      }
      record.timestamps.push(now);
      return { allowed: true, remaining: limit - record.timestamps.length, retryAfterMs: windowMs };
    },
    reset: () => records.clear(),
  };
}

const REDIS_SCRIPT = `
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1] - ARGV[2])
local count = redis.call('ZCARD', KEYS[1])
if count >= tonumber(ARGV[3]) then
  local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
  return {0, 0, math.max(1, oldest[2] + ARGV[2] - ARGV[1])}
end
redis.call('ZADD', KEYS[1], ARGV[1], ARGV[4])
redis.call('PEXPIRE', KEYS[1], ARGV[2])
return {1, tonumber(ARGV[3]) - count - 1, tonumber(ARGV[2])}
`;

let redisClient: ReturnType<typeof createClient> | undefined;
let redisConnect: Promise<unknown> | undefined;
let redisUnavailableUntil = 0;
let lastRedisLog = 0;

async function sharedRedisStore(key: string, now: number, windowMs: number, limit: number): Promise<Result> {
  if (now < redisUnavailableUntil) throw new Error("Redis rate-limit circuit is open");
  try {
    redisClient ??= createClient({
      url: process.env.REDIS_URL,
      socket: { connectTimeout: 1_500, reconnectStrategy: false },
      disableOfflineQueue: true,
    }).on("error", () => undefined);
    if (!redisClient.isReady) redisConnect ??= redisClient.connect().finally(() => { redisConnect = undefined; });
    await redisConnect;
    const raw = await redisClient.eval(REDIS_SCRIPT, {
      keys: [`vladfsbet:rate-limit:${key}`],
      arguments: [String(now), String(windowMs), String(limit), `${now}:${randomUUID()}`],
    }) as number[];
    return { allowed: raw[0] === 1, remaining: raw[1] ?? 0, retryAfterMs: raw[2] ?? windowMs };
  } catch (error) {
    redisUnavailableUntil = Date.now() + 30_000;
    if (Date.now() - lastRedisLog > 30_000) {
      console.error("Shared rate limiter unavailable; using local protection:", (error as Error).message);
      lastRedisLog = Date.now();
    }
    throw error;
  }
}

function shouldUseRedis(): boolean {
  return Boolean(process.env.REDIS_URL) &&
    (process.env.NODE_ENV === "production" || process.env.RATE_LIMIT_USE_REDIS === "true");
}

export function createRateLimiters() {
  const local = createMemoryStore();
  const limiter = (options: RateLimiterOptions): MiddlewareHandler => async (c, next) => {
    if (c.req.method === "OPTIONS" || options.skip?.(c)) return next();
    const windowMs = options.windowMs ?? 60_000;
    const prefix = options.keyPrefix ?? "rl";
    const key = `${prefix}:${bucketForIp(getClientIp(c))}`;
    const now = Date.now();
    let result: Result;
    try {
      result = shouldUseRedis()
        ? await sharedRedisStore(key, now, windowMs, options.limit)
        : await local.consume(key, now, windowMs, options.limit);
    } catch {
      result = await local.consume(key, now, windowMs, options.limit);
    }

    const retryAfter = Math.max(1, Math.ceil(result.retryAfterMs / 1_000));
    c.header("RateLimit-Limit", String(options.limit));
    c.header("RateLimit-Remaining", String(result.remaining));
    c.header("RateLimit-Reset", String(retryAfter));
    c.header("RateLimit-Policy", `${options.limit};w=${Math.ceil(windowMs / 1_000)}`);
    if (!result.allowed) {
      c.header("Retry-After", String(retryAfter));
      c.header("Cache-Control", "no-store");
      return c.json({ error: "RATE_LIMITED", message: options.message ?? "Too many requests.", retryAfter }, 429);
    }
    return next();
  };

  return {
    burst: limiter({ keyPrefix: "burst", windowMs: 10_000, limit: 40, message: "Request burst limit exceeded." }),
    global: limiter({ keyPrefix: "global", windowMs: 60_000, limit: 240 }),
    auth: limiter({ keyPrefix: "auth", windowMs: 60_000, limit: 10, message: "Too many authentication attempts." }),
    wallet: limiter({ keyPrefix: "wallet", windowMs: 60_000, limit: 30, message: "Too many wallet requests." }),
    gameplay: limiter({ keyPrefix: "gameplay", windowMs: 60_000, limit: 60, message: "Action velocity limit reached." }),
    reset: local.reset,
  };
}

const defaults = createRateLimiters();
export const resetRateLimitStore = defaults.reset;
export const globalBurstProtection = defaults.burst;
export const rateLimitProfiles = defaults;
