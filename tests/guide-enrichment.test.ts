import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

test('guide enrichment gives every original guide sourced historical narrative and verified reading links', async () => {
  const raw = await readFile('data/guide-enrichment.json', 'utf8').catch(() => null);
  assert.ok(raw, 'The independently authored guide enrichment must exist');
  const enrichment = JSON.parse(raw);
  const { pages } = JSON.parse(await readFile('data/site-guide-content.json', 'utf8'));
  assert.equal(enrichment.pages.length, 43);
  for (const page of enrichment.pages) {
    const original = pages.find((p:any) => p.id === page.id);
    assert.ok(original, page.id);
    const urls = new Set(original.sections.flatMap((s:any) => [...s.paragraphs.flatMap((p:any) => p.sources), ...s.rows.flatMap((r:any) => r.sources)]).concat(original.sources.map((s:any) => s.url)));
    assert.ok(page.narrative.length >= 2, page.id);
    assert.ok(page.narrative.map((p:any) => p.text).join(' ').split(/\s+/).length >= 80, page.id);
    for (const paragraph of page.narrative) {
      assert.ok(paragraph.sources.length, page.id);
      for (const url of paragraph.sources) assert.ok(urls.has(url), `${page.id}: ${url}`);
    }
    assert.ok(page.reading.some((r:any) => r.kind === 'encyclopedia' && r.checkedAt && r.url.startsWith('https://en.wikipedia.org/wiki/')), page.id);
  }
});

test('each stored photograph matches its provenance and retains a separate reusable license', async () => {
  const raw = await readFile('data/guide-media/manifest.json', 'utf8').catch(() => null);
  assert.ok(raw, 'Photographs need an item-level license manifest');
  const manifest = JSON.parse(raw);
  assert.ok(manifest.images.length >= 6);
  for (const image of manifest.images) {
    const bytes = await readFile(`data/guide-media/${image.file}`);
    assert.equal(bytes.length, image.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), image.sha256);
    assert.ok(image.bytes < 2_000_000);
    assert.ok(image.creator && image.sourcePage && image.licenseUrl && image.licenseEvidence && image.checkedAt);
    assert.ok(['CC BY 2.0', 'Public domain', 'CC0 1.0'].includes(image.license));
    assert.ok(image.width > 0 && image.height > 0);
  }
});

test('guide rendering includes attribution, preserves reading fallback, and escapes supplied text', async () => {
  const module = await import('../scripts/guide-enrichment').catch(() => null);
  assert.ok(module, 'The guide enrichment renderer must exist');
  const enrichment = JSON.parse(await readFile('data/guide-enrichment.json', 'utf8'));
  const media = JSON.parse(await readFile('data/guide-media/manifest.json', 'utf8'));
  const narrative = module.guideNarrativeHTML('chaco', enrichment, media);
  assert.match(narrative, /<figure/);
  assert.match(narrative, /Joekoz451/);
  assert.match(narrative, /Public domain/);
  assert.match(narrative, /not subject to the atlas/);
  assert.doesNotMatch(narrative, /<img[^>]*src="https:/);
  const reading = module.guideReadingHTML('new-island-guide', [{url:'https://example.org/research',title:'An <island> source'}], enrichment);
  assert.match(reading, /Further reading/);
  assert.match(reading, /An &lt;island&gt; source/);
  assert.match(reading, /https:\/\/example.org\/research/);
  assert.throws(() => module.guideReadingHTML('unknown', [{url:'javascript:alert(1)',title:'Bad'}], enrichment), /Unsafe/);
  const future = module.guideReadingHTML('future', [1,2,3,4].map(n => ({url:`https://example.org/${n}`,title:`Study ${n}`})).concat([{url:'https://en.wikipedia.org/wiki/Yap',title:'Wikipedia — Yap'}]), enrichment);
  assert.match(future, /https:\/\/en.wikipedia.org\/wiki\/Yap/, 'New guide Wikipedia links remain visible even after several scholarly sources');
});
