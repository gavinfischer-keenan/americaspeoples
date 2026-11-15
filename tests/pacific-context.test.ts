import test from "node:test";
import assert from "node:assert/strict";
import { dataset } from "../src/published-data";
import { historyState } from "../src/history";
const record = (id: string) => {
  const r = dataset.records.find((r) => r.id === id);
  assert.ok(r, id);
  return r;
};
test("Hawaiʻi has a qualified arrival connection and dated interisland and overseas exchange", () => {
  const arrival = record("context-hawaii-arrival");
  assert.equal(historyState(arrival, 1050), "active");
  assert.equal(historyState(arrival, 1500), "outside");
  const adze = record("context-hawaii-maui-adzes");
  assert.equal(historyState(adze, 1700), "active");
  assert.equal(adze.history?.connection?.cessation, "unknown");
  for (const id of [
    "context-hawaii-china",
    "context-hawaii-columbia",
    "context-hawaii-whaling",
  ])
    assert.equal(historyState(record(id), 1828), "active", id);
  const undated = record("tuamotu-collerson2007-adze-connection");
  assert.equal(undated.time.kind, "unplaced");
});
test("early island evidence precedes Lapita without inventing unbroken occupation or canoe tracks", () => {
  const mololo = record("context-mololo-early");
  assert.ok(mololo.time.start! < -48000);
  assert.ok(Math.abs(mololo.location!.lat + 0.305833) < 0.00001);
  const route = record("context-raja-ampat-crossings");
  assert.equal(route.overlay?.basis, "schematic");
  assert.match(route.review.limitations, /simulation|model/i);
  const laili = record("context-laili-early");
  assert.match(laili.time.interpretation, /onset|initial/i);
  assert.ok(laili.time.end! < -40000);
});
test("Beagle-era Brazil contains contemporary conflict and existing cities", () => {
  for (const id of [
    "context-cabanagem",
    "context-farroupilha",
    "context-males-revolt",
  ])
    assert.equal(historyState(record(id), 1835), "active");
  assert.notEqual(
    historyState(record("history-salvador-colonial"), 1832),
    "outside",
  );
  assert.notEqual(
    historyState(record("history-rio-colonial"), 1832),
    "outside",
  );
});
test("Hawaiian local conflicts keep named actors, geography and uncertain dates separate", () => {
  const puna = record("hawaii-local-puna-rebellion");
  assert.equal(puna.time.kind, "occurrence");
  assert.equal(puna.time.start, 1780);
  assert.equal(puna.time.end, 1781);
  assert.match(puna.review.summary, /Kalaniʻōpuʻu/);
  assert.equal(puna.overlay!.basis, "schematic");
  const temple = record("hawaii-local-puukohola");
  assert.equal(temple.history!.kind, "settlement");
  assert.equal(temple.location!.lat, 20.027588);
  for (const id of ["kauiki", "kepaniwai", "waipio-sea-battle", "nuuanu"])
    assert.ok(record("hawaii-local-" + id).overlay?.geometry);
  assert.match(
    record("hawaii-local-keoua-killed").review.limitations,
    /differ/,
  );
});
