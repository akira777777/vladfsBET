import { PrismaClient } from "@prisma/client";

// Prefer a real hosted URL over leftover local docker values.
// On Vercel serverless, pooled URLs first; direct/unpooled hangs under load.
const hostedDatabaseUrl = (
  process.env.VERCEL
    ? [
        process.env.DATABASE_URL,
        process.env.NEON_POSTGRES_PRISMA_URL,
        process.env.NEON_DATABASE_URL,
        process.env.DATABASE_URL_UNPOOLED,
        process.env.NEON_DATABASE_URL_UNPOOLED,
        process.env.POSTGRES_PRISMA_URL,
        process.env.POSTGRES_URL,
        process.env.POSTGRES_URL_NON_POOLING,
      ]
    : [
        process.env.DATABASE_URL,
        process.env.NEON_DATABASE_URL,
        process.env.DATABASE_URL_UNPOOLED,
        process.env.NEON_DATABASE_URL_UNPOOLED,
        process.env.POSTGRES_PRISMA_URL,
        process.env.POSTGRES_URL,
        process.env.POSTGRES_URL_NON_POOLING,
      ]
).find((value) => {
  if (!value) return false;
  try {
    const { hostname } = new URL(value);
    return (
      hostname !== "127.0.0.1" &&
      hostname !== "localhost" &&
      !hostname.includes("siinmfgkjpysehzuovyy")
    );
  } catch {
    return false;
  }
});
if (hostedDatabaseUrl) {
  process.env.DATABASE_URL = hostedDatabaseUrl;
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

let prismaInstance: PrismaClient;
try {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      datasourceUrl: hostedDatabaseUrl || process.env.DATABASE_URL,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
} catch {
  console.warn("[AI Studio] Database not connected — using mock Prisma client");
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };
  prismaInstance = new Proxy({}, {
    get: () => noOp,
  }) as unknown as PrismaClient;
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
