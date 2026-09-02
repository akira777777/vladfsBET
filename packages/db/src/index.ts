import { PrismaClient } from "@prisma/client";

export { PrismaClient } from "@prisma/client";
export type * from "@prisma/client";
export * from "./ledger";
export * from "./auth";
export * from "./play";
export * from "./rg";
export * from "./bonuses";
export * from "./sports";
export * from "./kyc";
export * from "./risk";
export * from "./support";
export * from "./admin";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
