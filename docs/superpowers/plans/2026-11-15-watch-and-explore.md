# Watch and Explore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make the atlas an understandable guided movie and a usable local exploration tool.

**Architecture:** Keep source records and review workflows; add a pure scene timeline and curated source-linked journeys. Improve the SVG renderer's viewport and selection independently, then integrate a new responsive application shell, discovery panel, and inspector.

**Tech Stack:** Existing TypeScript, native DOM, SVG, d3-geo, Node tests and Playwright browser checks.

**Spec:** `docs/superpowers/specs/2026-11-15-watch-and-explore-design.md`

## Global constraints
- No new historical claims without existing supporting records; no invented population/territory/warfare.
- Keep offline operation, source links, proposal/import workflows, reduced motion, and date uncertainty.
- Keep all controls usable at 360 px. Preserve temporal isolation of Movie.
- Separate development from already deployed v0.7.1.

## Review focus
- Coincident points and broad areas: every candidate remains reachable.
- Dateline-crossing Pacific views: do not fit the wrong side of the world.
- Resizing with details open: geography and selected item remain stable.
- Pause/resume or manual scene changes: no stale timer or skipped scene.
- No search results or no local conflict evidence: helpful empty state without implying historical absence.

### Task 1: Selection and useful geography
**Files:** `src/map.ts`, `src/map-projection.ts`, `src/map-geometry.ts`, `src/map-filters.ts`, focused tests.
**Interfaces:** Retain `MapView.update/focus/setScope/visibleRecords`. Add `focusRegion(center:[number,number], zoom:number, scope?:MapScope):void`, `focusRecords(records:DisplayRecord[]):void`, `setHighlighted(ids:string[]):void` for stories/local focus. `onSelect` may return ranked overlapping records.
- [x] Write failing checks for a site under an area and useful focus/resize behavior.
- [x] Implement screen-coordinate hit resolution with point priority and all overlapping candidates available; quiet backgrounds and visible point paint order.
- [x] Fit actual viewport, preserve center on resize, anchor wheel zoom, bound local zoom, and improve local labels/highlight.
- [x] Run focused tests and typecheck; report interface details to integration owner.

### Task 2: Grounded story data and pure playback
**Files:** new `src/stories.ts`, `src/story-player.ts`, `tests/stories.test.ts`, `tests/story-player.test.ts`.
**Interfaces:** `Story {id,title,subtitle,description,scenes:StoryScene[]}`; `StoryScene {id,year,title,body,note,recordIds:string[],scope:MapScope,center:[number,number],zoom:number}`; exported `stories`. Pure timing helper tracks scene/elapsed and returns interpolated year, scene index, completed; no DOM dependencies.
- [x] Test every scene reference exists, timeline dates are ordered, each claim has cited records and uncertainty notes.
- [x] Author four to six coherent journeys using only the current corpus.
- [x] Test readable holds, transition, pause via elapsed clock, end, and seek; implement helper.

### Task 3: Watch / Explore shell and discovery
**Files:** `src/main.ts`, new `src/atlas-shell.ts`, `src/atlas-ui.css`, `src/explore.ts`, `src/map-panels.ts`, relevant tests.
- [x] Build a compact navigation and transport; move advanced settings behind disclosure.
- [x] Integrate journey selector, readable scenes, timed transitions, progress, previous/next/restart, focus mode, and source links. Keep free timeline mode.
- [x] Add region choices, global search, local facets/date mode, ranked overlap chooser, inspector zoom and close/back actions.
- [x] Restyle all main pages and responsive map/drawers without hiding information permanently.
- [x] Run functional browser checks for watch, explore, search, collision choices, sources, and mobile.

### Task 4: Review and release candidate
- [x] Independent code review against the spec; address actionable findings.
- [x] Full ordered release verification; browser accessibility/responsive/visual review.
- [x] Save UI audit/result screenshots, document changed behavior and limits, and create a reviewable PR.

Completed as PR #4: https://github.com/gavinfischer-keenan/americaspeoples/pull/4. The 24-phase release suite and final affected checks passed; v0.7.1 remains the production release.
