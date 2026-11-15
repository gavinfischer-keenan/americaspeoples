import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { geoDistance, geoInterpolate } from 'd3-geo';
import { regionalRailSegments } from '../src/atlas-context';
import { boundariesAt, validateBoundaries } from '../src/boundaries';
import { dataset } from '../src/published-data';
import { historyState,historyLabel } from '../src/history';
import { dateValue,sampleVoyage,voyageDate,arrivedVoyageRecords } from '../src/voyages';
const read=(name:string)=>JSON.parse(readFileSync(`data/${name}.json`,'utf8'));

test('all bundled outlines validate and Florida replaces its territory without a proposed Deseret',()=>{
 const rows=['historical','colonial','national','early-national','reservation'].flatMap(n=>read(n+'-boundaries'));
 const sources=['boundary-sources','expanded-boundary-sources','early-national-boundary-sources','reservation-boundary-sources'].flatMap(read);
 assert.deepEqual(validateBoundaries(rows,new Set(sources.map(s=>s.id))),[]);
 assert.ok(!rows.some(r=>r.id.startsWith('newberry-ds_deseret')));
 assert.ok(rows.some(r=>r.sourceName==='Belize'&&r.name==='British Honduras (British colony)'));
 assert.ok(rows.some(r=>r.sourceName==='Guyana'&&r.name==='British Guiana (British colony)'));
 assert.ok(boundariesAt(rows,1844).some(r=>r.name==='Florida Territory'));
 assert.ok(!boundariesAt(rows,1845).some(r=>r.name==='Florida Territory'));
 assert.ok(boundariesAt(rows,1845).some(r=>r.name==='Florida'&&r.kind==='state'));
 assert.ok(boundariesAt(rows,1803).some(r=>r.name==='Louisiana Purchase'));
 assert.ok(!boundariesAt(rows,1805).some(r=>r.name==='Louisiana Purchase'));
});
test('regional rail construction accumulates after opening without extending service evidence',()=>{
 const rail=dataset.records.find(r=>r.id==='rail-peru-callao-lima-1851')!;
 assert.equal(rail.time.end,1851);
 const segments=regionalRailSegments([rail]);
 assert.equal(segments.filter(r=>r.start<=1850).length,0);
 assert.equal(segments.filter(r=>r.start<=1900).length,1);
 assert.match(segments[0].note,/Continued service is not implied/);
});
test('documented visits accumulate after the event while no future visit is asserted',()=>{
 const visit=dataset.records.find(r=>r.id.startsWith('visit-beagle'))!;
 assert.equal(historyState(visit,visit.time.start!-1),'outside');
 assert.equal(historyState(visit,1934),'past-place');
 assert.match(historyLabel(visit,1934),/Historical visit/);
 assert.doesNotMatch(historyLabel(visit,1934),/Earlier occupation/);
});
test('voyage symbols follow the great-circle segments drawn on the map',()=>{
 const v=read('voyages').voyages.find((v:any)=>v.id.includes('magellan'));
 for(let i=0;i<v.stops.length-1;i++){
  const a=v.stops[i],b=v.stops[i+1],start=dateValue(a.departure),end=dateValue(b.arrival);
  if(end<=start)continue;
  const sample=sampleVoyage(v.stops,(start+end)/2)!;
  assert.ok(geoDistance(sample.coordinates,geoInterpolate(a.coordinates,b.coordinates)(.5))<1e-8);
 }
 assert.equal(voyageDate(dateValue('0099-12-31')),'0099-12-31');
});

test("daily expedition evidence waits for the documented arrival within the same year",()=>{
 const v=read("voyages").voyages.find((v:any)=>v.id==="beagle-1831-1836");
 assert.equal(arrivedVoyageRecords(v,dateValue("1832-01-01")).size,0);
 assert.ok(!arrivedVoyageRecords(v,dateValue("1832-02-27")).has("visit-beagle-1831-1836-3"));
 assert.ok(arrivedVoyageRecords(v,dateValue("1832-02-28")).has("visit-beagle-1831-1836-3"));
});
