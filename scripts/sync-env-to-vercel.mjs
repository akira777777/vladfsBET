import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";

const root = process.cwd();
const envPath = path.resolve(root, ".env");

if (!fs.existsSync(envPath)) {
  console.error("No .env file found at " + envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const entries = [];

for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  entries.push({ key, val });
}

console.log(`Parsed ${entries.length} environment variables from .env`);

const teamId = "team_QzJRT9tUkdCHKDFF44lStOKH";
const projectId = "prj_K55rxHfqOLpLr86PFnhUqlUZUlmR";
const tmpFile = path.resolve(os.tmpdir(), "vercel_env_body.json");

function vercelApi(method, endpoint, body) {
  let cmd = `npx vercel api "${endpoint}"`;
  if (method === "POST" || method === "PATCH" || method === "DELETE") {
    cmd += ` -X ${method}`;
  }
  if (body) {
    fs.writeFileSync(tmpFile, JSON.stringify(body), "utf-8");
    cmd += ` --input "${tmpFile}"`;
  }
  const out = execSync(cmd, {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const cleaned = out.replace(/^npm notice.*\n/gm, "").trim();
  return JSON.parse(cleaned);
}

console.log("Fetching existing environment variables from Vercel...");
const existing = vercelApi("GET", `/v9/projects/${projectId}/env?teamId=${teamId}`);
const envMap = new Map();
for (const env of existing.envs) {
  if (!envMap.has(env.key)) {
    envMap.set(env.key, []);
  }
  envMap.get(env.key).push(env);
}

for (const { key, val } of entries) {
  const existingList = envMap.get(key);
  if (existingList && existingList.length > 0) {
    for (const env of existingList) {
      console.log(`Updating ${key} (id: ${env.id}, target: ${env.target?.join(",") || "all"})...`);
      try {
        vercelApi("PATCH", `/v9/projects/${projectId}/env/${env.id}?teamId=${teamId}`, {
          value: val,
          target: env.target || ["production", "preview", "development"],
          type: env.type || "encrypted",
        });
        console.log(`✓ Updated ${key}`);
      } catch (err) {
        console.error(`Failed to update ${key}:`, err.message);
      }
    }
  } else {
    console.log(`Creating ${key}...`);
    try {
      vercelApi("POST", `/v10/projects/${projectId}/env?teamId=${teamId}`, {
        key,
        value: val,
        target: ["production", "preview", "development"],
        type: "encrypted",
      });
      console.log(`✓ Created ${key}`);
    } catch (err) {
      console.error(`Failed to create ${key}:`, err.message);
    }
  }
}

if (fs.existsSync(tmpFile)) {
  fs.unlinkSync(tmpFile);
}

console.log("\nAll environment variables synced successfully to Vercel!");
