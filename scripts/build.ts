import { build } from "esbuild";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { zipSync, strToU8 } from "fflate";
import { validateDataset } from "../src/validation";
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
for (const name of [
  "README.md",
  "THIRD_PARTY.md",
  "docs/data-format.md",
  "docs/evidence-policy.md",
  "docs/verification.md",
]) {
  await copyFile(name, `dist/${name}`);
  names.push(name);
}
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
