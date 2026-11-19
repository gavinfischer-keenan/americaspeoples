# World entrance and human-family framework implementation plan

> **For agentic workers:** Use superpowers:executing-plans for application integration and superpowers:dispatching-parallel-agents for independent research shards; finish with one whole-change review.

**Goal:** Build a world-first entrance, regional pages and a sourced playable human-family framework, including a deeper genetics discussion.

**Architecture:** Small world catalogue and independent D3 player, shared summary generation, and preserved legacy controllers. Bootstrap can mount the world without loading Americas. Tripofisch pages and the app consume the same generated summary.

**Tech stack:** Existing TypeScript, D3, esbuild, JSON, Python/SQLite; no new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-11-18-world-entry-human-family-design.md`

## Constraints and review focus

One site with regional paths; all principal hominin branches belong in scope. Ordinary dates end in 1900. Preserve old routes and existing source data. Schematic migration and inferred admixture must remain visibly qualified. Avoid double-counting region-crossing sources. Direct links, stale loads, deep-time ranges, a narrow screen and keyboard-only use must work. Publish the paired v0.32.0 release after full verification; the user explicitly authorized this on 2026-11-19.

## Tasks

- [x] Author `data/world/ancestors.json` and `data/world/dispersals.json` to the spec contract, checking primary sources. Extend the existing human-family guide with genetics evidence, geographical differences and access qualifications. Independent research ownership avoids editing shared runtime files.
- [x] Add failing behavior tests in `tests/world.test.ts`: deep-time validation, dangling citations, source unions, interval endpoints and inactive routes. Implement `src/world-model.ts` with `validateWorldData`, `worldSources`, `worldAtYear`, `worldDates`, `worldRegionStats` and `worldRoute`.
- [x] Implement `src/world-page.ts` and CSS: globe/hub, all-world mode, regional list, standalone broad movie, evidence/taxon filters, dated source details and dispose lifecycle. Use `#world`, `#origins`, `#origins/europe`, and the Africa/Asia atlas routes.
- [x] Integrate bootstrap and main routes, preserving legacy state and avoiding Americas API fetch on fresh world entry. Add world links in existing headers. Activate Africa/Asia manifests as first-draft foundation coverage and revise obsolete preview expectations.
- [x] Build summary and website bundle through `scripts/world-build.ts`, using canonical archive/europe records and guide references. Add global/region paths, preserve the Consensus box, and retain the former Americas page as regional material. Keep generated website deploy files within the self-host bundle or a separately verified release directory.
- [x] Run focused tests, all unit tests, typecheck/data validation and build. Exercise world startup, region clicks, deep-time playback, source details, legacy Europe/Americas and 390px layout in a browser. Add the new behavior to release verification and inspect screenshots.
- [x] Review the entire change, fix material findings, record verified results and give the user a working local preview. Publication, if requested, uses the existing locked staging/rollback process plus explicit scoped Tripofisch framing changes if required.

## Progress and rulings

- Baseline: clean main at 8d880f1; feature branch `feat/world-entry-human-family`. Reusing the existing checkout follows the desktop workspace instruction; no new worktree was requested.
- The user chose paths and explicitly expanded scope to all earlier hominins and geographically differentiated interbreeding evidence.
- Last deployed baseline: v0.31.0. Source and content are implemented; final verification and paired publication are in progress.

- 2026-11-19: User authorized final compilation, checks and live publication before stopping for the night. Full release verification, immutable staging, paired website/header changes and public checks are required.

- Independent reviews cleared source, chronology corrections, pointer/focus fixes and the paired deployment procedure. The final Africa inventory adds 130 observations; the focused chapter contains 156 observations through astronomical year −14,999. Two Consensus Deep reviews completed; their private outputs stay outside publication.

- Final source verification: all 66 aggregate phases passed across retained resumed logs. The packaged world, Africa, Europe and shared-panel suites passed after the final menu-timing correction; 506 unit tests, TypeScript, package smoke and deployment/retention safety checks passed. Paired publication and public verification follow the existing release process.
