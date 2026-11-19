import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {geoArea,geoContains,geoEquirectangular} from 'd3-geo';
import type {Polygon,MultiPolygon} from 'geojson';
import {boundariesAt} from '../src/boundaries';
import {AtlasContext} from '../src/atlas-context';
import {validateEuropeBoundaries} from '../src/europe-boundaries';

const read=()=>JSON.parse(readFileSync('data/atlases/europe/boundaries.json','utf8'));
test('European political outlines have locally bounded, correctly wound source geometry',()=>{
 const bundle=validateEuropeBoundaries(read());
 for(const row of bundle.boundaries){
  assert.ok(geoArea(row.geometry as Polygon|MultiPolygon)>0 && geoArea(row.geometry as Polygon|MultiPolygon)<1,row.id);
  assert.ok(geoContains(row.geometry as Polygon|MultiPolygon,row.labelPoint),row.id);
  assert.ok(row.sourceRows.length,row.id);
 }
 const bad=read();bad.boundaries[0].authority='conquest';assert.throws(()=>validateEuropeBoundaries(bad));
 const future=read();future.boundaries[0].end='1901-12-31';assert.throws(()=>validateEuropeBoundaries(future));
});
test('Northern European annual transitions preserve distinct legal geographies',()=>{
 const bundle=validateEuropeBoundaries(read());
 const at=(year:number)=>boundariesAt(bundle.boundaries,year);
 const containing=(year:number,pattern:RegExp,p:[number,number])=>at(year).some(b=>pattern.test(b.name)&&geoContains(b.geometry as Polygon|MultiPolygon,p));
 const dublin:[number,number]=[-6.28,53.35],edinburgh:[number,number]=[-3.2,55.95];
 assert.ok(containing(1707,/Kingdom of Great Britain/,edinburgh));
 assert.ok(containing(1707,/Kingdom of Ireland/,dublin));
 assert.ok(!containing(1800,/Kingdom of Great Britain/,dublin));
 assert.ok(containing(1801,/United Kingdom of Great Britain and Ireland/,dublin));
 assert.ok(containing(1808,/Swed/, [25,60.3]));
 assert.ok(containing(1809,/Grand Duchy of Finland/, [25,60.3]));
 assert.ok(!containing(1809,/Grand Duchy of Finland/, [29,60.9]));
 assert.ok(containing(1812,/Grand Duchy of Finland/, [29,60.9]));
 assert.ok(containing(1814,/Norway.*Sweden/, [10.75,60]));
 assert.ok(containing(1863,/Danish/, [9.45,54.79]));
 assert.ok(!containing(1864,/Danish/, [9.45,54.79]));
 assert.ok(containing(1900,/Grand Duchy of Finland/, [25,60.3]));
 assert.equal(at(1901).length,0);
});
test('Medieval kingdoms, crown relationships and settlement districts are distinguished',()=>{
 const bundle=validateEuropeBoundaries(read());
 assert.ok(!boundariesAt(bundle.boundaries,55).some(b=>b.name.includes('Roman Britain')));
 assert.ok(boundariesAt(bundle.boundaries,1900).some(b=>b.name.includes('Faroe Islands · advisory Løgting')));
 assert.ok(boundariesAt(bundle.boundaries,125).some(b=>b.name.includes('Roman Britain')));
 assert.ok(boundariesAt(bundle.boundaries,850).some(b=>/Wessex/.test(b.name)));
 assert.ok(boundariesAt(bundle.boundaries,1150).some(b=>/Icelandic Commonwealth/.test(b.name)));
 const greenland=bundle.boundaries.find(b=>/Norse Greenland/.test(b.name))!;
 assert.equal(greenland.authority,'settlement-district');
 assert.ok(!geoContains(greenland.geometry as Polygon|MultiPolygon,[-40,72]));
 assert.ok(bundle.boundaries.some(b=>b.name.includes('Kalmar') && b.authority==='shared-crown'));
 assert.ok(bundle.gaps.some(g=>g.includes('Sámi')));
});

test('rendered territories distinguish a shared crown, a kingdom and reconstructed settlement districts',()=>{
 const context=new AtlasContext();
 context.boundaries=validateEuropeBoundaries(read()).boundaries;
 const projection=geoEquirectangular();
 const late=context.draw(projection,1900,4);
 assert.match(late,/class="boundary-nation europe-authority-shared-crown"/);
 assert.match(late,/class="boundary-nation europe-authority-kingdom"/);
 const medieval=context.draw(projection,1150,4);
 assert.match(medieval,/europe-authority-settlement-district europe-reconstructed-territory/);
});

test('dated built infrastructure appears from its first evidence and retains its construction meaning',()=>{
 const context=new AtlasContext();
 const base={name:'Local link',geometry:{type:'LineString',coordinates:[[1,60],[3,60]]},sourceId:'local',precision:'Schematic',note:'Route first attested at this date.'};
 context.rails=[{...base,id:'early-road',start:1550,networkKind:'road'},{...base,id:'later-line',start:1850,networkKind:'rail'}];
 context.options.rails=true;
 const projection=geoEquirectangular();
 const early=context.draw(projection,1700,2);
 assert.match(early,/data-infrastructure="early-road" class="network-road"/);
 assert.doesNotMatch(early,/later-line/);
 const late=context.draw(projection,1890,2);
 assert.match(late,/data-infrastructure="later-line" class="network-rail"/);
 assert.match(late,/first attested|built or attested/i);
 assert.match(late,/continued service is not established/i);
});
