import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

export const db = new PrismaClient();

export async function createTestPlayer(currency = "EUR") {
  const id = randomUUID();
  const email = `test-${id}@vladfsbet.local`;
  const now = new Date();
  const user = await db.user.create({
    data: {
      email,
      passwordHash: "test",
      country: "ZZ",
      currency,
      dateOfBirth: new Date("1995-01-15"),
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      rgAcknowledgedAt: now,
      status: "ACTIVE",
      realMoneyEligible: false,
      profile: {
        create: { firstName: "Test", lastName: "Player" },
      },
    },
  });
  return user;
}
