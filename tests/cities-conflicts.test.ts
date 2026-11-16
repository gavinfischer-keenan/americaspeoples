import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
const rows=dataset.records;
test('new city coverage reaches both Andean centers and multiple Mesoamerican traditions',()=>{
 for(const name of ['Ollantaytambo','Pikillacta','Huánuco Pampa','Calixtlahuaca','Tenayuca','Malinalco','Calakmul','Palenque','Monte Albán','Tzintzuntzan']){
  assert.ok(rows.some(r=>r.id.startsWith('city-')&&r.title.includes(name)&&r.location&&r.time.start!==null),name);
 }
 const sites=rows.filter(r=>r.id.startsWith('city-'));
 assert.ok(sites.length>=40);
 for(const r of sites){assert.ok(r.time.start!<=r.time.end!);assert.ok(r.location!.lat<40&&r.location!.lat>-60);assert.ok(r.location!.lon< -30&&r.location!.lon> -120);}
});
test('battle encounters have a place, parties, a dated source, and a point rather than a war polygon',()=>{
 for(const name of ['Gettysburg','Alamo','Queenston','Châteauguay','Ayacucho','Maipú','Puebla','San Jacinto','Boyacá','Carabobo'])assert.ok(rows.some(r=>r.overlay?.kind==='conflict'&&r.title.includes(name)),name);
 const battles=rows.filter(r=>r.id.startsWith('battle-'));assert.ok(battles.length>=400);
 for(const r of battles){assert.equal(r.overlay?.geometry?.type,'Point');assert.ok(r.location);assert.match(r.time.eventDate??'',/^\d{4}-\d{2}-\d{2}$/);assert.ok(r.claims.some(c=>c.id==='encounter'&&c.support.length));}
});
test('Machu Picchu evidence is anchored at the archaeological city, with documented geography',()=>{
 for(const id of ['south-machupicchu-ams-occupation','r9v-inca-machupicchu-bayesian-alternative','r9v-inca-machupicchu-retainers']){
  const r=rows.find(r=>r.id===id)!;assert.ok(r.location);assert.ok(Math.abs(r.location.lat+13.164)<0.004);assert.ok(Math.abs(r.location.lon+72.545)<0.004);assert.match(r.location.provenance,/Cusco|CUS/);
 }
});
test('Kitsissut keeps the dated specimen range distinct from a habitation interval',()=>{
 const camp=rows.find(r=>r.id==='north-kitsissut')!;
 assert.equal(camp.time.kind,'occurrence');assert.equal(camp.history?.kind,'attestation');
});
test('Ollantaytambo uses qualified local construction attribution rather than empire dates',()=>{
 const city=rows.find(r=>r.id==='city-ollantaytambo')!;
 assert.equal(city.time.kind,'occurrence');assert.notEqual(city.time.end,1532);
 assert.match(city.review.summary,/Sarmiento|Pachacútec/);assert.match(city.review.limitations,/Wiracocha/);
});
test('source-described massacres survive inventory import',()=>{
 for(const code of ['ks001','tn030','va076','ar014','nd004','nd005','va070']){
  const r=rows.find(r=>r.id==='battle-cwsac-'+code)!;assert.ok(r,code);
  assert.equal(r.overlay?.kind,'violence',code);assert.match(r.review.summary,/civilian|wounded|surrender|massacre|women|prisoner|village/i,code);
 }
 assert.doesNotMatch(rows.find(r=>r.id==='battle-cwsac-ks001')!.review.summary,/Union and Confederate forces fought/);
 for(const code of ['mn001','mn002','nd001','nd002','nd003','nd004','nd005']){
  const r=rows.find(r=>r.id==='battle-cwsac-'+code)!;
  assert.doesNotMatch(r.review.summary,/Confederate/);assert.match(r.review.summary,/Dakota|Lakota/);
 }
});
