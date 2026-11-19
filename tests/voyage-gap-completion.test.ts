import test from 'node:test';
import assert from 'node:assert/strict';
import raw from '../data/voyages.json';
import records from '../data/voyage-expansion-records.json';
import inventory from '../data/voyage-coverage-inventory.json';
import {sampleVoyage, dateValue, validateItinerary, type Voyage} from '../src/voyages';
import {activeExpeditions, activityDuring} from '../src/expedition-context';
import activity from '../data/expedition-activity.json';

const voyages = raw.voyages as Voyage[];

test('remaining major American and polar expedition families have dated map journeys', () => {
  for (const family of ['galiano', 'narvaez', 'coronado', 'roberval', 'mcclure', 'sverdrup', 'maud', 'gauss', 'charcot', 'filchner', 'clerke', 'ellsworth']) {
    assert.ok(voyages.some(v => v.id.includes(family)), `${family} needs a sourced map journey`);
  }
});

test('new voyage points resolve to dated evidence and catalog sources', () => {
  const sources = new Set(raw.sources.map(s => s.id));
  const evidence = new Map(records.records.map(r => [r.id, r]));
  const additions = voyages.filter(v => v.sourceIds.some(id => id.startsWith('gap-')));
  assert.ok(additions.length > 0, 'source-reviewed voyage additions are present');
  for (const v of additions) {
    assert.deepEqual(validateItinerary(v.stops), [], v.id);
    for (const s of v.stops) {
      assert.ok(s.recordId && evidence.has(s.recordId), `${v.id}: ${s.name} evidence`);
      for (const id of s.sourceIds ?? v.sourceIds) assert.ok(sources.has(id), id);
    }
  }
});

test('Cook expedition continues under Clerke and Gore after Cook died', () => {
  const continuation = voyages.filter(v => /clerke|gore/.test(v.id));
  assert.ok(continuation.some(v => sampleVoyage(v.stops, dateValue('1779-07-18'))), 'Arctic return');
  assert.ok(continuation.some(v => sampleVoyage(v.stops, dateValue('1780-10-04'))), 'return to the Nore');
});

test('every earlier coverage question has a fresh documented disposition', () => {
  assert.ok(inventory.entries.length >= 35);
  for (const entry of inventory.entries) {
    assert.ok(Array.isArray((entry as any).remainingQuestions), `${entry.id}: explicit residual questions`);
    for (const id of (entry as any).mappedVoyageIds ?? []) assert.ok(voyages.some(v => v.id === id), `${entry.id}: ${id}`);
    for (const id of (entry as any).mappedRecordIds ?? []) assert.ok(records.records.some(r => r.id === id), `${entry.id}: ${id}`);
  }
});

test('the archive retains simultaneous Arctic parties after the shared map cutoff', () => {
  const date=dateValue('1920-01-15');
  const precise=activeExpeditions(voyages,date,()=>false);
  const ship=voyages.find(v=>v.id==='maud-northeast-passage-1918-1920')!;
  assert.ok(sampleVoyage(ship.stops,date)?.coordinates);
  const party=activity.activities.find(a=>a.id==='maud-ay-on-chukchi-travel')!;
  assert.deepEqual([party.start,party.end],['1919','1920']);
  assert.deepEqual(precise,[]);
  assert.deepEqual(activityDuring(activity.activities,date,precise),[]);
});

test('disputed pole and undated wreck evidence does not become an exact itinerary position', () => {
  for (const v of voyages.filter(v => /peary|cook-pole|laperouse/.test(v.id))) {
    assert.ok(v.stops.every(s => Math.abs(s.coordinates[1]) < 90));
    assert.ok(v.stops.every(s => !/Vanikoro/i.test(s.name)));
  }
});

test('a shipwreck journey does not turn its ordinary port observations into historical losses', () => {
  const ship=voyages.find(v=>v.id==='nordenskjold-antarctic-shipwreck-1902-1903');
  assert.ok(ship);
  const dropoff=ship.stops.find(s=>s.arrival==='1902-12-29');
  const loss=ship.stops.find(s=>s.arrival==='1903-02-12');
  assert.equal(records.records.find(r=>r.id===dropoff?.recordId)?.history?.kind,'visit');
  assert.equal(records.records.find(r=>r.id===loss?.recordId)?.history?.kind,'wreck');
});

test('separate BANZARE field seasons and flights do not imply continuous activity', () => {
  const banzare=voyages.filter(v=>v.id.includes('banzare'));
  assert.ok(banzare.length>0);
  assert.ok(!banzare.some(v=>sampleVoyage(v.stops,dateValue('1930-07-01'))));
  assert.ok(!activeExpeditions(voyages,dateValue('1930-01-02'),()=>false).some(v=>v.id.includes('banzare-air')));
  const precise=activeExpeditions(voyages,dateValue('1931-02-11'),()=>false);
  const independent=activityDuring(activity.activities,dateValue('1931-02-11'),precise);
  const flight=activity.activities.find(a=>a.id==='banzare-air-reconnaissance-1931')!;
  assert.deepEqual([flight.start,flight.end],['1931-01','1931-02']);
  assert.deepEqual(independent,[]);
});
