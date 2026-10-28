import { build } from "esbuild";
import { dataset as published } from "../src/published-data";
import {
  readFile,
  writeFile,
  mkdir,
  copyFile,
  rm,
  lstat,
  readdir,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";
import { validateDataset } from "../src/validation";
import { marked } from "marked";
import { createAppendix, renderAppendix } from "./appendix";
const { version } = JSON.parse(await readFile("package.json", "utf8"));
const d = JSON.parse(await readFile("data/evidence.json", "utf8"));
const research = JSON.parse(
  await readFile("data/research-proposals.json", "utf8"),
);
const appendix = createAppendix(d, research, version);
const errors = validateDataset(published);
if (errors.length) throw new Error(errors.join("\n"));
// Delete only this repository's generated directory, never a symlink or a caller-selected path.
const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const distRoot = path.resolve("dist");
if (distRoot !== path.join(projectRoot, "dist"))
  throw new Error("Run the build from the repository root.");
const priorDist = await lstat(distRoot).catch(() => null);
if (priorDist?.isSymbolicLink())
  throw new Error("Refusing to replace a symlinked dist directory.");
console.log(`Preparing generated deploy directory: ${distRoot}`);
await rm(distRoot, { recursive: true, force: true });
await mkdir(distRoot, { recursive: true });
await mkdir("release", { recursive: true });
await build({
  entryPoints: ["src/bootstrap.ts"],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["chrome110", "firefox115", "safari16"],
  outfile: "dist/app.js",
  minify: true,
  legalComments: "eof",
  loader: { ".geojson": "json" },
});
await writeFile(
  "dist/index.html",
  (await readFile("index.html", "utf8"))
    .replace('src="app.js"', `src="app.js?v=${version}"`)
    .replace('href="app.css"', `href="app.css?v=${version}"`),
);
const names = ["index.html", "app.js", "app.css"];
async function includeDirectory(dir: string) {
  await mkdir(`dist/${dir}`, { recursive: true });
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (item.isDirectory()) await includeDirectory(`${dir}/${item.name}`);
    else if (item.isFile()) {
      await copyFile(`${dir}/${item.name}`, `dist/${dir}/${item.name}`);
      names.push(`${dir}/${item.name}`);
    }
  }
}
await includeDirectory("docs/intake");
await copyFile(
  "data/literature-intake-2026-10-28.json",
  "dist/literature-intake.json",
);
names.push("literature-intake.json");
await mkdir("dist/docs", { recursive: true });
await mkdir("dist/templates", { recursive: true });
for (const name of [
  "README.md",
  "THIRD_PARTY.md",
  "docs/data-format.md",
  "docs/evidence-policy.md",
  "docs/verification.md",
  "docs/bulk-import-guide.md",
  "DEPLOYMENT.md",
  "docs/landing-page-content.md",
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
for (const [name, content] of Object.entries({
  "dataset.json": JSON.stringify(published, null, 2),
  "research-proposals.json": JSON.stringify(research, null, 2),
  "evidence-appendix.json": JSON.stringify(appendix, null, 2),
  "evidence-appendix.html": renderAppendix(appendix),
})) {
  await writeFile(`dist/${name}`, content);
  names.push(name);
}
const files: Record<string, Uint8Array> = {};
for (const name of names)
  files[`americas-peoples/${name}`] = new Uint8Array(
    await readFile("dist/" + name),
  );
const zip = zipSync(files, { level: 9 });
const releaseName = `americas-peoples-v${version}-offline.zip`;
await writeFile("release/americas-peoples-offline.zip", zip);
await writeFile(`release/${releaseName}`, zip);
const artifactFiles = [
  {
    path: `release/${releaseName}`,
    repositoryPath: `downloads/${releaseName}`,
  },
  {
    path: "templates/americas-peoples-import.xlsx",
    repositoryPath: "templates/americas-peoples-import.xlsx",
  },
  {
    path: "templates/americas-peoples-researched-import.xlsx",
    repositoryPath: "templates/americas-peoples-researched-import.xlsx",
  },
];
const artifacts = await Promise.all(
  artifactFiles.map(async (item) => {
    const bytes = await readFile(item.path);
    return {
      filename: path.basename(item.path),
      repositoryPath: item.repositoryPath,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      url: `https://github.com/gavinfischer-keenan/americaspeoples/raw/refs/tags/v${version}/${item.repositoryPath}`,
    };
  }),
);
await writeFile(
  "release/artifacts.json",
  JSON.stringify({ version, artifacts }, null, 2) + "\n",
);
await writeFile(
  "release/SHA256SUMS.txt",
  artifacts.map((a) => `${a.sha256}  ${a.filename}`).join("\n") + "\n",
);
console.log(
  `Built offline file:// release with ${published.records.length} evidence reviews.`,
);
