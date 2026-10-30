# Maintaining the hybrid atlas

## Boundaries and invariants

`server/database.py` publishes a new immutable SQLite release from validated editorial data. `server/app.py` serves read-only queries with bounded concurrency; Caddy serves frontend files and proxies only the atlas API. Never edit a database file underneath an active immutable reader. Back up the release DB and retain the previous app/API pair for rollback.

`src/api-contracts.ts` distinguishes the manifest, compact catalog pages and IDs-only search pages. A `CatalogRecord` deliberately has no bibliography, source mappings or complete review. `client-data.ts` owns cancellable transport, release-version checks and separate catalog/detail/export caches. The immutable catalog must never become a mixture of complete and incomplete records depending on browsing history. Review, correction and import comparison require full `EvidenceRecord` data.

`record-view.ts` derives validated visitor previews once per proposal revision and preview setting. `proposals.ts` owns canonical identity, indexed conflict inspection and whole-collection preflight. Commit a candidate collection only after validation succeeds; do not clear an import preview or overwrite stored state after rejection. Local drafts do not automatically publish into the server database.

`playback-index.ts` builds one immutable temporal index per enabled-record/filter combination. Rebuild on catalog revision, proposal/preview changes or relevant filter changes. Querying the index changes neither dates nor scholarly status. Inclusive astronomical dates, per-record boundary deduplication, certain cores and the1934 display ceiling remain explicit. `time.ts` and `timeline.ts` retain the pure reference semantics and parity tests.

`map.ts` owns SVG interaction and drawing. `map-geometry.ts` owns projected geometry and bounds; it has no dates or source interpretation. Projection changes invalidate its cache; coordinate/radius fingerprints detect edited geometry. The context-list rule must match the actual first-endpoint question-mark marker, not a line that is not being rendered. Coalesce viewport notifications with animation frames.

`map-panels.ts` owns keyed list button identity, selection presentation and detail markup. Keep surviving DOM nodes to preserve keyboard focus and scroll; a selection is not a reason to rebuild every button. `evidence-table.ts` owns bounded page rendering, debounced/cancelled IDs-only server search and disposal on navigation. Neither controller owns authoritative facts.

`physical-data.ts` owns climate-catalog loading state, source snapshot selection and caches. A partial/failed hazard download is never interpreted as an empty catalog. `latest-request-cache.ts` owns bounded concurrent loads and the latest desired snapshot: always drain queued current work after success or failure, and never let an old failure own a new selection's status. `physical-rules.ts` contains pure classification, `physical-reference.ts` source descriptions and editorial ocean geometry, `physical-review.ts` full-source markup, and `physical-page.ts` the catalog UI. `physical.ts` is a small feature facade, not a second data store.

`main.ts` connects controllers, shared UI state and route-generation guards. Keep page-specific rendering out of this coordinator. `about-page.ts` contains the method/privacy explanation. Async work must check its route/request generation, and page teardown must abort search work. Imported text and source links continue through escaping and URL validation.

## Verification

Run `npm run verify:release` with `PYTHON_PATH` and, if needed, `BROWSER_PATH` set. The command stops at the first failed phase and verifies unit/type/data contracts, the production build/database, actual Python API, complete workbook flow, all current browser suites and the extracted self-host bundle. `--list` lists phases without running them. Verification does not deploy.

Benchmarks are diagnostic, not pass/fail wall-clock assertions: run `npm run benchmark` and `node scripts/benchmark-render.mjs`. Compare before/after on the same machine and workload; deterministic complexity/parity tests enforce the important algorithmic invariants.

Historical integration scripts are editorial one-offs, not normal build steps. Several depend on private intake archives outside the repository and mutate published JSON. Read their docstrings and source assumptions before running them. The normal release builder does not rerun those scripts or publish private report copies. New information needs source access, chronology, geography, ambiguity and attribution review; repeated generated summaries are not independent corroboration.

For production installation, resource limits, API routes and rollback, use [DEPLOYMENT.md](../DEPLOYMENT.md). This guide explains code responsibilities; it does not duplicate the operational runbook.
