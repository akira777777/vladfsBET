import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stopScript = resolve(root, "scripts/stop-dev.mjs");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

let shuttingDown = false;

spawnSync(process.execPath, [stopScript], { cwd: root, stdio: "inherit" });

function runWorkspace(name, workspace, ports) {
  let child;
  let delay = 800;

  const start = () => {
    if (shuttingDown) return;
    child = spawn(`${npmCmd} run dev -w ${workspace}`, {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    child.on("exit", (code, signal) => {
      if (shuttingDown) return;
      console.error(
        `[dev] ${name} exited (${code ?? signal}). Restarting in ${delay}ms. Run npm run dev:stop to quit.`,
      );
      spawnSync(process.execPath, [stopScript, ...ports.map(String)], {
        cwd: root,
        stdio: "inherit",
      });
      setTimeout(start, delay);
      delay = Math.min(delay * 2, 5_000);
    });
  };

  start();
  return () => child;
}

runWorkspace("api", "@vladfsbet/api", [4000]);
runWorkspace("web", "@vladfsbet/web", [3000, 3001]);

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  spawnSync(process.execPath, [stopScript], { cwd: root, stdio: "inherit" });
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
