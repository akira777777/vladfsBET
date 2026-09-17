import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { hashPassword, prisma } from "@vladfsbet/db";
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
    expect(me.status).toBe(200);
    const meBody = await me.json();
    expect(meBody.user.email).toBeTruthy();
    expect(meBody.wallet.available).toBe("1000.00000000");

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

  it("rejects unsupported game categories before querying the database", async () => {
    const response = await app.request("/api/games?category=NOT_A_CATEGORY");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "INVALID_INPUT" });
  });

  it("echoes x-request-id and rejects unauthenticated admin routes", async () => {
    const health = await app.request("/health", { headers: { "x-request-id": "req-test-1" } });
    expect(health.headers.get("x-request-id")).toBe("req-test-1");

    const overview = await app.request("/api/admin/overview");
    expect(overview.status).toBe(401);
    expect(overview.headers.get("x-request-id")).toBeTruthy();
    expect(await overview.json()).toMatchObject({ error: "UNAUTHENTICATED" });
  });

  it("allows a staff session and blocks missing admin permissions", async () => {
    const email = `staff-${randomUUID()}@vladfsbet.local`;
    const admin = await prisma.adminUser.create({
      data: {
        email,
        passwordHash: await hashPassword("Admin123456!"),
        name: "API Staff",
        active: true,
      },
    });
    const role = await prisma.role.create({
      data: { slug: `api-role-${randomUUID()}`, name: "Readers" },
    });
    const permission = await prisma.permission.upsert({
      where: { key: "players.read" },
      update: {},
      create: { key: "players.read", description: "Read players" },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
    await prisma.adminUserRole.create({ data: { adminUserId: admin.id, roleId: role.id } });

    const login = await app.request("/api/admin/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "Admin123456!" }),
    });
    expect(login.status).toBe(200);
    const cookie = cookieFrom(login);
    expect(cookie.startsWith("vladfsbet_admin_session=")).toBe(true);

    const me = await app.request("/api/admin/auth/me", { headers: { cookie } });
    expect(me.status).toBe(200);

    const forbidden = await app.request("/api/admin/players/not-a-user/status", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ status: "LOCKED", reason: "test lock" }),
    });
    expect(forbidden.status).toBe(403);
    expect(await forbidden.json()).toMatchObject({ error: "FORBIDDEN" });
  });

  it("rejects unsupported player statuses for authorized staff", async () => {
    const email = `staff-${randomUUID()}@vladfsbet.local`;
    const admin = await prisma.adminUser.create({
      data: {
        email,
        passwordHash: await hashPassword("Admin123456!"),
        name: "API Player Manager",
        active: true,
      },
    });
    const role = await prisma.role.create({
      data: { slug: `api-role-${randomUUID()}`, name: "Player Managers" },
    });
    const permission = await prisma.permission.upsert({
      where: { key: "players.write" },
      update: {},
      create: { key: "players.write", description: "Update players" },
    });
    await prisma.rolePermission.create({
      data: { roleId: role.id, permissionId: permission.id },
    });
    await prisma.adminUserRole.create({ data: { adminUserId: admin.id, roleId: role.id } });

    const login = await app.request("/api/admin/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "Admin123456!" }),
    });
    const response = await app.request("/api/admin/players/not-a-user/status", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieFrom(login) },
      body: JSON.stringify({ status: "NOT_A_STATUS", reason: "invalid status test" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "INVALID_INPUT" });
  });
});
