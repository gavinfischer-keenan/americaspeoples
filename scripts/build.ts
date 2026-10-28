import { build } from "esbuild";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { zipSync, strToU8 } from "fflate";
import { validateDataset } from "../src/validation";
import { marked } from "marked";
const d = JSON.parse(await readFile("data/evidence.json", "utf8"));
const errors = validateDataset(d);
if (errors.length) throw new Error(errors.join("\n"));
await mkdir("dist", { recursive: true });
await mkdir("release", { recursive: true });
await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["chrome110", "firefox115", "safari16"],
  outfile: "dist/app.js",
  minify: true,
  legalComments: "eof",
  loader: { ".geojson": "json" },
});
await copyFile("index.html", "dist/index.html");
const names = ["index.html", "app.js", "app.css"];
await mkdir("dist/docs", { recursive: true });
await mkdir("dist/templates", { recursive: true });
for (const name of [
  "README.md",
  "THIRD_PARTY.md",
  "docs/data-format.md",
  "docs/evidence-policy.md",
  "docs/verification.md",
  "docs/bulk-import-guide.md",
  "templates/americas-peoples-import.xlsx",
  "templates/americas-peoples-researched-import.xlsx",
]) {
  await copyFile(name, `dist/${name}`);
  names.push(name);
}
const guide = await marked.parse(
  await readFile("docs/bulk-import-guide.md", "utf8"),
);
await writeFile(
  "dist/docs/bulk-import-guide.html",
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'"><title>Americas Peoples bulk import guide</title><style>body{font:16px/1.65 system-ui,sans-serif;color:#20313a;max-width:1100px;margin:40px auto;padding:0 24px 60px}h1,h2,h3{line-height:1.25;margin-top:1.6em}h1{font-size:36px}a{color:#086b7b}table{border-collapse:collapse;width:100%;font-size:14px;display:block;overflow:auto}td,th{border:1px solid #cbd6d9;padding:10px;text-align:left;min-width:140px}th{background:#e6f0f1}code{background:#edf1f2;padding:2px 4px;border-radius:3px}pre{padding:16px;background:#edf1f2;overflow:auto}pre code{padding:0}blockquote{border-left:3px solid #25818e;margin-left:0;padding-left:20px}li{margin:6px 0}</style></head><body><a href="../index.html#proposals">← Back to Americas Peoples</a>${guide}</body></html>`,
);
names.push("docs/bulk-import-guide.html");
const files: Record<string, Uint8Array> = {};
for (const name of names)
  files[`americas-peoples/${name}`] = new Uint8Array(
    await readFile("dist/" + name),
  );
files["americas-peoples/dataset.json"] = strToU8(JSON.stringify(d, null, 2));
await writeFile(
  "release/americas-peoples-offline.zip",
  zipSync(files, { level: 9 }),
);
console.log(
  `Built offline file:// release with ${d.records.length} evidence reviews.`,
);
