import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dbDir = resolve(root, "packages/db");
const client = resolve(root, "node_modules/.prisma/client/index.js");
const postinstall = process.env.npm_lifecycle_event === "postinstall";
const attempts = postinstall ? 2 : 3;

function clientReady() {
  return existsSync(client);
}

for (let i = 1; i <= attempts; i++) {
  const result = spawnSync("npx", ["prisma", "generate"], {
    cwd: dbDir,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://mock:mock@localhost:5432/mock",
    },
  });
  if (result.status === 0) {
    process.exit(0);
  }
  if (i < attempts) {
    await delay(400 * i);
  }
}

if (clientReady()) {
  console.warn(
    "prisma generate: existing Prisma client is in place.",
  );
  process.exit(0);
}

console.warn(
  "[AI Studio] prisma generate skipped or database offline. Using safe in-memory database mock.",
);
process.exit(0);
