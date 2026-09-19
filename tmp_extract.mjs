import { readFileSync } from "node:fs";
const raw = readFileSync("C:/Users/novra/Desktop/vladfsBET/eslint.json", "utf8");
const start = raw.indexOf("[");
const r = JSON.parse(raw.slice(start));
const rows = [];
for (const f of r) {
  for (const m of f.messages) {
    if (m.ruleId === "@typescript-eslint/no-unused-vars") {
      const rel = f.filePath.split("web\\src\\")[1] || f.filePath;
      rows.push(`${rel}:${m.line}:${m.message.replace(" is defined but never used", "").replace(" is assigned a value but never used", "").trim()}`);
    }
  }
}
console.log(rows.join("\n"));

