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

export { PrismaClient, Prisma } from "@prisma/client";
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
} catch (error) {
  // Never silently swap in a mock client in production: a failed DB connection
  // must surface as an error, not as empty query results.
  const allowMock = process.env.NODE_ENV !== "production" && process.env.USE_MOCK_PRISMA === "true";
  if (!allowMock) {
    throw new Error(
      `[db] Failed to initialize PrismaClient: ${(error as Error).message}. ` +
        "Set USE_MOCK_PRISMA=true only for explicit, non-production development.",
      { cause: error },
    );
  }
  console.warn("[db] USE_MOCK_PRISMA=true — using in-memory mock Prisma client (development only)");
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
