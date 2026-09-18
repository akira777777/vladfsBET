import { execSync } from "node:child_process";

const teamId = "team_QzJRT9tUkdCHKDFF44lStOKH";
const projectId = "prj_K55rxHfqOLpLr86PFnhUqlUZUlmR";

function vercelApi(method, endpoint) {
  let cmd = `npx vercel api "${endpoint}"`;
  if (method === "DELETE") {
    cmd += ` -X DELETE`;
  }
  const out = execSync(cmd, {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const cleaned = out.replace(/^npm notice.*\n/gm, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return cleaned;
  }
}

console.log("Fetching existing environment variables from Vercel...");
const res = vercelApi("GET", `/v9/projects/${projectId}/env?teamId=${teamId}`);
const supabaseEnvs = (res.envs || []).filter((e) => e.key.toUpperCase().includes("SUPABASE"));

console.log(`Found ${supabaseEnvs.length} Supabase env vars on Vercel.`);
for (const env of supabaseEnvs) {
  console.log(`Deleting ${env.key} (${env.id})...`);
  try {
    vercelApi("DELETE", `/v9/projects/${projectId}/env/${env.id}?teamId=${teamId}`);
    console.log(`✓ Deleted ${env.key}`);
  } catch (err) {
    console.error(`Failed to delete ${env.key}:`, err.message);
  }
}
console.log("Done checking/removing Supabase env vars.");
