import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dataset } from '../src/published-data';
import { isAmericasRecord, isPacificRecord } from '../src/region-partition';
import { deepDives, deepDiveIndexHTML, diveGroupedHTML, primaryDiveRegion } from '../src/deep-dives';

test('Central Africa pre-100 CE shard covers 36 sourced sites across the Congo Basin, CAR, Gabon, Cameroon, Chad, South Sudan and Angola', async () => {
  const shard = JSON.parse(await readFile('data/world/central-africa-early-archaeology.json', 'utf8'));
  assert.equal(shard.evidence.length, 36);
  for (const e of shard.evidence) {
    assert.ok(e.id.startsWith('cafx-'), e.id);
    assert.deepEqual(e.regionIds, ['africa'], e.id);
    assert.ok(e.start <= 100, `${e.id} start (${e.start}) <= 100 CE`);
    assert.ok(e.start <= e.end && e.end <= 100, `${e.id} end (${e.end}) <= 100 CE`);
    assert.ok(e.sourceIds.length >= 1, e.id);
  }
  const sourceIds = new Set(shard.sources.map((s: { id: string }) => s.id));
  for (const e of shard.evidence) {
    for (const sid of e.sourceIds) assert.ok(sourceIds.has(sid), `${e.id} cites ${sid}`);
  }
});

test('Eurasian Steppe, Urals, Kazakhstan and Interior NE Siberia shard adds 54 sites across both formerly sparse zones', async () => {
  const shard = JSON.parse(await readFile('data/world/eurasian-steppe-interior-siberia.json', 'utf8'));
  assert.equal(shard.evidence.length, 54);
  const steppe = shard.evidence.filter((e: any) => e.coordinates[0] >= 46 && e.coordinates[0] <= 86);
  const neSiberia = shard.evidence.filter((e: any) => e.coordinates[0] >= 95 && e.coordinates[1] >= 53);
  assert.ok(steppe.length >= 26, `Expected >= 26 Volga-Ural-Kazakh-WSiberia sites, got ${steppe.length}`);
  assert.ok(neSiberia.length >= 24, `Expected >= 24 Interior NE Siberia/Yakutia/Evenkia sites, got ${neSiberia.length}`);
  for (const e of shard.evidence) {
    assert.ok(e.id.startsWith('esib-'), e.id);
    assert.ok(!e.regionIds.includes('africa'), `${e.id} must not alter Africa record count`);
    assert.ok(e.start <= e.end && e.end <= 1900, `${e.id} dates bounded <= 1900`);
  }
});

test('Interior Brazil (28) and Interior Australia (28) canonical records validate and route to Americas and Pacific atlases', () => {
  const brazil = dataset.records.filter(r => r.id.startsWith('ibrz-'));
  const australia = dataset.records.filter(r => r.id.startsWith('iaus-'));
  assert.equal(brazil.length, 28);
  assert.equal(australia.length, 28);
  for (const r of brazil) {
    assert.ok(isAmericasRecord(r), `${r.id} routes to Americas`);
    assert.ok(!isPacificRecord(r), `${r.id} is not Pacific`);
    assert.ok(r.time.end !== null && r.time.end <= 1900, r.id);
  }
  for (const r of australia) {
    assert.ok(isPacificRecord(r), `${r.id} routes to Pacific`);
    assert.ok(r.time.end !== null && r.time.end <= 1900, r.id);
  }
});

test('Deep Dives fixes SE Asia/Aleutian region assignment and groups directory listings cleanly by region', () => {
  for (const id of ['place-borneo-brunei', 'place-cebu-philippines', 'place-timor']) {
    const d = deepDives.find(x => x.id === id);
    assert.ok(d, id);
    assert.equal(primaryDiveRegion(d), 'asia-pacific', `${id} classified under Asia`);
  }
  for (const id of ['place-aleutian-islands', 'place-amaknak-bridge', 'place-unalaska-village', 'place-chaluka-nikolski']) {
    const d = deepDives.find(x => x.id === id);
    assert.ok(d, id);
    assert.equal(primaryDiveRegion(d), 'americas', `${id} kept together under Americas`);
  }
  const placesHtml = deepDiveIndexHTML('places');
  assert.match(placesHtml, /class="dive-region-jump"/);
  assert.match(placesHtml, /data-dive-group="americas"/);
  assert.match(placesHtml, /data-dive-group="africa"/);
  assert.match(placesHtml, /data-dive-group="europe"/);
  assert.match(placesHtml, /data-dive-group="asia-pacific"/);
  assert.match(placesHtml, /data-dive-group="pacific"/);
  const africaAll = deepDives.filter(d => d.atlasIds.includes('africa'));
  const catHtml = diveGroupedHTML(africaAll, 'category');
  assert.match(catHtml, /data-dive-group="places"/);
  assert.match(catHtml, /data-dive-group="subjects"/);
});

test('Europe map tightens initial zoom and drops boilerplate headline text', async () => {
  const europeSource = await readFile('src/europe-page.ts', 'utf8');
  const zoomMatch = europeSource.match(/EUROPE_HOME_ZOOM\s*=\s*([0-9.]+)/);
  assert.ok(zoomMatch && Number(zoomMatch[1]) >= 4.5, 'Europe home zoom tightened to >= 4.5');
  assert.doesNotMatch(europeSource, /Modern coastlines for orientation/);
  assert.doesNotMatch(europeSource, /Selected sourced evidence, with gaps still to fill/);
});
