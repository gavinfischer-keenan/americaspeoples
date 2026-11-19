import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

async function catalog() {
  assert.ok(existsSync(new URL('../src/atlas-catalog.ts', import.meta.url)), 'The four-atlas catalog must exist');
  return import('../src/atlas-catalog');
}

test('the four approved atlases keep Americas on its current route', async () => {
  const { atlases } = await catalog();
  assert.deepEqual(atlases.map(a => a.title), ['Americas', 'Africa & human origins', 'Europe & Mediterranean', 'Asia & Pacific']);
  assert.equal(atlases[0].href, '#movie');
  assert.equal(atlases[0].status, 'available');
  assert.equal(atlases.find(a=>a.id==='europe')?.status,'available');
  assert.ok(atlases.filter(a=>['africa','asia-pacific'].includes(a.id)).every(a=>a.status==='coming-soon'));
});

test('future routes resolve only their exact registered destination', async () => {
  const { resolveAtlasRoute, atlases } = await catalog();
  for (const atlas of atlases.slice(1)) assert.equal(resolveAtlasRoute(atlas.href), atlas.id);
  for (const hash of ['#movie', '#atlas/americas', '#atlas/unknown', '#atlas/africa/extra', '#atlas/%61frica', '#atlas/europe?records=all']) {
    assert.equal(resolveAtlasRoute(hash), null, hash);
  }
});

test('every future manifest is empty and cannot accidentally enable research content', async () => {
  const { loadAtlasManifest, validatePlannedAtlasManifest } = await catalog();
  for (const id of ['africa', 'asia-pacific'] as const) {
    const manifest = loadAtlasManifest(id);
    const onDisk = JSON.parse(readFileSync(new URL(`../data/atlases/${id}/manifest.json`, import.meta.url), 'utf8'));
    assert.deepEqual(manifest, onDisk);
    assert.equal(manifest.status, 'coming-soon');
    for (const key of ['dataFiles', 'recordIds', 'storyIds', 'overlayFiles', 'sourceIds'] as const) {
      assert.deepEqual(manifest[key], []);
      assert.throws(() => validatePlannedAtlasManifest({ ...manifest, [key]: ['existing-americas-content'] }), /empty/);
    }
  }
});

test('future maps contain only the basemap and the coming-soon message', async () => {
  const { loadAtlasManifest } = await catalog();
  const { atlasPreviewHTML } = await import('../src/atlas-switcher');
  const land = JSON.parse(readFileSync(new URL('../data/land.geojson', import.meta.url), 'utf8'));
  const outputs = (['africa', 'asia-pacific'] as const).map(id => {const manifest=loadAtlasManifest(id);assert.equal(manifest.status,'coming-soon');if(manifest.status!=='coming-soon')throw Error('Unexpected active manifest');return atlasPreviewHTML(manifest,land);});
  for (const html of outputs) {
    assert.match(html, /COMING SOON/);
    assert.match(html, /class="atlas-preview-land" d="M/);
    assert.match(html, /Modern coastlines/);
    assert.match(html, /Natural Earth/);
    assert.doesNotMatch(html, /data-record|data-voyage|class="features"|<circle|<image|ice-sheet|timeline|data-source-id/);
    assert.equal((html.match(/<path /g) ?? []).length, 2, 'Only ocean boundary and coastline paths belong in a preview');
  }
  assert.notEqual(outputs[0].match(/class="atlas-preview-land" d="([^"]+)/)?.[1], outputs[1].match(/class="atlas-preview-land" d="([^"]+)/)?.[1], 'Each destination uses its own regional view');
});

test('the atlas chooser links all destinations and identifies the selected atlas', async () => {
  await catalog();
  const { atlasNavigationHTML } = await import('../src/atlas-switcher');
  const html = atlasNavigationHTML('europe');
  assert.match(html, /href="#movie"/);
  assert.match(html, /href="#atlas\/africa"/);
  assert.match(html, /href="#atlas\/europe" aria-current="page"/);
  assert.match(html, /href="#atlas\/asia-pacific"/);
  assert.match(html, /Africa &amp; human origins/);
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
});
