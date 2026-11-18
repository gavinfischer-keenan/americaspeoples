import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path=new URL('../data/guide-maps/manifest.json',import.meta.url);
const manifest=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):null;
test('Chaco includes native-size surveyed ancient-road sheets with traceable public-domain sources',()=>{
 assert.ok(manifest,'reference map manifest');
 const roads=manifest.assets.filter((m:any)=>m.id.startsWith('chaco-'));
 assert.ok(roads.length>=5);
 for(const m of roads){
  assert.ok(Math.max(...m.pixels)>=2900,m.id);assert.match(m.rights,/Public domain/i);
  assert.ok(m.scope&&m.chronologicalScope&&m.credit&&m.sourceUrl);
  const bytes=readFileSync(new URL('../data/guide-maps/'+m.file,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),m.sha256,m.id);
 }
});
test('source maps and official linked references remain assigned to their actual guides',()=>{
 assert.ok(manifest);
 assert.ok(manifest.linkedReferences.some((r:any)=>r.guideIds.includes('machu-picchu')&&/Sanctuary/.test(r.title)));
 assert.ok(manifest.assets.every((r:any)=>r.guideIds.length&&r.originalAssetUrl.startsWith('https://')));
});
