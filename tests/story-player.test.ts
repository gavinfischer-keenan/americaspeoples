import test from "node:test";
import assert from "node:assert/strict";
import type { Story } from "../src/stories";
import { sampleStory, sceneHoldMs, sceneStartMs, storyDurationMs, storyElapsedAtYear } from "../src/story-player";

const story: Story = {
  id: "timing", title: "Timing", subtitle: "", description: "",
  scenes: [100, 200].map((year, index) => ({
    id: String(index), year, title: "A scene", body: "Read this scene.", note: "",
    recordIds: [], scope: "americas", center: [-100, 30], zoom: 2,
  })),
};

test('hierarchy entry seeks the same year through holds and travel, including reversed chapters',()=>{
  for(const year of [100,125,150,175,200])assert.equal(sampleStory(story,storyElapsedAtYear(story,year)).year,year);
  const reversed={...story,scenes:[...story.scenes].reverse()};
  assert.equal(sampleStory(reversed,storyElapsedAtYear(reversed,150)).year,150);
  assert.equal(storyElapsedAtYear(story,50),0);
  assert.equal(storyElapsedAtYear(story,250),storyDurationMs(story));
});

test("each scene holds for reading before the year travels to the next scene", () => {
  assert.equal(sampleStory(story, 9999).phase, "hold");
  assert.equal(sampleStory(story, 9999).year, 100);
  assert.equal(sampleStory(story, 10000).phase, "travel");
  assert.equal(sampleStory(story, 11500).year, 150);
  assert.equal(sampleStory(story, 11500).sceneIndex, 0);
  assert.equal(sampleStory(story, 13000).sceneIndex, 1);
  assert.equal(sampleStory(story, 13000).phase, "hold");
  assert.equal(sampleStory(story, 13000).year, 200);
});

test("the final scene receives its entire hold and completion never wraps", () => {
  assert.equal(storyDurationMs(story), 23000);
  assert.equal(sampleStory(story, 22999).completed, false);
  assert.deepEqual(sampleStory(story, 23000), {
    sceneIndex: 1, year: 200, phase: "complete", progress: 1, completed: true,
  });
  assert.deepEqual(sampleStory(story, 90000), sampleStory(story, 23000));
});

test("a paused elapsed clock is stable and seeking does not retain stale scene state", () => {
  const paused = sampleStory(story, 11500);
  sampleStory(story, 17000);
  assert.deepEqual(sampleStory(story, 11500), paused);
  assert.equal(sampleStory(story, 2000).sceneIndex, 0);
  assert.equal(sampleStory(story, 2000).year, 100);
  assert.equal(sampleStory(story, sceneStartMs(story, 1)).phase, "hold");
  assert.equal(sceneStartMs(story, 1), 13000);
  assert.equal(sceneStartMs(story, -1), 0);
  assert.equal(sceneStartMs(story, 20), 13000);
});

test("long text and requested extra reading time cannot be cut to a short hold", () => {
  const long = { ...story.scenes[0], body: "word ".repeat(100), holdMs: 100 };
  assert.ok(sceneHoldMs(long) >= 24000);
  assert.equal(sceneHoldMs({ ...story.scenes[0], holdMs: 30000 }), 30000);
  assert.equal(sceneHoldMs({ ...story.scenes[0], holdMs: 100 }), 10000);
});

test("single scenes, negative seeks and astronomical BCE/CE transitions are bounded", () => {
  const single = { ...story, scenes: [story.scenes[0]] };
  assert.equal(storyDurationMs(single), 10000);
  assert.equal(sampleStory(single, -200).progress, 0);
  assert.equal(sampleStory(single, 10000).completed, true);
  assert.equal(sampleStory(story, Number.NaN).year, 100);
  const crossing = { ...story, scenes: story.scenes.map((scene, i) => ({ ...scene, year: i ? 1 : -1 })) };
  assert.equal(sampleStory(crossing, 11500).year, 0);
  assert.throws(() => sampleStory({ ...story, scenes: [] }, 0), /scene/i);
});
