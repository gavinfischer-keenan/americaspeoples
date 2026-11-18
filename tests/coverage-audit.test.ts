import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import {dataset} from '../src/published-data';
import {topicOnlyIds} from '../src/topic-dives';

test('coverage export follows the canonical master map, including nonstandard collection filenames',()=>{
 const result=spawnSync(process.execPath,['--import','tsx','scripts/export-coverage-records.ts'],{encoding:'utf8',maxBuffer:50*1024*1024});
 assert.equal(result.status,0,result.stderr);
 const exported=JSON.parse(result.stdout);
 assert.deepEqual(exported.records.map((r:any)=>r.id),dataset.records.filter(r=>!topicOnlyIds.has(r.id)).map(r=>r.id));
 assert.ok(exported.records.some((r:any)=>r.id==='al-amaknak-s7-west-charcoal'));
 assert.ok(!exported.records.some((r:any)=>topicOnlyIds.has(r.id)));
 assert.equal(exported.version,dataset.version);
});

test('published detailed audit includes every shared map record',()=>{
 const audit=JSON.parse(readFileSync('data/coverage-audit.json','utf8'));
 const shared=dataset.records.filter(r=>!topicOnlyIds.has(r.id));
 assert.equal(audit.version,dataset.version);
 assert.equal(audit.recordCount,shared.length);
 assert.deepEqual(audit.recordIds,shared.map(r=>r.id));
 const represented=new Set([...audit.unallocatedRecordIds,...audit.matrix.flatMap((r:any)=>[...r.unresolvedIds,...r.periods.flatMap((p:any)=>[...p.localRecordIds,...p.contextRecordIds])])]);
 assert.ok(represented.has('al-amaknak-s7-west-charcoal'));
 assert.ok([...represented].every(id=>shared.some(r=>r.id===id)));
});

test("coverage audit counts distinct dated places, separates context and uses current intake", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-coverage-"));
  const write = (name: string, value: unknown) => writeFileSync(join(root, name), JSON.stringify(value));
  const place = (id: string) => ({ id, name: id, lon: -118, lat: 40 });
  const record = (id: string, type = "occupation", location: any = place("site-a")): any => ({
    id, title: id, type, location, time: { kind: "interval", start: 700, end: 800, original: "700–800 CE" },
    claims: [{ id: "claim", support: [{ sourceId: "original", stance: "supports" }] }],
    sources: [{ id: "original" }], review: { reviewedAt: "2026-10-29", limitations: "Fixture dating limit" },
  });
  try {
    mkdirSync(join(root, "data")); mkdirSync(join(root, "docs"));
    const first = record("phase-one");
    // Population dates must overlap the cell, independently of the record dates.
    first.population = [{ start: 1100, end: 1200, min: 10, max: 20, claimId: "claim" }];
    const second = record("phase-two", "event");
    second.population = [{ start: 700, end: 800, min: 5, max: 10, claimId: "claim" }];
    const context = record("model", "event", null);
    context.overlay = { geometry: { type: "Point", coordinates: [-118, 40] } };
    context.linguistics = { claimId: "claim", languages: [{ name: "Explicit source context" }] };
    const undated = record("undated", "occupation", place("site-undated"));
    undated.time = { kind: "unplaced", start: null, end: null, original: "Dates unresolved" };
    const route = record("route", "event", null);
    route.overlay = { geometry: { type: "LineString", coordinates: [[-119, 40], [-117, 40]] } };
    const montanaOne = record("montana-one", "occupation", { ...place("montana-a"), lon: -114, lat: 47 });
    const montanaTwo = record("montana-two", "occupation", { ...place("montana-b"), lon: -114, lat: 47 });
    const aleutianWest = record("aleutian-west", "occupation", { ...place("aleutian-west"), lon: 178, lat: 52 });
    const aleutianEast = record("aleutian-east", "occupation", { ...place("aleutian-east"), lon: -177, lat: 52 });
    const neighboringMontana = record('montana-inside-idaho-rectangle', 'occupation', {...place('camp-fortunate'), lon:-112.86,lat:44.99});
    const fijiWest = record('fiji-west', 'occupation', {...place('fiji-west'),lon:178,lat:-18});
    const fijiEast = record('fiji-east', 'occupation', {...place('fiji-east'),lon:-178,lat:-18});
    write('data/historical-boundaries.json', JSON.parse(readFileSync('data/historical-boundaries.json','utf8')));
    const separated = record("separate-date-windows", "occurrence", { ...place("separate-place"), lon: -40, lat: -12 });
    separated.time = { kind: "occurrence", start: 400, end: 1100, original: "Two supported windows" };
    separated.history = { kind: "attestation", windows: [{ start: 400, end: 490 }, { start: 1010, end: 1100 }] };
    write("data/evidence.json", { records: [first, context, undated, route, montanaOne, montanaTwo, aleutianWest, aleutianEast, separated, neighboringMontana, fijiWest, fijiEast] });
    write("data/research-proposals.json", { proposals: [{ record: first }, { record: second }] });
    write("data/new-expansion-records.json", {records:[record('new-expansion','event',{...place('new'),lon:0,lat:0})]});
    write("data/history-records.json", {records:[record('new-history','event',{...place('hist'),lon:0,lat:0})]});
    write("data/remaining-topic-evidence-records.json", {records:[record('focused-only')]});
    write("data/temporal-review-2026-10-29.json", {
      items: [{ id: first.id, originalTime: { kind: "unplaced" }, time: first.time }], splitRecords: ["split-phase"],
    });
    write("data/round8-synthesis.json", { batch: "round8", decisions: [{ candidateId: "stale", disposition: "held-source-check" }] });
    write("data/round9-synthesis.json", { batch: "round9", decisions: [
      { candidateId: "untested", disposition: "held-source-check", candidateFinding: "Verify original local chronology" },
      { candidateId: "done", disposition: "integrated" },
    ] });
    writeFileSync(join(root, "docs/round9-synthesis.html"), "Round9 fixture");
    write("data/intake-queue-round10.json", { batch: "round10-batch1", status: "received-not-integrated", items: [{ id: "idaho", title: "Northern Idaho", coverageAssessment: "Early Holocene site leads received; dates need verification." }] });
    const bundled = join(homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe");
    const python = process.env.PYTHON ?? (existsSync(bundled) ? bundled : process.platform === "win32" ? "python" : "python3");
    const result = spawnSync(python, [resolve("scripts/coverage-audit.py"), "--root", root], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const audit = JSON.parse(readFileSync(join(root, "data/coverage-audit.json"), "utf8"));
    assert.equal(audit.recordCount, 15, "shared expansions and history count; duplicates and focused material do not");
    const idaho = audit.matrix.find((r:any)=>r.region==='Idaho — southern / central');
    assert.ok(idaho.periods.every((p:any)=>!p.localRecordIds.includes(neighboringMontana.id)), 'Montana cannot fill Idaho merely because its point lies inside the search rectangle');
    assert.equal(audit.regionalRanking.find((r:any)=>r.region==='Fiji / Tonga / Samoa').localityCount, 2, 'dateline halves rank as one island region');
    assert.ok(!audit.regionalRanking.some((r:any)=>r.region==='Japan / Ryukyus'), 'mainland origins are outside detailed coverage scope');
    const eastern = audit.matrix.find((r: any) => r.region === 'Eastern Brazil');
    assert.equal(eastern.periods.find((p: any) => p.period === '501–1000CE').localityCount, 0, 'unsupported gaps cannot fill a coverage cell');
    assert.equal(eastern.periods.find((p: any) => p.period === '1001–1500CE').localityCount, 1);
    assert.equal(audit.broadRegionCount, 48); assert.equal(audit.regionCount, 65); assert.equal(audit.periodCount, 12);
    assert.ok(audit.matrix.some((r: any) => r.region === "Gran Chaco"), "interior gaps need an explicit audit region");
    for (const [name, expected] of [["Aleutians — west of dateline", "aleutian-west"], ["Aleutians — east of dateline", "aleutian-east"]]) {
      const row = audit.matrix.find((r: any) => r.region === name);
      const dated = row.periods.find((p: any) => p.period === "501–1000CE");
      assert.deepEqual(dated.localRecordIds, [expected]);
    }
    assert.ok(audit.matrix.some((r: any) => r.region === "Idaho — northern river corridors"));
    assert.ok(audit.matrix.some((r: any) => r.region === "Kiribati — Line Islands"));
    const region = audit.matrix.find((r: any) => r.region === "Nevada — northwestern basins");
    const cell = region.periods.find((c: any) => c.period === "501–1000CE");
    assert.equal(cell.localityCount, 1, "two phases at one location are one locality");
    assert.equal(cell.localRecordCount, 2, "named local events retain locality coverage");
    assert.deepEqual(cell.contextRecordIds, ["model"]);
    assert.equal(cell.populationKnownLocalityCount, 1);
    assert.deepEqual(cell.populationKnownRecordIds, ["phase-two"]);
    assert.equal(cell.languageSourceCount, 1);
    assert.deepEqual(region.unresolvedIds, ["undated"]);
    assert.deepEqual(region.unresolvedLocalityIds, ["site-undated"]);
    assert.deepEqual(audit.unallocatedRecordIds, ["route"]);
    assert.equal(audit.formerlyUnplaced, 1); assert.equal(audit.recoveredWindows, 1); assert.equal(audit.splitWindows, 1);
    assert.equal(audit.pendingIntake.source, "round9-synthesis.json");
    assert.deepEqual(audit.intakeItems.map((i: any) => i.id), ["untested"]);
    assert.equal(audit.incomingResearch.batch, "round10-batch1");
    assert.equal(audit.incomingResearch.items[0].id, "idaho");
    assert.equal(audit.recordCount, 15, "incoming research must not inflate integrated evidence");
    assert.ok(audit.gapCells.some((g: any) => g.localityCount === 0 && g.classification === "no-included-dated-localities"));
    assert.ok(audit.gapCells.some((g: any) => g.localityCount === 1 && g.classification === "one-included-dated-locality"));
    assert.equal(audit.matrix.find((r:any)=>r.region==='Montana — western mountains').periods.find((p:any)=>p.period==='501–1000CE').localityCount,3, 'neighboring Montana record belongs with the two Montana localities');
    assert.ok(audit.nextRoundPriorities.every((g: any) => g.priorityEligible && g.end > -15000 && g.suggestedConsensusQuery.includes(g.region)));
    assert.ok(audit.gapCells.filter((g: any) => g.region === "Hawaii" && g.end <= 0).every((g: any) => !g.priorityEligible));
    const page = readFileSync(join(root, "docs/coverage-audit.html"), "utf8");
    assert.ok(page.includes("round8-synthesis.html")); assert.ok(page.includes("round9-synthesis.html"));
    assert.ok(page.includes("not evidence that no people lived there"));
    assert.ok(page.includes("Next-round priorities"));
    assert.ok(page.includes("Research received for the next deploy"));
    assert.ok(page.includes("Early Holocene site leads received; dates need verification."));
    // A missing latest synthesis must fall back to the most recent available review.
    rmSync(join(root, "data/round9-synthesis.json"));
    rmSync(join(root, "docs/round9-synthesis.html"));
    const fallback = spawnSync(python, [resolve("scripts/coverage-audit.py"), "--root", root], { encoding: "utf8" });
    assert.equal(fallback.status, 0, fallback.stderr);
    const prior = JSON.parse(readFileSync(join(root, "data/coverage-audit.json"), "utf8"));
    assert.equal(prior.pendingIntake.source, "round8-synthesis.json");
    assert.deepEqual(prior.intakeItems.map((i: any) => i.id), ["stale"]);
    assert.ok(!readFileSync(join(root, "docs/coverage-audit.html"), "utf8").includes("round9-synthesis.html"));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
