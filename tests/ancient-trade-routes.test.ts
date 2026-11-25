import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { mergeWorldShards } from '../scripts/world-build';
import { readEuropeData } from '../scripts/europe-build';

test('ancient-trade-africa-mideast-europe world shard validates cleanly and spans Africa, Middle East, and Europe through 100 CE', async () => {
  const names = readdirSync('data/world').filter((n) => n.endsWith('.json')).sort();
  const shards = names.map((n) => JSON.parse(readFileSync(`data/world/${n}`, 'utf8')));
  const combined = mergeWorldShards(shards);

  const tradeWaves = combined.waves.filter((w) => w.id.startsWith('atrd-wave-'));
  assert.ok(tradeWaves.length >= 16, `expected >=16 new trade waves, got ${tradeWaves.length}`);

  for (const w of tradeWaves) {
    assert.equal(w.kind, 'trade', `${w.id} must be kind 'trade'`);
    assert.ok(w.start <= 100, `${w.id} start (${w.start}) must be <= 100 CE`);
    assert.ok(w.coordinates.length >= 2, `${w.id} must have >= 2 coordinates`);
    assert.ok(w.sourceIds.length > 0, `${w.id} must cite sources`);
  }

  assert.ok(tradeWaves.some((w) => w.regionIds.includes('africa')));
  assert.ok(tradeWaves.some((w) => w.regionIds.includes('europe')));

  const rawShard = JSON.parse(await readFile('data/world/ancient-trade-africa-mideast-europe.json', 'utf8'));
  assert.ok(rawShard.evidence.length >= 14);
  for (const s of rawShard.sources) {
    assert.match(s.url, /^https:\/\/doi\.org\//, `expected HTTPS DOI URL for ${s.id}`);
  }
});

test('ancient-trade-evidence Europe shard validates cleanly with mapped trade routes <= 100 CE', async () => {
  const europe = await readEuropeData();
  const routes = europe.entries.filter((e) => e.id.startsWith('eutrd-'));
  assert.ok(routes.length >= 8, `expected >=8 new Europe trade routes, got ${routes.length}`);

  for (const entry of routes) {
    assert.equal(entry.networkKind, 'trade', `${entry.id} must have networkKind 'trade'`);
    assert.equal(entry.category, 'exchange', `${entry.id} must be category 'exchange'`);
    assert.ok(entry.start <= 100, `${entry.id} start (${entry.start}) must be <= 100 CE`);
    assert.ok(entry.destination || (entry.routeCoordinates && entry.routeCoordinates.length === 2), `${entry.id} must define schematic two-point endpoints`);
  }
});
