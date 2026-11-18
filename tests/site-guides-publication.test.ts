import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { researchStatusHTML } from "../scripts/site-guide-build";

test("research source pages contain status and source links without raw report rendering", () => {
  const html = researchStatusHTML({id:"example",title:"Example review",url:"https://consensus.app/search/example/id/",publication:"private-source-links-only"});
  assert.match(html, /retained privately/);
  assert.match(html, /https:\/\/consensus.app\/search\/example\/id\//);
  assert.doesNotMatch(html, /download|research-body|Read the complete|<script/i);
  assert.throws(() => researchStatusHTML({id:"bad",title:"Bad",url:"javascript:alert(1)",publication:"private-source-links-only"}), /Unsafe research source/);
  assert.throws(() => researchStatusHTML({id:"bad",title:"Bad",url:"https://consensus.app/",publication:"public-raw"} as any), /private source status/);
});

test('direct original-source reviews identify their method without inventing a provider report',()=>{
 const html=researchStatusHTML({id:'direct',title:'Regional review',url:'https://americaspeoples.11mosswood.us/docs/coverage-15-review.html',publication:'original-source-review'} as any);
 assert.match(html,/original publications and institutional records/);
 assert.match(html,/retained privately/);
 assert.doesNotMatch(html,/Consensus|third-party research response/);
});

test("research catalog and historical intake paths expose notices instead of raw exports", async () => {
  const catalog = JSON.parse(await readFile("data/site-research-reviews.json","utf8"));
  for (const review of catalog.reviews) {
    assert.ok(['private-source-links-only','original-source-review'].includes(review.publication));
    assert.equal(review.file, undefined);
    const md = await readFile("sites/reports/" + review.id + ".md","utf8");
    assert.ok(md.length < 1500);
    assert.match(md, /retained privately/);
    assert.doesNotMatch(md, /\[\[\d+\.\d+\]\]/);
    const page = await readFile("sites/reports/" + review.id + ".html","utf8");
    assert.match(page, /retained privately/);
    assert.doesNotMatch(page, /download|research-body|consensus\.app\/papers\//i);
  }
  const manifest = JSON.parse(await readFile("docs/intake/manifest.json","utf8"));
  assert.equal(manifest.publication, "private-source-links-only");
  for (const entry of manifest.batches) {
    const notice = await readFile("docs/intake/" + entry.filename);
    assert.equal(createHash("sha256").update(notice).digest("hex"), entry.sha256, entry.filename);
    assert.notEqual(entry.sha256, entry.privateArchiveSha256, entry.filename);
  }
  for (const filename of await readdir("docs/intake")) {
    if (!filename.endsWith(".txt")) continue;
    const text = await readFile("docs/intake/" + filename,"utf8");
    assert.ok(text.length < 2000, filename);
    assert.match(text, /retained privately/, filename);
    assert.doesNotMatch(text, /\[\[\d+\.\d+\]\]/, filename);
  }
});
