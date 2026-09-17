import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { AdminError, assertAdminPermission, getAdminSession, loginAdmin, revokeAdminSession } from "./admin";
import { hashPassword } from "./auth";
import { db } from "./test-helpers";

async function createStaff(overrides: { email?: string; active?: boolean; permissions?: string[] } = {}) {
  const email = overrides.email ?? `admin-${randomUUID()}@vladfsbet.local`;
  const admin = await db.adminUser.create({
    data: {
      email,
      passwordHash: await hashPassword("Admin123456!"),
      name: "Test Admin",
      active: overrides.active ?? true,
    },
  });

  const permissions = overrides.permissions ?? ["players.read", "players.write", "audit.read"];
  const role = await db.role.create({
    data: {
      slug: `role-${randomUUID()}`,
      name: "Test Role",
    },
  });
  for (const key of permissions) {
    const permission = await db.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: key },
    });
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
  }
  await db.adminUserRole.create({
    data: { adminUserId: admin.id, roleId: role.id },
  });

  return { email, password: "Admin123456!" };
}

describe("admin auth", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("creates a hashed admin session on login", async () => {
    const staff = await createStaff();
    const result = await loginAdmin(db, { email: staff.email, password: staff.password, ip: "127.0.0.1" });
    expect(result.sessionToken).toMatch(/^[a-f0-9]{64}$/);
    expect(result.admin.email).toBe(staff.email);
    expect(result.admin.permissions).toContain("players.read");

    const session = await getAdminSession(db, result.sessionToken);
    expect(session?.id).toBe(result.admin.id);
  });

  it("rejects a wrong password and an inactive admin", async () => {
    const staff = await createStaff();
    await expect(loginAdmin(db, { email: staff.email, password: "wrong-password-1" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    } satisfies Partial<AdminError>);

    const inactive = await createStaff({ active: false });
    await expect(
      loginAdmin(db, { email: inactive.email, password: inactive.password }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("revokes sessions and enforces missing permissions", async () => {
    const staff = await createStaff({ permissions: ["players.read"] });
    const result = await loginAdmin(db, { email: staff.email, password: staff.password });
    assertAdminPermission(result.admin, "players.read");
    expect(() => assertAdminPermission(result.admin, "players.write")).toThrowError(AdminError);

    await revokeAdminSession(db, result.sessionToken);
    expect(await getAdminSession(db, result.sessionToken)).toBeNull();
  });
});
