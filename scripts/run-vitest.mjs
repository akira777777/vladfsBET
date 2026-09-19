#!/usr/bin/env node
/**
 * Cross-platform Vitest launcher.
 *
 * Works around a Vitest bug on Windows (vitest-dev/vitest#10692, PR #10843):
 * when the shell's working directory uses a lowercase drive letter (e.g.
 * `cd /d c:\project`), Vitest loads a second copy of its runtime whose test
 * collector is never populated, so the first `describe()` throws
 * "Cannot read properties of undefined (reading 'config')".
 *
 * Normalizing the drive letter to uppercase before spawning Vitest keeps a
 * single runtime instance, so tests pass from any Windows shell. On Linux and
 * macOS this is a no-op.
 */
import { spawnSync } from "node:child_process";

function normalizeWindowsDriveLetter(value) {
  if (process.platform !== "win32") return value;
  return value.replace(/^([a-z]):/, (_match, drive) => `${drive.toUpperCase()}:`);
}

const cwd = normalizeWindowsDriveLetter(process.cwd());
const args = ["--no-install", "vitest", "run", ...process.argv.slice(2)];

const result = spawnSync("npx", args, {
  cwd,
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
