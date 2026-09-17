import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dbDir = resolve(root, "packages/db");
const engine = resolve(root, "node_modules/.prisma/client/query_engine-windows.dll.node");
const client = resolve(root, "node_modules/.prisma/client/index.js");
const postinstall = process.env.npm_lifecycle_event === "postinstall";
const attempts = postinstall ? 3 : 5;

function clientReady() {
  return existsSync(engine) && existsSync(client);
}

for (let i = 1; i <= attempts; i++) {
  const result = spawnSync("npx", ["prisma", "generate"], {
    cwd: dbDir,
    stdio: "inherit",
    shell: true,
  });
  if (result.status === 0) {
    process.exit(0);
  }
  if (i < attempts) {
    await delay(400 * i);
  }
}

if (postinstall && clientReady()) {
  console.warn(
    "prisma generate skipped: existing Prisma client is in place. If the schema changed, run `npm run dev:stop` then `npm run db:generate`.",
  );
  process.exit(0);
}

console.error(
  "prisma generate failed. On Windows this is usually EPERM because Node still holds query_engine-windows.dll.node.",
);
console.error("Stop the running app (`npm run dev:stop`) and retry: npm run db:generate");
process.exit(1);
