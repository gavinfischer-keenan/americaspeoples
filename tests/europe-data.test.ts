import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEuropeData, normalizeEurope, europeDates, europeSelection,europePopulationView, type EuropeData} from '../src/europe-data';

const fixture=():EuropeData=>({schemaVersion:1,regions:[{id:'norway',title:'Norway'}],sources:[{id:'archive',title:'Source',url:'https://example.org/archive',authors:'Archive',year:2025}],entries:[{id:'eu-town',regionId:'norway',title:'A town',category:'habitation',kind:'interval',start:1800,end:1900,approximate:false,dateLabel:'1800–1900',dateMeaning:'Documented settlement evidence',coordinates:[10,60],place:'Town',summary:'Town evidence.',detail:'Specific dated evidence.',uncertainty:'Selected observations only.',sourceIds:['archive'],population:[{year:1800,min:100,max:100,basis:'census',note:'Town boundary in the census',sourceIds:['archive']},{year:1900,min:1000,max:1000,basis:'census',note:'Town boundary in the census',sourceIds:['archive']}]}]});
test('regional normalization preserves evidence dates and dated population snapshots',()=>{
 const data=validateEuropeData(fixture());const [r]=normalizeEurope(data);
 assert.equal(r.time.start,1800);assert.equal(r.time.end,1900);
 assert.deepEqual(r.population?.map(p=>[p.start,p.end,p.min]),[[1800,1800,100],[1900,1900,1000]]);
 assert.ok(r.claims.every(c=>c.support.every(s=>r.sources.some(source=>source.id===s.sourceId))));
});
test('regional schema rejects unsupported chronology, sources, and invalid counts',()=>{
 for(const change of [(d:EuropeData)=>d.entries[0].start=1901,(d:EuropeData)=>d.entries[0].sourceIds=['missing'],(d:EuropeData)=>d.entries[0].population![0].min=-1,(d:EuropeData)=>d.entries[0].coordinates=[200,60]]){
  const d=fixture();change(d);assert.throws(()=>validateEuropeData(d));
 }
});
test('network endpoints remain schematic and do not become population estimates',()=>{
 const d=fixture();Object.assign(d.entries[0],{population:undefined,networkKind:'rail',destination:[25,60],category:'industry'});
 const [r]=normalizeEurope(validateEuropeData(d));assert.equal(r.overlay?.basis,'schematic');assert.equal(r.overlay?.networkKind,'rail');assert.equal(r.population,undefined);assert.equal(r.destination?.lon,25);
});
test('population interpolation is opt-in, labeled and bounded by comparable observations',()=>{
 const data=fixture(),entry=data.entries[0];entry.populationInterpolation={scope:'Same town boundary',note:'Unchanged census extent.'};
 const [record]=normalizeEurope(validateEuropeData(data));
 assert.equal(europePopulationView(record,entry,1850,false),record);
 assert.equal(europePopulationView(record,entry,1799,true),record);
 assert.equal(europePopulationView(record,entry,1900,true),record);
 const view=europePopulationView(record,entry,1850,true);
 assert.equal(view.population?.[0].min,550);assert.match(view.population![0].scope,/Interpolated/);
 assert.deepEqual(record.population?.map(p=>p.min),[100,1000]);
});
test('selection does not invent future evidence or continuous occupation after a dated occurrence',()=>{
 const d=fixture();d.entries[0].kind='occurrence';d.entries[0].start=d.entries[0].end=1800;delete d.entries[0].population;
 const records=normalizeEurope(validateEuropeData(d));
 assert.equal(europeSelection(records,1799,false).length,0);
 assert.equal(europeSelection(records,1800,false).length,1);
 assert.equal(europeSelection(records,1801,false).length,0);
 assert.equal(europeSelection(records,1801,true).length,1);
 assert.deepEqual(europeDates(d.entries),[1800,1801,1900]);
});
