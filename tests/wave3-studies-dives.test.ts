import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { deepDives } from "../src/deep-dives";
import { readWorldGuides } from "../scripts/world-guide-data";
import type { WorldData } from "../src/world-model";

const ROOT = path.resolve(import.meta.dirname, "..");

test("three Africa and Indian Ocean studies exist with valid routes, stops, and territories", () => {
  const shard = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "world", "study-africa-indian-ocean.json"), "utf8"),
  ) as WorldData;
  const ids = (shard.studies ?? []).map((s) => s.id).sort();
  assert.deepEqual(ids, ["bantu-dispersal", "ibn-battuta", "indian-ocean-monsoon"]);
  for (const s of shard.studies ?? []) {
    assert.ok(s.evidenceIds.length >= 8, `${s.id} stops >= 8`);
    assert.ok(s.waveIds.length >= 3, `${s.id} waves >= 3`);
    assert.ok(s.territoryIds.length >= 2, `${s.id} territories >= 2`);
  }
});

test("deep dives expands to 125 world guides with global Languages and Cultures coverage", async () => {
  const guides = await readWorldGuides();
  assert.equal(guides.length, 125);
  const langIds = deepDives.filter((d) => d.category === "languages").map((d) => d.id);
  const cultIds = deepDives.filter((d) => d.category === "cultures").map((d) => d.id);
  for (const reqLang of [
    "world-niger-congo-bantu-languages",
    "world-afroasiatic-semitic-languages",
    "world-indo-european-languages",
    "world-sino-tibetan-languages",
    "world-austronesian-languages",
    "world-dravidian-austroasiatic-languages",
  ]) {
    assert.ok(langIds.includes(reqLang), `Missing language dive card ${reqLang}`);
  }
  for (const reqCult of [
    "world-swahili-coast-world",
    "world-west-african-sahel-empires",
    "world-ethiopian-highland-tradition",
    "world-steppe-pastoralists-eurasia",
    "world-south-asian-classical-traditions",
    "world-east-asian-literate-traditions",
  ]) {
    assert.ok(cultIds.includes(reqCult), `Missing culture dive card ${reqCult}`);
  }
  for (const id of ["ibn-battuta", "indian-ocean-monsoon", "bantu-dispersal"]) {
    assert.ok(
      deepDives.some((d) => d.links.some((l) => l.href === `#study/${id}`)),
      `Missing #study/${id} link in Deep Dives`,
    );
  }
});
