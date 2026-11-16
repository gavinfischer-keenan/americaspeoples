# Current source release verification

Version **0.14.0 source candidate**. The live site remains v0.13.0 until this candidate completes verification, review and activation. The preceding release was merged in PR #9; see its [public deployment receipt](releases/v0.13.0-verification.json).

Coverage: **1,960 records; 20 independent topics / 184 chapters; 11 contextual stories / 66 scenes**. This update adds 100 observations: 88 shared historical/archaeological records and 12 focused records. All ten previously queued movies are implemented. That completes the requested movie queue, not the historical research.

The shared map and ordinary topics still end in 1934. Only the Hawaiian political topic extends through 1959, with four exact later record IDs excluded from shared history. Tests cover manual dates, playback, validation, workbook round trips and returning to shared history.

The gap audit distinguishes source windows from continuous occupation and missing evidence from human absence. The detailed audit now includes previously omitted shared history/expansion collections and Australia/Aotearoa. Sixteen targeted gap observations and eight Australasia observations include local phases, built places, coercion and documented activity. Broad regional pins are explicitly marked; protected Australian sites retain generalized locations.

Source verification separates a site chronology from one specimen's date, a fort from a separate labor-coercion event, a naval capture from a wreck, and a colonial purchase from Indigenous consent. The research reports serve as discovery aids; original public claims cite underlying research and community/institutional sources. **Consensus Deep cumulative usage: 53/100**, conservatively including submission and polling calls. Raw generated reports remain private.

All **30 required release phases passed** across the main run and its corrected continuation: **274 unit tests**, TypeScript, 1,960-record validation, production package, complete workbook import/reimport and every evidence page, API, self-host startup, and all browser suites. One old test still expected two now-completed movies to be queued; it was updated to verify live links and legacy bookmark promotion, and all seven regression scenarios passed. Runtime code did not change for that correction. Reproduce the ordered checks with `npm run verify:release`; regenerate the researched workbook with `node --import tsx scripts/workbook-tables.ts` after changing records.

The new suites checked all 100 chapters across the ten newly completed movies, their current evidence and cameras, plus the earlier movies. The additional Pūrākaunui chapter also passed the existing Pacific topic checks. The index contains 20 playable cards and no unfinished requested queue entries. Hawaiʻi manual dates, slider, review navigation and shared-context isolation passed. Desktop (1440×960), tablet landscape (1024×768) and tablet portrait (768×1024) screenshots were inspected.

Python ran 15 cases on Windows: ten passed and five filesystem-symlink retention cases were skipped there. All five retention safety cases separately ran and passed on the target Linux host. Shared-world playback still verifies the automatic Americas opening, simultaneous Columbus/Taos, contextual Beagle journey and ordinary stories.

Independent whole-branch review and deployment are pending; their outcomes will be appended after verification.

Tablet/computer are primary targets; phone remains best effort. Selected geographic and chronological gaps are listed in [the coverage report](world-coverage-audit.md), with source decisions for [land and sovereignty](land-sovereignty-dives.md), [trade, missions and materials](remaining-topic-dives.md), and [Australia/Aotearoa](australasia-archaeology.md).
