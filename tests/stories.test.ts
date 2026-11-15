import test from "node:test";
import assert from "node:assert/strict";
import { dataset } from "../src/published-data";
import { stories } from "../src/stories";
import { historyState } from "../src/history";
import { END_YEAR } from "../src/time";

const records = new Map(dataset.records.map(record => [record.id, record]));

test("journeys can resolve source-linked evidence without inventing record IDs or reversing chronology", () => {
  assert.ok(stories.length >= 7);
  assert.equal(new Set(stories.map(story => story.id)).size, stories.length);
  for (const story of stories) {
    assert.ok(story.scenes.length >= 3, story.id);
    assert.equal(new Set(story.scenes.map(scene => scene.id)).size, story.scenes.length, story.id);
    let previous = -Infinity;
    for (const scene of story.scenes) {
      assert.ok(Number.isSafeInteger(scene.year) && scene.year >= previous && scene.year <= END_YEAR, scene.id);
      previous = scene.year;
      assert.ok(scene.body.trim() && scene.note.trim() && scene.recordIds.length, scene.id);
      assert.ok(scene.center[0] >= -180 && scene.center[0] <= 180 && scene.center[1] >= -90 && scene.center[1] <= 90, scene.id);
      assert.ok(scene.zoom >= 1 && scene.zoom <= 12, scene.id);
      assert.ok(scene.recordIds.some(id => {
        const record = records.get(id);
        return record && historyState(record, scene.year) !== "outside";
      }), `${scene.id}: the scene has no evidence visible at its viewing year`);
      for (const id of scene.recordIds) {
        const record = records.get(id);
        assert.ok(record, `${scene.id}: missing ${id}`);
        assert.ok(record.claims.some(claim => claim.support.some(support =>
          support.stance === "supports" && record.sources.some(source => source.id === support.sourceId),
        )), `${scene.id}: ${id} lacks a sourced supporting claim`);
      }
    }
  }
});

test("arrival scenes land inside the particular founding evidence they discuss", () => {
  const story = stories.find(story => story.id === "pacific-arrivals")!;
  const frames = [
    ["beyond-near-oceania", "history-lapita-bismarcks-vanuatu"],
    ["toward-fiji", "history-lapita-vanuatu-fiji"],
    ["tonga-and-samoa", "history-lapita-fiji-tonga"],
    ["tonga-and-samoa", "history-lapita-fiji-samoa"],
    ["within-tonga", "r6-haapai-onset"],
    ["within-tonga", "r6-vavau-onset"],
    ["east-polynesian-founding", "history-west-east-polynesia-migration"],
    ["rapa-nui-arrival", "history-central-polynesia-rapanui"],
  ];
  for (const [sceneId, recordId] of frames) {
    const scene = story.scenes.find(scene => scene.id === sceneId)!;
    assert.ok(scene.recordIds.includes(recordId));
    assert.equal(historyState(records.get(recordId)!, scene.year), "active", `${sceneId}: ${recordId}`);
  }
});

test("exchange scenes show different regional endings and later Samoan evidence", () => {
  const story = stories.find(story => story.id === "pacific-exchange")!;
  const decline = story.scenes.find(scene => scene.id === "regional-decline")!;
  assert.equal(historyState(records.get("history-mangareva-pitcairn-henderson")!, decline.year), "outside");
  assert.equal(historyState(records.get("history-rurutu-mangaia-exchange")!, decline.year), "active");
  const later = story.scenes.find(scene => scene.id === "later-samoan-links")!;
  assert.equal(historyState(records.get("history-samoa-mangaia-exchange")!, later.year), "active");
  assert.equal(historyState(records.get("history-samoa-tonga-exchange")!, later.year), "active");
  const last = story.scenes.at(-1)!;
  assert.equal(historyState(records.get("history-samoa-mangaia-exchange")!, last.year), "outside");
  assert.equal(historyState(records.get("history-tonga-regional-occupation")!, last.year), "active");
});

test("colonial shipping ends as a system while the established places remain visible", () => {
  const story = stories.find(story => story.id === "connected-oceans")!;
  const crossing = story.scenes.find(scene => scene.id === "two-pacific-directions")!;
  for (const id of ["history-manila-acapulco-eastbound", "history-acapulco-manila-westbound"]) {
    assert.ok(crossing.recordIds.includes(id));
    assert.equal(historyState(records.get(id)!, crossing.year), "active");
    assert.equal(historyState(records.get(id)!, story.scenes.at(-1)!.year), "outside");
  }
  assert.equal(historyState(records.get("history-havana-current-site")!, story.scenes.at(-1)!.year), "founded");
});

test("founding-route endings are followed by positive regional habitation evidence", () => {
  const story = stories.find(story => story.id === "pacific-arrivals")!;
  const last = story.scenes.at(-1)!;
  assert.equal(historyState(records.get("history-central-polynesia-rapanui")!, last.year), "outside");
  assert.equal(historyState(records.get("history-rapa-nui-regional-occupation")!, last.year), "active");
  assert.ok(last.recordIds.includes("history-rapa-nui-regional-occupation"));
});
