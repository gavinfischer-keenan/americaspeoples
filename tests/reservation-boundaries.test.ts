import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { geoArea } from 'd3-geo';
import { boundariesAt, validateBoundaries, type PoliticalBoundary, type BoundarySource } from '../src/boundaries';

const rows = JSON.parse(readFileSync(new URL('../data/reservation-boundaries.json', import.meta.url), 'utf8')) as PoliticalBoundary[];
const sources = JSON.parse(readFileSync(new URL('../data/reservation-boundary-sources.json', import.meta.url), 'utf8')) as BoundarySource[];

test('historical reservation versions have complete, attributed geometry', () => {
  assert.equal(rows.length, 4);
  const sourceIds = new Set(sources.map(s => s.id));
  assert.equal(sourceIds.size, sources.length);
  assert.deepEqual(validateBoundaries(rows, sourceIds), []);
  for (const row of rows) {
    assert.equal(row.kind, 'reservation');
    assert.ok(row.precision.length > 100);
    const area = geoArea(row.geometry as any);
    assert.ok(area > 0 && area < 0.01, `${row.id}: small footprint, not inverted globe`);
  }
  for (const source of sources) {
    assert.match(source.url, /^https:\/\//);
    assert.match(source.license, /public domain/);
  }
});

test('Navajo outline changes use separate versions without an invented 1934 continuation', () => {
  const nav = rows.filter(r => r.id.startsWith('reservation-navajo-'));
  assert.deepEqual(nav.map(r => r.start), ['1868-08-12', '1878-10-29', '1880-01-06']);
  assert.deepEqual(nav.map(r => r.end), ['1878-10-28', '1880-01-05', '1884-05-16']);
  assert.equal(boundariesAt(nav, 1867).length, 0);
  assert.equal(boundariesAt(nav, 1868)[0].id, 'reservation-navajo-1868');
  assert.equal(boundariesAt(nav, 1878)[0].id, 'reservation-navajo-1878');
  assert.equal(boundariesAt(nav, 1880)[0].id, 'reservation-navajo-1880');
  assert.equal(boundariesAt(nav, 1884).length, 0, 'later geometry is not reconstructed');
  assert.equal(boundariesAt(nav, 1934).length, 0);
  const areas = nav.map(r => geoArea(r.geometry as any));
  assert.ok(areas[0] < areas[1] && areas[1] < areas[2]);
  assert.match(nav[0].note, /proclamation.*physical return/);
  assert.match(nav[0].precision, /Canyon de Chelly outlet/);
  assert.ok(Math.min(...nav[0].geometry.coordinates[0].map((p: number[]) => p[0])) < -109.5);
  assert.match(nav[2].note, /not be read as reservation abolition/);
});

test('Hopi 1882 coordinates and qualified shared use persist to the supported atlas cutoff', () => {
  const hopi = rows.find(r => r.id === 'reservation-hopi-order-1882')!;
  const points = hopi.geometry.coordinates[0] as [number, number][];
  assert.deepEqual([Math.min(...points.map(p => p[0])), Math.max(...points.map(p => p[0]))], [-111, -110]);
  assert.deepEqual([Math.min(...points.map(p => p[1])), Math.max(...points.map(p => p[1]))], [35.5, 36.5]);
  assert.equal(hopi.start, '1882-12-16');
  assert.equal(hopi.end, '1934-12-31');
  assert.match(hopi.note, /other Indians/);
  assert.match(hopi.note, /not an exclusive ethnic occupancy map/);
  assert.match(hopi.note, /atlas cutoff, not termination/);
  assert.ok(hopi.sourceIds.includes('reservation-navajo-act-1934'));
  assert.equal(boundariesAt([hopi], 1881).length, 0);
  assert.equal(boundariesAt([hopi], 1882).length, 1);
  assert.equal(boundariesAt([hopi], 1934).length, 1);
});
