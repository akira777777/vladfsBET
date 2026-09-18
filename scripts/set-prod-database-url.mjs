import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const envPath = process.argv[2];
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

const source =
  parsed.POSTGRES_URL_NON_POOLING ||
  parsed.POSTGRES_PRISMA_URL ||
  parsed.POSTGRES_URL;
if (!source || source === "[SENSITIVE]") {
  console.error("No Supabase Postgres URL in env file");
  process.exit(1);
}

const databaseUrl = source.startsWith("postgres://")
  ? `postgresql://${source.slice("postgres://".length)}`
  : source;

function run(args, input) {
  const result = spawnSync("vercel", args, {
    input,
    encoding: "utf8",
    shell: true,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result.status ?? 1;
}

const common = [
  "--project",
  "vladfs-bet-api",
  "--scope",
  "akirtas-projects",
  "--yes",
];

run(["env", "rm", "DATABASE_URL", "production", ...common]);
const addDb = run(
  ["env", "add", "DATABASE_URL", "production", "--type", "secret", ...common],
  databaseUrl,
);
run(["env", "rm", "DATABASE_URL_UNPOOLED", "production", ...common]);
const addUnpooled = run(
  [
    "env",
    "add",
    "DATABASE_URL_UNPOOLED",
    "production",
    "--type",
    "secret",
    ...common,
  ],
  databaseUrl,
);

if (addDb !== 0 || addUnpooled !== 0) process.exit(1);
console.log("Updated DATABASE_URL and DATABASE_URL_UNPOOLED to Supabase (value not printed).");
