import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("API flood protection", () => {
  it("blocks bursts even when the caller changes forwarding headers", async () => {
    const app = createApp();
    for (let i = 0; i < 40; i++) {
      const response = await app.request("/health", {
        headers: { "x-forwarded-for": `192.0.2.${i + 1}`, "x-real-ip": `192.0.2.${i + 1}` },
      });
      expect(response.status).toBe(200);
    }
    const blocked = await app.request("/health");
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(blocked.headers.get("cache-control")).toBe("no-store");
    expect(await blocked.json()).toMatchObject({ error: "RATE_LIMITED" });
  });

  it("shares the login budget across player and admin authentication", async () => {
    const app = createApp();
    for (let i = 0; i < 10; i++) {
      const response = await app.request(i % 2 ? "/api/admin/auth/login" : "/api/auth/login", {
        method: "POST", headers: { "content-type": "application/json" }, body: "{}",
      });
      expect(response.status).toBe(400);
    }
    const blocked = await app.request("/api/auth/register", {
      method: "POST", headers: { "content-type": "application/json" }, body: "{}",
    });
    expect(blocked.status).toBe(429);
  });

  it("rejects oversized bodies before validation or database access", async () => {
    const app = createApp();
    const response = await app.request("/api/auth/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ padding: "x".repeat(128 * 1024) }),
    });
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ error: "PAYLOAD_TOO_LARGE" });
  });

  it.each([
    "/api/wallet/demo-credit",
    "/api/wallet/deposit",
    "/api/admin/ledger/adjust",
    "/api/bonuses/claim",
    "/api/bonuses/redeem-code",
    "/api/vip/claim-cashback",
  ])("does not expose manual balance funding at %s", async (path) => {
    const app = createApp();
    const response = await app.request(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    expect(response.status).toBe(404);
  });
});
