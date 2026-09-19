import { readFileSync, writeFileSync } from "node:fs";

const raw = readFileSync("C:/Users/novra/Desktop/vladfsBET/eslint.json", "utf8");
const data = JSON.parse(raw.slice(raw.indexOf("[")));

const unusedByFile = new Map();
for (const f of data) {
  for (const m of f.messages) {
    if (m.ruleId !== "@typescript-eslint/no-unused-vars") continue;
    const mm = m.message.match(/^'([^']+)' is defined but never used/);
    if (!mm) continue;
    if (!unusedByFile.has(f.filePath)) unusedByFile.set(f.filePath, new Set());
    unusedByFile.get(f.filePath).add(mm[1]);
  }
}

function strip(line, ids) {
  const m = line.match(/^(\s*)import\s+([\s\S]+?)\s+from\s+(["'][^"']+["'])\s*;?\s*$/);
  if (!m) return line;
  const indent = m[1];
  const spec = m[2];
  const source = m[3];

  // Side-effect / namespace imports: nothing to remove.
  if (/^\*\s*as\s+/.test(spec)) return line;

  let def = null;
  let named = null;
  let rest = spec;

  if (!rest.trimStart().startsWith("{")) {
    const i = rest.indexOf(",");
    if (i === -1) {
      // Default-only import.
      return ids.has(rest.trim()) ? "" : line;
    }
    def = rest.slice(0, i).trim();
    rest = rest.slice(i + 1);
  }

  if (rest.trimStart().startsWith("{")) {
    const open = rest.indexOf("{");
    const close = rest.indexOf("}", open);
    named = rest.slice(open + 1, close);
    rest = rest.slice(close + 1).trim();
  }

  const parts = [];
  if (def) parts.push(def);
  if (named !== null) {
    const kept = named
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => {
        const local = s.replace(/^.*\bas\s+/, "").trim();
        return !ids.has(local);
      });
    if (kept.length > 0) parts.push(`{ ${kept.join(", ")} }`);
  }
  if (rest) parts.push(rest);

  if (parts.length === 0) return "";
  return `${indent}import ${parts.join(", ")} from ${source};`;
}

let changed = 0;
let removed = 0;
for (const [filePath, ids] of unusedByFile) {
  const lines = readFileSync(filePath, "utf8").split("\n");
  const out = lines.map((line) => {
    if (!/^\s*import\s+/.test(line)) return line;
    const next = strip(line, ids);
    if (next !== line) {
      if (next.trim() === "") removed++;
      else removed++;
    }
    return next;
  });
  writeFileSync(filePath, out.join("\n"));
  changed++;
}
console.log(`changed=${changed} removed=${removed}`);
