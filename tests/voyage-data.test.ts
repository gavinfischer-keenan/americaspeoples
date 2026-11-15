import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { EvidenceRecord, Source } from '../src/model';
import type { Voyage } from '../src/voyages';
import { validateItinerary, sampleVoyage, dateValue } from '../src/voyages';
import { validateRecord, safeURL } from '../src/validation';
import { validateCitation } from '../src/citations';

const read = (name: string) => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const catalog = read('voyages.json') as { voyages: Voyage[]; sources: Source[] };
const visits = read('voyage-expansion-records.json').records as EvidenceRecord[];
const transport = read('transport-expansion-records.json').records as EvidenceRecord[];
const network = read('rail-network.json') as {
  sources: Source[];
  segments: { id: string; name: string; start: number; end?: number; sourceId: string;
    geometry: { type: 'LineString' | 'MultiLineString'; coordinates: number[][] | number[][][] };
    precision: string; note: string }[];
  provenance: { sourceFeatures: number; displayGroups: number; meaning: string; license: string };
};

test('every expanded voyage and transport record has a complete, valid evidence review', () => {
  const ids = new Set<string>();
  for (const record of [...visits, ...transport]) {
    assert.ok(!ids.has(record.id), `duplicate record ${record.id}`);
    ids.add(record.id);
    assert.deepEqual(validateRecord(record), [], record.id);
  }
});

test('voyage catalog dates, sources and full-record links resolve', () => {
  assert.ok(catalog.voyages.length >= 10);
  const sources = new Map(catalog.sources.map(s => [s.id, s]));
  assert.equal(sources.size, catalog.sources.length);
  const records = new Map(visits.map(r => [r.id, r]));
  const ids = new Set<string>();
  for (const source of sources.values()) {
    assert.ok(safeURL(source.url), source.id);
    assert.deepEqual(validateCitation(source, true), [], source.id);
    for (const key of ['authors', 'title', 'venue', 'access'] as const) assert.ok(source[key].trim(), source.id);
  }
  for (const voyage of catalog.voyages) {
    assert.ok(!ids.has(voyage.id), voyage.id);
    ids.add(voyage.id);
    assert.deepEqual(validateItinerary(voyage.stops), [], voyage.id);
    assert.match(voyage.precision, /schematic/i);
    assert.ok(voyage.recordIds.length > 0, voyage.id);
    for (const id of voyage.sourceIds) assert.ok(sources.has(id), `${voyage.id}: missing source ${id}`);
    for (const id of voyage.recordIds) {
      const record = records.get(id);
      assert.ok(record, `${voyage.id}: missing full record ${id}`);
      assert.ok(record.sources.every(s => voyage.sourceIds.includes(s.id)), `${id}: source not available in its voyage`);
    }
  }
});

test('Beagle uses ship dates and holds through documented port stays', () => {
  const beagle = catalog.voyages.find(v => v.id === 'beagle-1831-1836')!;
  assert.equal(beagle.stops[0].departure, '1831-12-27');
  assert.equal(beagle.stops.at(-1)!.arrival, '1836-10-02');
  assert.ok(beagle.stops.every(s => s.mode === 'sea'));
  assert.ok(!beagle.stops.some(s => /Mendoza|Santa Fe|Buenos Aires inland/i.test(s.name)));
  const sydney = beagle.stops.find(s => s.name === 'Sydney Cove')!;
  assert.deepEqual(sampleVoyage(beagle.stops, dateValue('1836-01-20'))?.coordinates, sydney.coordinates);
  assert.equal(sampleVoyage(beagle.stops, dateValue('1836-01-20'))?.status, 'stopped');
  assert.equal(beagle.stops.find(s => /Culpepper/.test(s.name))!.departure, '1835-10-20');
  assert.match(beagle.summary, /not Darwin/);
});

test('leadership changes and mixed travel are explicit, not invented complete tracks', () => {
  const magellan = catalog.voyages.find(v => v.id === 'magellan-elcano-1519-1522')!;
  assert.match(magellan.summary, /Magellan died.*27 April 1521/);
  const death = magellan.stops.findIndex(s => s.arrival === '1521-04-27');
  assert.ok(death >= 0 && death < magellan.stops.length - 1);
  assert.match(magellan.stops.at(-1)!.note, /Elcano/);
  const lc = catalog.voyages.find(v => v.id === 'lewis-clark-pacific-1804-1806')!;
  assert.deepEqual(new Set(lc.stops.map(s => s.mode)), new Set(['river', 'land']));
  assert.equal(lc.stops.find(s => s.name === 'Camp Fortunate')!.mode, 'land');
  assert.equal(lc.stops.find(s => /Canoe Camp/.test(s.name))!.mode, 'river');
  assert.match(lc.summary, /split return routes/);
  assert.ok(lc.recordIds.includes('visit-lewis-clark-return-1806'));
  const cabrillo = catalog.voyages.find(v => v.id === 'cabrillo-ferrelo-1542-1543')!;
  assert.match(cabrillo.stops.at(-1)!.note, /under Ferrelo/);
});

test('Norse and Balboa evidence does not manufacture exact departure dates', () => {
  const norse = visits.find(r => r.id === 'visit-norse-lanse-aux-meadows-1021')!;
  assert.equal(norse.time.start, 1021);
  assert.equal(norse.time.end, 1021);
  assert.match(norse.claims[0].text, /wood samples.*1021/);
  assert.match(norse.review.summary, /does not date the first arrival/);
  const balboa = visits.find(r => r.id === 'visit-balboa-pacific-1513')!;
  assert.equal(balboa.time.start, 1513);
  assert.match(balboa.claims[0].text, /overland/);
  assert.ok(!catalog.voyages.some(v => /norse|balboa/i.test(v.id)));
});

test('transport distinguishes dated infrastructure from an evidenced service interval', () => {
  const pony = transport.find(r => r.id === 'post-pony-express-1860-1861')!;
  assert.deepEqual([pony.time.start, pony.time.end], [1860, 1861]);
  assert.match(pony.claims[0].text, /26 October 1861.*November/);
  const copper = transport.find(r => r.id === 'rail-copper-river-1911-1934')!;
  assert.equal(copper.time.end, 1934);
  assert.match(copper.claims[0].text, /1938/);
  assert.match(copper.review.summary, /did not close in that year/);
  for (const record of transport) {
    if (![pony.id, copper.id].includes(record.id)) {
      assert.equal(record.time.kind, 'occurrence', record.id);
      assert.equal(record.time.start, record.time.end, record.id);
    }
    assert.equal(record.overlay!.basis, 'schematic');
    assert.equal(record.overlay!.geometry!.type, 'LineString');
    assert.equal((record.overlay!.geometry as { coordinates: number[][] }).coordinates.length, 2);
  }
  assert.ok(transport.some(r => /Havana/.test(r.title)));
  assert.ok(transport.some(r => /Jamaica/.test(r.title)));
  assert.ok(transport.some(r => /Durán/.test(r.title)));
  assert.ok(transport.some(r => /Oʻahu/.test(r.title)));
  assert.ok(transport.some(r => /Alaska Railroad/.test(r.title)));
});

test('historical rail network retains its source chronology without inventing closure or operation', () => {
  const sources = new Set(network.sources.map(s => s.id));
  assert.equal(network.provenance.displayGroups, network.segments.length);
  assert.ok(network.provenance.sourceFeatures > 70_000);
  assert.ok(network.segments.length > 1_000);
  assert.match(network.provenance.license, /acknowledgment/);
  assert.match(network.provenance.meaning, /No service end or continuous operation/);
  const ids = new Set<string>();
  for (const segment of network.segments) {
    assert.ok(!ids.has(segment.id), segment.id);
    ids.add(segment.id);
    assert.ok(sources.has(segment.sourceId), segment.id);
    assert.ok(Number.isInteger(segment.start) && segment.start >= 1826 && segment.start <= 1934);
    assert.equal(segment.end, undefined);
    assert.match(segment.note, /ExactDate=|InOpBy=/);
    assert.match(segment.precision, /simplified at 250 metres/);
    const lines = segment.geometry.type === 'LineString'
      ? [segment.geometry.coordinates as number[][]] : segment.geometry.coordinates as number[][][];
    for (const line of lines) {
      assert.ok(line.length >= 2, segment.id);
      for (const xy of line) assert.ok(xy.length === 2 && xy.every(Number.isFinite) && Math.abs(xy[0]) <= 180 && Math.abs(xy[1]) <= 90, segment.id);
    }
  }
});
