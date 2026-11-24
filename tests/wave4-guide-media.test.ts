import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { readWorldGuides } from "../scripts/world-guide-data";
import { copyWorldGuideMedia } from "../scripts/world-guide-media";

const ROOT = path.resolve(import.meta.dirname, "..");

test("every world deep dive guide has at least one verified open-licensed photograph", async () => {
  const guides = await readWorldGuides();
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "world-guide-media.json"), "utf8"),
  ) as {
    schemaVersion: number;
    assets: {
      id: string;
      guideIds: string[];
      file: string;
      sha256: string;
      width: number;
      height: number;
      credit: string;
      license: string;
      licenseUrl: string;
      sourceUrl: string;
      imageUrl: string;
    }[];
  };

  assert.equal(manifest.schemaVersion, 1);
  const covered = new Set<string>();
  for (const asset of manifest.assets) {
    assert.ok(asset.credit.trim().length > 0, `${asset.id} needs credit`);
    assert.ok(asset.licenseUrl.startsWith("https://"), `${asset.id} https licenseUrl`);
    assert.ok(asset.sourceUrl.startsWith("https://"), `${asset.id} https sourceUrl`);
    assert.ok(asset.imageUrl.startsWith("https://"), `${asset.id} https imageUrl`);
    assert.doesNotMatch(asset.license, /\b(NC|ND|fair use|copyright)\b/i, `${asset.id} open license only`);
    const filePath = path.join(ROOT, "data", "world-guide-media", asset.file);
    assert.ok(fs.existsSync(filePath), `Missing asset file ${asset.file}`);
    const actualSha = createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
    assert.equal(actualSha, asset.sha256, `SHA mismatch for ${asset.file}`);
    for (const gid of asset.guideIds) covered.add(gid);
  }

  const missing = guides.filter((g) => !covered.has(g.id)).map((g) => g.id);
  assert.deepEqual(missing, [], `Photoless guides remain: ${missing.join(", ")}`);
  const copied = await copyWorldGuideMedia(ROOT);
  assert.equal(copied.length, manifest.assets.length);
});
