import { PrismaClient } from "@prisma/client";

// Serverless runtimes should prefer Neon’s direct/unpooled connection for
// short transactional writes such as registration. Keep DATABASE_URL as the
// Prisma schema contract while selecting the safer runtime endpoint.
if (process.env.DATABASE_URL_UNPOOLED) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_UNPOOLED;
}

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
