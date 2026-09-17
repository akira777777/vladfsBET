import { execSync } from "node:child_process";

const ports = process.argv.slice(2).map(Number).filter(Boolean);
const targets = ports.length ? ports : [3000, 3001, 4000];
const table = execSync("netstat -ano", { encoding: "utf8" });
const pids = new Set();

for (const line of table.split(/\r?\n/)) {
  if (!line.includes("LISTENING")) continue;
  for (const port of targets) {
    if (line.match(new RegExp(`[:.]${port}\\s`))) {
      const pid = line.trim().split(/\s+/).at(-1);
      if (pid && pid !== "0") pids.add(pid);
    }
  }
}

if (pids.size === 0) {
  console.log(`No listeners on ${targets.join(", ")}`);
  process.exit(0);
}

for (const pid of pids) {
  try {
    execSync(`taskkill /PID ${pid} /F`, { stdio: "inherit" });
  } catch {
    // already gone
  }
}
