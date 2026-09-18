import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const envPath = process.argv[2];
if (!envPath) {
  console.error("usage: node scripts/prod-seed.mjs <env-file>");
  process.exit(1);
}

const parsed = {};
for (const raw of readFileSync(envPath, "utf8").split(/\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  let value = line.slice(i + 1);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  parsed[line.slice(0, i)] = value;
}

function buildDirectUrl() {
  const host = parsed.POSTGRES_HOST;
  const user = parsed.POSTGRES_USER || "postgres";
  const password = parsed.POSTGRES_PASSWORD;
  const database = parsed.POSTGRES_DATABASE || "postgres";
  if (!host || !password || password === "[SENSITIVE]") return null;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:5432/${database}?sslmode=require`;
}

const url =
  buildDirectUrl() ||
  parsed.POSTGRES_URL_NON_POOLING ||
  parsed.POSTGRES_PRISMA_URL ||
  parsed.POSTGRES_URL;
if (!url || url === "[SENSITIVE]") {
  console.error("No hosted Postgres URL in env file");
  process.exit(1);
}

const databaseUrl = url.startsWith("postgres://")
  ? `postgresql://${url.slice("postgres://".length)}`
  : url;

const result = spawnSync(
  "npx",
  ["tsx", "prisma/seed.ts"],
  {
    cwd: new URL("../packages/db/", import.meta.url),
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    shell: true,
  },
);

process.exit(result.status ?? 1);
