import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dataset } from '../src/published-data';
import { exploreCategories, exploreCategory } from '../src/explore';
import { adaptWorldDataForExplore, filterByDateRange } from '../src/explore-world';
import { validateWorldData, type WorldData } from '../src/world-model';
import { validateRockArtSpecimens } from '../scripts/rock-art-gallery';
import { readWorldGuides } from '../scripts/world-guide-data';
import type { WorldGuideMedia } from '../scripts/world-guide-media';

test('North American rock-art expansion covers Nevada overhangs and all 8 regions with approximate dates & Indigenous cultures', () => {
  const nara = dataset.records.filter(r => r.id.startsWith('nara-'));
  assert.ok(nara.length >= 65, `Expected >= 65 North American rock art records, got ${nara.length}`);
  for (const r of nara) {
    assert.equal(r.time.kind, 'interval');
    assert.equal(r.time.approximate, true);
    assert.ok(r.time.start !== null && r.time.end !== null && r.time.end <= 1900, `${r.id} timeline interval`);
    assert.ok(r.culture.name && r.culture.id !== 'unknown', `${r.id} attributed to Indigenous/regional culture`);
    assert.ok(r.sources.length >= 1, `${r.id} cites primary sources`);
  }
  for (const requiredId of [
    'nara-winnemucca-lake-petroglyphs',
    'nara-grimes-point-hidden-cave',
    'nara-toquima-cave-overhang',
    'nara-valley-of-fire-atlatl-rock',
    'nara-horseshoe-canyon-great-gallery',
    'nara-white-shaman-lower-pecos',
    'nara-chumash-painted-cave',
    'nara-sierra-san-francisco-baja',
    'nara-oxtotitlan-juxtlahuaca-olmec',
    'nara-writing-on-stone',
    'nara-agawa-rock-ontario',
    'nara-picture-cave-mo',
    'nara-19th-unnamed-cave-al',
  ]) {
    assert.ok(nara.some(r => r.id === requiredId), `Missing NA rock art record ${requiredId}`);
  }
});

test('Africa & Middle East early art & habitations cover through 100 BCE with rock-art category in Explore', () => {
  const ancestors = JSON.parse(readFileSync('data/world/ancestors.json', 'utf8')) as WorldData;
  const rawShard = JSON.parse(readFileSync('data/world/early-art-africa-middle-east.json', 'utf8')) as WorldData;
  const worldShard = validateWorldData({
    ...rawShard,
    sources: [...ancestors.sources, ...rawShard.sources],
    taxa: ancestors.taxa,
  });
  const art = worldShard.evidence.filter(e => e.id.startsWith('amea-art-'));
  const hab = worldShard.evidence.filter(e => e.id.startsWith('amea-hab-'));
  assert.ok(art.length >= 25, `Expected >= 25 Africa/ME art records, got ${art.length}`);
  assert.ok(hab.length >= 35, `Expected >= 35 Africa/ME early habitation records, got ${hab.length}`);
  for (const h of hab) {
    assert.ok(h.end <= -100, `Habitation ${h.id} must end at or before 100 BCE`);
  }

  assert.equal(exploreCategories['rock-art'], 'Rock art & visual records');
  const adapted = adaptWorldDataForExplore(worldShard, new Set(dataset.records.map(r => r.id)));
  const combined = [...dataset.records, ...adapted];

  const qurta = combined.find(r => r.id === 'world:amea-art-qurta-egypt')!;
  const winnemucca = combined.find(r => r.id === 'nara-winnemucca-lake-petroglyphs')!;
  const toquima = combined.find(r => r.id === 'nara-toquima-cave-overhang')!;
  assert.equal(exploreCategory(qurta), 'rock-art');
  assert.equal(exploreCategory(winnemucca), 'rock-art');
  assert.equal(exploreCategory(toquima), 'rock-art');

  const rockArtRecords = combined.filter(r => exploreCategory(r) === 'rock-art');
  assert.ok(rockArtRecords.length >= 100, `Explore rock-art filter captures ${rockArtRecords.length} global records`);

  // Sliding the Latest handle to 10,000 BCE includes Qurta & Winnemucca Lake, excluding late ceramic/historical murals.
  const latePleistocene = filterByDateRange(rockArtRecords, -100000, -10000, -100000, 1900, false);
  assert.ok(latePleistocene.dated.some(r => r.id === qurta.id));
  assert.ok(latePleistocene.dated.some(r => r.id === winnemucca.id));
  assert.equal(latePleistocene.dated.some(r => r.id === 'nara-agawa-rock-ontario'), false);
});

test('Rock-art gallery specimens link to verified checksummed media and three flagship guides', async () => {
  const media = JSON.parse(readFileSync('data/world-guide-media.json', 'utf8')).assets as WorldGuideMedia[];
  const specimens = validateRockArtSpecimens(JSON.parse(readFileSync('data/rock-art-gallery.json', 'utf8')), media);
  assert.ok(specimens.length >= 48, `Expected >= 48 specimens, got ${specimens.length}`);

  const lascaux = media.find(m => m.id === 'lascaux-replica-bulls')!;
  assert.ok(lascaux.sourceUrl.includes('Lascaux'), 'Lascaux media points to genuine Lascaux Wikimedia file');

  const guides = await readWorldGuides();
  for (const id of ['world-rock-art-in-toto', 'world-north-america-rock-art', 'world-africa-middle-east-art-habitations']) {
    assert.ok(guides.some(g => g.id === id), `Missing flagship guide ${id}`);
  }
});
