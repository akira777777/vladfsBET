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

let prismaInstance: PrismaClient;
try {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
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
