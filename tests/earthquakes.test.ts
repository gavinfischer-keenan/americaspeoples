import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import hazards from '../data/hazard-events.json';
import {climateKinds,climateLabels,physicalSources} from '../src/physical-reference';

test('standalone historical earthquake importer enforces dates, scope, dedup and source fidelity',()=>{
  execFileSync(process.env.PYTHON_PATH || 'python',['-m','unittest','discover','-s','tests','-p','test_earthquake_import.py']);
});

test('earthquake layer keeps official epicenters and dated context with source attribution',()=>{
  const events=hazards.events.filter(e=>e.kind==='earthquake');
  assert.ok(events.length>0,'frozen historical earthquake events required');
  assert.ok(climateKinds.some(k=>k==='earthquake'));
  assert.equal(climateLabels.earthquake,'Significant earthquake epicenters');
  assert.ok(physicalSources.some(s=>s.id==='noaa-earthquake'&&s.url==='https://doi.org/10.7289/V5TD9V7K'));
  for(const e of events){
    const d=e.detail as Record<string,unknown>;
    assert.equal(e.sourceId,'noaa-earthquake');
    assert.equal(e.start,Number(d.year)<0?Number(d.year)+1:d.year);
    assert.equal(e.start,e.end);
    assert.ok(Number(d.year)<=1934);
    assert.deepEqual(e.coordinates,[d.longitude,d.latitude]);
    assert.match(e.limitations,/No settlement impact is inferred/);
    assert.ok(!('settlementId' in e));
  }
});

test('all earthquake API pages retain verifiable original bytes and complete catalog identities',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../data/physical-sources/fetch-manifest.json',import.meta.url),'utf8'));
  const pages=manifest.filter((r:{file:string})=>/^noaa-earthquakes(?:-page\d+)?\.json$/.test(r.file));
  assert.ok(pages.length>0);
  const rows=new Map<number,Record<string,unknown>>();
  let total=0;
  for(const entry of pages){
    const bytes=readFileSync(new URL('../data/physical-sources/'+entry.file,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);
    assert.equal(bytes.length,entry.bytes);
    const page=JSON.parse(bytes.toString('utf8'));
    assert.equal(page.totalPages,pages.length);
    total=page.totalItems;
    for(const row of page.items) rows.set(row.id,row);
  }
  assert.equal(rows.size,total);
  for(const event of hazards.events.filter(e=>e.kind==='earthquake')){
    const original=rows.get(Number(event.id.replace('noaa-earthquake-','')))!;
    assert.ok(original);
    for(const [key,value] of Object.entries(original)) assert.deepEqual((event.detail as Record<string,unknown>)[key],value);
  }
});
