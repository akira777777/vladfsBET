import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rootNeedle = root.replaceAll("/", "\\").toLowerCase();
const self = new Set([String(process.pid), String(process.ppid)]);
const ports = process.argv.slice(2).map(Number).filter(Boolean);
const targets = ports.length ? ports : [3000, 3001, 4000];
const pids = new Set();

function addPid(value) {
  const pid = String(value ?? "").trim();
  if (!pid || pid === "0" || self.has(pid)) return;
  pids.add(pid);
}

function collectPortPids() {
  const table = execSync("netstat -ano", { encoding: "utf8" });
  for (const line of table.split(/\r?\n/)) {
    if (!line.includes("LISTENING")) continue;
    for (const port of targets) {
      if (line.match(new RegExp(`[:.]${port}\\s`))) {
        addPid(line.trim().split(/\s+/).at(-1));
      }
    }
  }
}

function collectProjectPids() {
  const command =
    "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress";
  let raw = "[]";
  try {
    raw = execSync(`powershell -NoProfile -Command ${JSON.stringify(command)}`, {
      encoding: "utf8",
      maxBuffer: 10_000_000,
    }).trim();
  } catch {
    return;
  }
  if (!raw) return;
  const parsed = JSON.parse(raw);
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  for (const row of rows) {
    const cmd = String(row?.CommandLine ?? "").toLowerCase().replaceAll("/", "\\");
    if (!cmd.includes(rootNeedle)) continue;
    if (cmd.includes("scripts\\stop-dev.mjs")) continue;
    const isApp =
      cmd.includes("\\apps\\api") ||
      cmd.includes("\\apps\\web") ||
      cmd.includes("\\node_modules\\tsx") ||
      cmd.includes("\\node_modules\\.bin") ||
      cmd.includes("\\node_modules\\next") ||
      cmd.includes("\\node_modules\\turbo") ||
      cmd.includes("turbo run dev") ||
      cmd.includes("next dev") ||
      cmd.includes("tsx watch");
    if (isApp) addPid(row.ProcessId);
  }
}

function removeStaleNextLock() {
  const lockDir = resolve(root, "apps/web/.next/dev/lock");
  if (existsSync(lockDir)) {
    rmSync(lockDir, { recursive: true, force: true });
  }
}

collectPortPids();
collectProjectPids();

if (pids.size === 0) {
  removeStaleNextLock();
  console.log(`No listeners on ${targets.join(", ")}`);
  process.exit(0);
}

for (const pid of pids) {
  try {
    execSync(`taskkill /PID ${pid} /T /F`, { stdio: "inherit" });
  } catch {
    // already gone
  }
}

removeStaleNextLock();
