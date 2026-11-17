import type { Story, StoryScene } from "./stories";

const TRANSITION_MS = 3000;
const MINIMUM_HOLD_MS = 10000;
const WORDS_PER_MINUTE = 250;

export interface StorySample {
  sceneIndex: number;
  year: number;
  phase: "hold" | "travel" | "complete";
  /** Progress through the complete story, including its final reading hold. */
  progress: number;
  completed: boolean;
}

/** Reading time includes the caveat: it is part of the story, not optional small print. */
export function sceneHoldMs(scene: StoryScene): number {
  const words = `${scene.body} ${scene.note}`.trim().split(/\s+/).filter(Boolean).length;
  const requested = Number.isFinite(scene.holdMs) ? scene.holdMs! : 0;
  return Math.max(MINIMUM_HOLD_MS, Math.ceil(words * 60000 / WORDS_PER_MINUTE + 1500), requested);
}

function requireScenes(story: Story): void {
  if (!story.scenes.length) throw new Error("A story must contain at least one scene.");
}

/** Indexes outside the story seek to its first or last scene. */
export function sceneStartMs(story: Story, index: number): number {
  requireScenes(story);
  const bounded = Number.isNaN(index) ? 0 : Math.max(0, Math.min(story.scenes.length - 1, Math.floor(index)));
  return story.scenes.slice(0, bounded).reduce((elapsed, scene) => elapsed + sceneHoldMs(scene) + TRANSITION_MS, 0);
}

export function storyDurationMs(story: Story): number {
  requireScenes(story);
  return story.scenes.reduce((elapsed, scene) => elapsed + sceneHoldMs(scene), 0)
    + TRANSITION_MS * (story.scenes.length - 1);
}

/** Seek the existing movie clock to a shared year; callers retain out-of-range
 * years on arrival and offer the ordinary explicit replay control. */
export function storyElapsedAtYear(story:Story,year:number):number{
  requireScenes(story);
  const exact=story.scenes.findIndex(scene=>scene.year===year);
  if(exact>=0)return sceneStartMs(story,exact);
  for(let i=0;i<story.scenes.length-1;i++){
    const a=story.scenes[i],b=story.scenes[i+1];
    if(year>Math.min(a.year,b.year)&&year<Math.max(a.year,b.year))
      return sceneStartMs(story,i)+sceneHoldMs(a)+(year-a.year)/(b.year-a.year)*TRANSITION_MS;
  }
  if(year>Math.max(...story.scenes.map(scene=>scene.year)))return storyDurationMs(story);
  return 0;
}

/**
 * Sample virtual elapsed time. The caller owns pause/resume and accumulates
 * elapsed time at its chosen speed; this function never reads a clock or mutates state.
 * Years use the atlas's astronomical numbering (year zero is 1 BCE).
 */
export function sampleStory(story: Story, elapsedMs: number): StorySample {
  const duration = storyDurationMs(story);
  const elapsed = Number.isNaN(elapsedMs) ? 0 : Math.max(0, Math.min(duration, elapsedMs));
  const progress = elapsed / duration;
  if (elapsed >= duration) {
    return { sceneIndex: story.scenes.length - 1, year: story.scenes.at(-1)!.year, phase: "complete", progress: 1, completed: true };
  }
  let remaining = elapsed;
  for (let index = 0; index < story.scenes.length; index++) {
    const scene = story.scenes[index];
    const hold = sceneHoldMs(scene);
    if (remaining < hold) {
      return { sceneIndex: index, year: scene.year, phase: "hold", progress, completed: false };
    }
    remaining -= hold;
    const next = story.scenes[index + 1];
    if (next && remaining < TRANSITION_MS) {
      return {
        sceneIndex: index,
        year: Math.round(scene.year + (next.year - scene.year) * remaining / TRANSITION_MS),
        phase: "travel", progress, completed: false,
      };
    }
    remaining -= TRANSITION_MS;
  }
  // The final hold and the bounded elapsed value make this unreachable.
  throw new Error("Story timing did not resolve a scene.");
}
