import { test } from "node:test";
import assert from "node:assert/strict";
import data from "../data/evidence.json";
import { fixture } from "./fixtures";
import { validateRecord } from "../src/validation";
import { reviewHTML } from "../src/review";
import { makePackage, parsePackage } from "../src/proposals";
import { newProposal } from "../src/editor";
import { mapProjection } from "../src/map-projection";
import { tablesToPackage } from "../src/bulk-import";
import { BULK_HEADERS, OVERLAY_HEADERS } from "../src/bulk-schema";
import { importWorkbook } from "../src/xlsx-import";
import { createAppendix, renderAppendix } from "../scripts/appendix";
import * as XLSX from "xlsx";

const languageRecord = () => {
  const r: any = fixture();
  r.type = "event";
  r.overlay = {kind:"language",basis:"schematic",geometry:{type:"Point",coordinates:[170,10]},radiusKm:300,precision:"Illustrative area only",provenance:"Synthetic test geography"};
  r.linguistics = {languages:[{id:"a",name:"Earlier language",family:"Test family"},{id:"b",name:"Later language"}],claimId:r.claims[0].id,scope:"Reconstructed affiliation within the record dates",uncertainty:"Approximate distribution; no exclusive boundary",relationship:{kind:"descent",from:"a",to:"b"}};
  return r;
};
test("language metadata requires a sourced claim and valid distinct relationship endpoints", () => {
  const r = languageRecord();
  assert.deepEqual(validateRecord(r), []);
  r.linguistics.claimId = "missing";
  assert.match(validateRecord(r).join(" "), /linguistic.*claim/i);
  r.linguistics.claimId = r.claims[0].id;
  r.linguistics.relationship.to = "absent";
  assert.match(validateRecord(r).join(" "), /relationship/i);
  r.linguistics = null;
  assert.doesNotThrow(() => validateRecord(r));
  assert.match(validateRecord(r).join(" "), /linguistic/i);
});
test("malformed linguistic supporting claims return diagnostics rather than throwing", () => {
  for (const [field,value] of [["support",{}],["support",[null]],["sources",{}],["sources",[null]]] as const) {
    const r=languageRecord();
    if (field === "support") r.claims[0].support=value;
    else r.sources=value;
    assert.doesNotThrow(()=>validateRecord(r));
    assert.ok(validateRecord(r).length);
  }
});
test("language layers cannot silently become an unsupported distribution", () => {
  const r = languageRecord();
  delete r.linguistics;
  assert.match(validateRecord(r).join(" "), /linguistic/i);
  r.linguistics = languageRecord().linguistics;
  r.linguistics.languages[0].name = "<script>bad</script>";
  const html = reviewHTML(r, {records:[r]} as any);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Descent/);
  assert.match(html, /genetic ancestry/);
  assert.match(html, /data-claim=/);
});
test("language metadata survives sharing on site records without an overlay", () => {
  const r = languageRecord();
  delete r.overlay;
  const p = newProposal(r);
  const pack = makePackage([p]);
  assert.equal(pack.schemaVersion, 2);
  assert.deepEqual(parsePackage(JSON.stringify(pack)).proposals[0].record.linguistics, r.linguistics);
  assert.throws(() => parsePackage(JSON.stringify({...pack,schemaVersion:1})), /version 2/);
});
test("Pacific projection exposes island Asia, the dateline and Hawaii without clipping", () => {
  const p = mapProjection("pacific");
  for (const position of [[121,15],[145,15],[179,0],[-175,-14],[-155,20],[-110,35]]) {
    const xy = p(position as [number,number])!;
    assert.ok(xy[0] > 0 && xy[0] < 1000 && xy[1] > 0 && xy[1] < 800, String(position));
  }
  assert.ok(Math.abs(p([179,0])![0]-p([-179,0])![0])<10);
});
test("default combined frame centers 145W and crops Africa, Iceland and eastern Greenland", () => {
  const p = mapProjection();
  assert.ok(Math.abs(p([-145,15])![0] - 500) < .01);
  for (const position of [[101,15],[-31,15],[-70,-40],[-100,60]]) {
    const xy=p(position as [number,number])!;
    assert.ok(xy[0]>=0 && xy[0]<=1000, String(position));
  }
  for (const position of [[0,10],[-19,65],[-22,73]]) {
    const xy=p(position as [number,number])!;
    assert.ok(xy[0]<0 || xy[0]>1000, String(position));
  }
  assert.ok(Math.abs(mapProjection("americas")([-100,15])![0]-500)<.01);
});
const tables = (overlay: boolean) => {
  const r = languageRecord();
  const row: any = {record_id:r.id,operation:"new",record_type:"event",time_model:"interval",start_year:100,start_era:"CE",end_year:200,end_era:"CE",language_json:JSON.stringify(r.linguistics),proposal_state:"draft"};
  if (overlay) Object.assign(row,{overlay_type:"language",geometry_basis:"schematic",geometry_geojson:JSON.stringify(r.overlay.geometry),geometry_precision:r.overlay.precision,geometry_source:r.overlay.provenance,reach_radius_km:300});
  return {Evidence:overlay?[]:[row],Overlays:overlay?[row]:[],Claims:[],References:[],ClaimSources:[]};
};
test("ordinary and overlay workbook rows preserve language JSON and reject malformed values", async () => {
  for (const overlay of [false,true]) {
    const t = tables(overlay);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["format_version",2]]),"Readme");
    for (const [name,headers] of Object.entries({...BULK_HEADERS,Overlays:OVERLAY_HEADERS})) {
      const rows=(t as any)[name];
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([headers,...rows.map((r:any)=>headers.map(h=>r[h]??""))]),name);
    }
    const bytes = XLSX.write(wb,{type:"array",bookType:"xlsx"});
    const p = (await importWorkbook(bytes,[])).proposals[0];
    assert.deepEqual(p.record.linguistics, languageRecord().linguistics);
    assert.equal(p.record.overlay?.kind, overlay?"language":undefined);
    const row = (overlay?t.Overlays:t.Evidence)[0];
    row.language_json = "[";
    assert.throws(()=>tablesToPackage(t,[]), /language_json/);
    row.language_json = "[]";
    assert.throws(()=>tablesToPackage(t,[]), /linguistic/i);
  }
});
test("readable appendix includes language relationship, uncertainty and supporting claim", () => {
  const r=languageRecord();
  const a=createAppendix({...data,records:[r]} as any,{proposals:[]} as any,"test");
  const html=renderAppendix(a);
  assert.match(html,/Languages and relationships/);
  assert.match(html,/Earlier language/);
  assert.match(html,/Descent/);
  assert.match(html,/Approximate distribution/);
  assert.match(html,/record-test-site-episode-claim-occupation/);
});
