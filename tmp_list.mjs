import { readFileSync } from "node:fs";
const raw = readFileSync("C:/Users/novra/Desktop/vladfsBET/eslint.json", "utf8");
const data = JSON.parse(raw.slice(raw.indexOf("[")));
const rows = [];
for (const f of data) {
  for (const m of f.messages) {
    const rel = (f.filePath.split("web\\src\\")[1] || f.filePath).replace(/\\/g, "/");
    rows.push(`${rel}:${m.line}:${m.col}:${m.ruleId} | ${m.message}`);
  }
}
console.log(rows.join("\n"));
