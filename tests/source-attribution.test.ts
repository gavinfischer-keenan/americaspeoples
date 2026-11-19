import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('bundled world rivers and fonts retain known source licenses',async()=>{
 const mod=await import('../scripts/source-attribution-build');
 const data=JSON.parse(await readFile('data/world-guide-context-sources.json','utf8'));
 const entries=mod.collectSourceAttributions({records:[],pages:[],enrichment:{pages:[]},media:{images:[]},manifests:[{file:'data/world-guide-context-sources.json',data,reused:true}]});
 assert.equal(entries.length,3);
 for(const asset of data.assets){const entry=entries.find(e=>e.urls.includes(asset.sourceUrl));assert.ok(entry);assert.equal(entry.license,asset.license);assert.ok(entry.urls.includes(asset.downloadUrl));assert.ok(entry.licenseUrls.includes(asset.licenseUrl));}
});

test('source register preserves every canonical citation, folds DOI aliases, and never invents permission', async () => {
  const mod = await import('../scripts/source-attribution-build').catch(() => null);
  assert.ok(mod, 'The site-wide source register must exist');
  const entries = mod.collectSourceAttributions({records:[{id:'one',sources:[{title:'Study',url:'https://journal.example/paper',doi:'10.1234/Study',authors:'A. Author'}]},{id:'two',sources:[{title:'Same study',url:'https://doi.org/10.1234/study'}]}],pages:[{id:'example',sources:[{title:'Museum',url:'https://museum.example/history'}]}],enrichment:{pages:[]},media:{images:[]},manifests:[]});
  assert.equal(entries.length, 2);
  const study = entries.find((e:any) => e.urls.includes('https://journal.example/paper'));
  assert.ok(study);
  assert.ok(study.urls.includes('https://doi.org/10.1234/study'));
  assert.equal(study.license, 'Referenced only; reuse license not verified');
  assert.ok(study.usedIn.includes('Record: one') && study.usedIn.includes('Record: two'));
  const reordered = mod.collectSourceAttributions({records:[{id:'early',sources:[{url:'https://journal.example/paper',title:'Study without DOI metadata'}]},{id:'doi',sources:[{url:'https://doi.org/10.1234/study',title:'DOI version'}]},{id:'late',sources:[{url:'https://journal.example/paper',doi:'10.1234/study',title:'Study'}]}],pages:[],enrichment:{pages:[]},media:{images:[]},manifests:[]});
  assert.equal(reordered.length,1,'A later DOI association merges already-seen URL and DOI entries');
  assert.equal(reordered[0].usedIn.length,3);
});

test('source register covers the full published dataset and all guide citation URLs', async () => {
  const mod = await import('../scripts/source-attribution-build').catch(() => null);
  assert.ok(mod);
  const input = await mod.loadAttributionInputs();
  const entries = mod.collectSourceAttributions(input);
  const urls = new Set(entries.flatMap((entry:any) => entry.urls));
  for (const record of input.records) for (const source of record.sources) assert.ok(urls.has(source.url), `${record.id}: ${source.url}`);
  for (const page of input.pages) {
    for (const source of page.sources) assert.ok(urls.has(source.url), `${page.id}: ${source.url}`);
    for (const section of page.sections ?? []) for (const block of [...section.paragraphs, ...section.rows]) for (const url of block.sources) assert.ok(urls.has(url), `${page.id}: ${url}`);
  }
  for (const image of input.media.images) {
    const source = entries.find((e:any) => e.urls.includes(image.sourcePage));
    assert.equal(source?.kind, image.role === 'site-plan' ? 'Reused historical map / chart' : 'Reused photograph');
    assert.equal(source?.license, image.license);
  }
  const geonames = entries.find((e:any) => e.urls.includes('https://www.geonames.org/export/'));
  assert.equal(geonames?.license, 'CC BY 4.0');
  assert.equal(geonames?.kind, 'Reused geographic data');
  const ice = entries.find((e:any) => e.urls.includes('https://doi.org/10.5281/zenodo.8161764'));
  assert.match(ice?.license ?? '', /CC BY\s?4\.0/);
  const html = mod.sourceAttributionHTML(entries, '# Notices\n\nCopyright Example', '# Project license');
  assert.match(html, /Search sources/);
  assert.match(html, /Referenced only; reuse license not verified/);
  assert.match(html, /Copyright Example/);
  assert.match(html, /<script src="sources-attributions\.js" defer><\/script>/);
  assert.doesNotMatch(html, /<script>/, 'Search must work with the hosting policy that blocks inline scripts');
  assert.doesNotMatch(html, /<script[^>]*src="https:/);
});
