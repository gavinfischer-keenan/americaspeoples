import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {mergeWorldShards} from '../scripts/world-build';
import {AFRICA_EARLY_END,africaEarlyData} from '../src/world-model';

test('Africa inventory remains cited, pre-cutoff and distinct from invented populations',async()=>{
 const dir=new URL('../data/world/',import.meta.url);
 const files=(await readdir(dir)).filter(f=>f.endsWith('.json'));
 const shards=await Promise.all(files.map(async f=>({name:f,data:JSON.parse(await readFile(new URL(f,dir),'utf8'))})));
 const data=mergeWorldShards(shards.map(s=>s.data));
 const additions=shards.filter(s=>s.name.startsWith('africa-')).flatMap(s=>s.data.evidence);
 assert.ok(additions.length>=100,'A continental inventory, not a handful of examples');
 for(const e of additions){
  assert.deepEqual(e.regionIds,['africa'],e.id);
  assert.ok(e.start<=e.end && e.end<=AFRICA_EARLY_END,e.id+' calendar cutoff');
  assert.ok(e.sourceIds.length>0 && e.dateBasis && e.limits,e.id+' provenance');
  assert.ok(!e.population?.length,e.id+' no unsupported census');
 }
 const selected=africaEarlyData(data);
 assert.ok(selected.evidence.length>=additions.length);
 assert.ok(selected.evidence.every(e=>e.regionIds.includes('africa')&&e.start<=AFRICA_EARLY_END));
 assert.ok(selected.evidence.some(e=>e.title.includes('Taung')));
 assert.ok(selected.evidence.some(e=>e.title.includes('Kalambo')));
 assert.ok(selected.evidence.some(e=>e.title.includes('Aïn Boucherit')));
 assert.ok(selected.evidence.some(e=>e.title.includes('Lomekwi')));
});
