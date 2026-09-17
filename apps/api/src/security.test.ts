import { describe, expect, it, beforeEach } from "vitest";
import { createApp } from "./app.js";
import { getClientIp, resetRateLimitStore } from "./middleware/rate-limiter.js";

describe("Anti-DDoS & Security Middleware", () => {
  const app = createApp();

  beforeEach(() => {
    resetRateLimitStore();
  });

  describe("Security Headers", () => {
    it("attaches platform security headers to responses", async () => {
      const res = await app.request("/health");
      expect(res.status).toBe(200);
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
      expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    });
  });

  describe("Client IP Extraction", () => {
    it("prioritizes cf-connecting-ip over x-forwarded-for", () => {
      const c = {
        req: {
          header: (name: string) => {
            if (name === "cf-connecting-ip") return "203.0.113.195";
            if (name === "x-forwarded-for") return "198.51.100.1, 192.168.1.1";
            return undefined;
          },
        },
      };
      expect(getClientIp(c)).toBe("203.0.113.195");
    });

    it("parses first IP from multi-hop x-forwarded-for", () => {
      const c = {
        req: {
          header: (name: string) => {
            if (name === "x-forwarded-for") return "198.51.100.42, 10.0.0.1, 10.0.0.2";
            return undefined;
          },
        },
      };
      expect(getClientIp(c)).toBe("198.51.100.42");
    });

    it("falls back to 127.0.0.1 if no proxy headers are present", () => {
      const c = {
        req: {
          header: () => undefined,
        },
      };
      expect(getClientIp(c)).toBe("127.0.0.1");
    });
  });

  describe("Rate Limiting", () => {
    it("enforces auth endpoint rate limit (10 requests/min)", async () => {
      const testIp = "192.0.2.100";
      const headers = {
        "content-type": "application/json",
        "cf-connecting-ip": testIp,
      };

      // Perform 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        const res = await app.request("/api/auth/login", {
          method: "POST",
          headers,
          body: JSON.stringify({ email: "invalid-email", password: "x" }),
        });
        expect(res.headers.get("ratelimit-limit")).toBe("10");
        expect(res.status).not.toBe(429);
      }

      // The 11th request must be blocked
      const blockedRes = await app.request("/api/auth/login", {
        method: "POST",
        headers,
        body: JSON.stringify({ email: "invalid-email", password: "x" }),
      });

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.headers.get("retry-after")).toBeDefined();
      expect(blockedRes.headers.get("ratelimit-remaining")).toBe("0");

      const body = await blockedRes.json();
      expect(body).toMatchObject({
        error: "RATE_LIMIT_EXCEEDED",
      });
      expect(typeof body.retryAfter).toBe("number");
    });

    it("isolates rate limits by client IP", async () => {
      const ipA = "192.0.2.101";
      const ipB = "192.0.2.102";

      // Max out ipA
      for (let i = 0; i < 10; i++) {
        await app.request("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json", "cf-connecting-ip": ipA },
          body: JSON.stringify({ email: "invalid-a", password: "short" }),
        });
      }

      // ipA is blocked
      const resA = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json", "cf-connecting-ip": ipA },
        body: JSON.stringify({ email: "invalid-a", password: "short" }),
      });
      expect(resA.status).toBe(429);

      // ipB is NOT blocked
      const resB = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json", "cf-connecting-ip": ipB },
        body: JSON.stringify({ email: "invalid-b", password: "short" }),
      });
      expect(resB.status).not.toBe(429);
    });
  });

  describe("Body Size Limiter", () => {
    it("rejects payloads exceeding the 128KB limit with 413 Payload Too Large", async () => {
      // 140 KB string
      const largeString = "a".repeat(140 * 1024);
      const res = await app.request("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "cf-connecting-ip": "192.0.2.200",
        },
        body: JSON.stringify({ email: "test@test.local", data: largeString }),
      });

      expect(res.status).toBe(413);
      const body = await res.json();
      expect(body).toMatchObject({
        error: "PAYLOAD_TOO_LARGE",
      });
    });
  });
});
