import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { resetRateLimitStore } from "./middleware/rate-limiter.js";

const app = createApp();

beforeEach(() => {
  resetRateLimitStore();
});

function cookieFrom(response: Response): string {
  const raw = response.headers.get("set-cookie") ?? "";
  return raw.split(";")[0] ?? "";
}

function registerBody() {
  return {
    firstName: "Nico",
    lastName: "Player",
    email: `api-${randomUUID()}@vladfsbet.local`,
    password: "Correct-Horse-Battery-9",
    country: "ZZ",
    currency: "EUR",
    dateOfBirth: "1992-08-20",
    termsAccepted: true,
    privacyAccepted: true,
    rgAcknowledged: true,
  };
}

describe("api", () => {
  it("reports health and readiness", async () => {
    const health = await app.request("/health");
    expect(health.status).toBe(200);
    const ready = await app.request("/ready");
    expect(ready.status).toBe(200);
  });

  it("registers, shows demo wallet, and plays a sandbox game", async () => {
    const registered = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(registerBody()),
    });
    expect(registered.status).toBe(201);
    const cookie = cookieFrom(registered);
    expect(cookie.startsWith("vladfsbet_session=")).toBe(true);

    const me = await app.request("/api/auth/me", { headers: { cookie } });
    const wallet = await app.request("/api/wallet", { headers: { cookie } });
    const walletBody = await wallet.json();
    expect(walletBody.realMoney).toBe(false);
    expect(walletBody.wallet.available).toBe("1000.00000000");

    const play = await app.request("/api/games/gates-of-vladfs/play", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ betAmount: "50" }),
    });
    expect(play.status).toBe(200);
    const playBody = await play.json();
    expect(playBody.mode).toBe("DEMO");
    expect(playBody.wallet.available).not.toBe("1000.00000000");
  });

  it("rejects underage registration", async () => {
    const response = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...registerBody(), dateOfBirth: "2018-01-01" }),
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: "UNDERAGE" });
  });

  it("serves games catalog with Cache-Control headers and uses in-memory cache", async () => {
    const res1 = await app.request("/api/games");
    expect(res1.status).toBe(200);
    expect(res1.headers.get("cache-control")).toContain("public");
    expect(res1.headers.get("cache-control")).toContain("max-age=15");
    const body1 = await res1.json();
    expect(Array.isArray(body1.items)).toBe(true);
    expect(body1.items.length).toBeGreaterThan(0);

    // Second call hits in-memory cache immediately
    const res2 = await app.request("/api/games");
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2).toEqual(body1);
  });
});
