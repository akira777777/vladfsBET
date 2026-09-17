import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const dbDir = resolve(dirname(fileURLToPath(import.meta.url)), "../packages/db");
const attempts = 5;

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

console.error(
  "prisma generate failed. On Windows this is usually EPERM because Node still holds query_engine-windows.dll.node.",
);
console.error("Stop the running app (npm run dev:stop) and retry: npm run db:generate");
process.exit(1);
