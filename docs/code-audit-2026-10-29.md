# Hybrid atlas code audit

Baseline:391f0f4 / v0.4.0. Review began after that hybrid release was publicly verified. Scope: entire application algorithms, display work, module boundaries, test/deployment contracts and maintainability. New fact ingestion is held until maintenance verification finishes. Three independent review domains covered algorithms/backend, rendering and structure/contracts; source-level findings were checked against regressions and measurements.

## Verified findings and fixes

- Proposal inspection repeatedly serialized large records inside pairwise duplicate scans. On651 records, measured new/duplicate imports took16–18seconds. Indexed identity/content/base/culture comparisons reduced the same workload to55–64milliseconds. Tests enforce linear content reads and original conflict precedence.
- Import/editor updates could commit a combined collection past1000 rows or8 MB before saving failed. Candidate collection validation now precedes state replacement; a rejected import retains its preview and original collection.
- The map rebuilt both lists and selected details on pan events and destroyed keyboard focus after selection. Projected bounds/paths are cached, viewport notifications coalesced, list buttons keyed, and selected details updated only when their consumed state changes. Context visibility now matches its actual marker anchor.
- Playback rebuilt thousands of hazard objects/boundaries every frame. An immutable `PlaybackIndex` uses sorted dates and prefix sums with O(log n) queries; source-date/pacing parity is regression-tested. Record preview validation is cached by explicit revision.
- Evidence search downloaded full map summaries on every keystroke. An IDs-only endpoint, debounce, cancellation through paging/body reads and generation guards bound network and display work. The evidence table renders100rows per page with delegated row selection.
- Failed hazard pages previously prevented the archaeological atlas from starting. Climate loading is independent, complete catalogs publish atomically, and loading/error/retry states do not claim event absence.
- Two pending ice requests could drop a new target; stale failures could replace its status. A latest-target cache drains on both success and failure, bounds concurrent work/cache size, and retries failed current snapshots.
- Catalog objects were typed as complete source records and mutated as details loaded. Explicit catalog/full/API contracts and separate caches now prevent accidental incomplete exports/corrections.
- API spatial bounds missed spherical arc interiors; literal wildcard searches were incorrectly escaped. Conservative shorter-arc bounds and literal-search regressions address both while retaining approximate geometry semantics.
- Four named browser suites still targeted removed file/offline execution, and package verification was omitted from the release commands. All unique assertions now use a shared actual Python/API fixture; one ordered release verifier includes extracted-package checks.
- Current schema/hosting documentation was mixed with obsolete historical assurances. Current contracts and module invariants now lead; old release observations are historical records.

## Baseline measurements

Root benchmark at651evidence records and7316 hazard summaries: new snapshot16,710ms; duplicate16,686ms;100uncached playback iterations109.5ms. Browser120-step pan:456list child mutations,321.5ms script,452.6ms layout,80.7ms style recalculation; focused selection moved focus toBODY. These are workload/machine observations, not guarantees of visitor performance.

The preceding hybrid change reduced initial application JavaScript21,517,688→665,533bytes by removing embedded full evidence/ice/hazard collections. API export itself measured~112ms and20.4MiB peak locally; that was not a demonstrated memory emergency, so an unnecessary export rewrite was not prioritized.

Final verification and after measurements are recorded at completion. No critical issue was identified in the independent review; the concrete defects above were important scale/correctness issues, not a guarantee that no other issue exists.


## Final verification and after measurements

All18ordered release phases pass:116unit tests, strict contracts (including unused-local checks), full data validation, production build,10APIintegration tests, hosted privacy/CSP/persistence, extracted self-host startup, workbook/import/edit/overlay regressions, all651imported claim/bibliography pages, map/timeline/mobile/contrast checks, keyed focus and network-failure recovery. Fresh integration review found no new blocker; its circle-edge bbox advisory was fixed and tested.

On the same root workload: new import56.6ms, duplicate65.8ms. Indexed100tick queries0.61ms after3.94ms construction. Pan120steps:0list child mutations,76.3ms script,5.68ms layout,7.41ms style recalculation, focus preserved. Timing is diagnostic and machine-dependent; deterministic operation/parity tests enforce semantics. The paired-release deployment also compares every full evidence/hazard/ice value with0.4.0before switching, so this audit does not add or rewrite facts.
