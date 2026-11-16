# Current source release verification

Version **0.14.0 source and packaged release**. This document verifies the source and downloadable package; public activation is checked separately. The preceding release was merged in PR #9; its public deployment receipt is retained in the repository.

Coverage: **1,960 records; 20 independent topics / 184 chapters; 11 contextual stories / 66 scenes**. This update adds 100 observations: 88 shared historical/archaeological records and 12 focused records. All ten previously queued movies are implemented. That completes the requested movie queue, not the historical research.

The shared map and ordinary topics still end in 1934. Only the Hawaiian political topic extends through 1959, with four exact later record IDs excluded from shared history. Tests cover manual dates, playback, validation, workbook round trips and returning to shared history.

The gap audit distinguishes source windows from continuous occupation and missing evidence from human absence. The detailed audit now includes previously omitted shared history/expansion collections and Australia/Aotearoa. Sixteen targeted gap observations and eight Australasia observations include local phases, built places, coercion and documented activity. Broad regional pins are explicitly marked; protected Australian sites retain generalized locations.

Source verification separates a site chronology from one specimen's date, a fort from a separate labor-coercion event, a naval capture from a wreck, and a colonial purchase from Indigenous consent. The research reports serve as discovery aids; original public claims cite underlying research and community/institutional sources. **Consensus Deep cumulative usage: 53/100**, conservatively including submission and polling calls. Raw generated reports remain private.

All **30 required release phases passed in one complete final run** after the corrections below: **277 unit tests**, TypeScript, 1,960-record validation, production package, complete workbook import/reimport and every evidence page, API, self-host startup, and all browser suites. Earlier runs identified an obsolete queued-topic expectation and the manual-date race; the final run includes their corrections. Reproduce the ordered checks with `npm run verify:release`; regenerate the researched workbook with `node --import tsx scripts/workbook-tables.ts` after changing records.

The new suites checked all 100 chapters across the ten newly completed movies, their current evidence and cameras, plus the earlier movies. The additional Pūrākaunui chapter also passed the existing Pacific topic checks. The index contains 20 playable cards and no unfinished requested queue entries. Hawaiʻi manual dates, slider, review navigation and shared-context isolation passed. Desktop (1440×960), tablet landscape (1024×768) and tablet portrait (768×1024) screenshots were inspected.

Python ran 15 cases on Windows: ten passed and five filesystem-symlink retention cases were skipped there. All five retention safety cases separately ran and passed on the target Linux host. Shared-world playback still verifies the automatic Americas opening, simultaneous Columbus/Taos, contextual Beagle journey and ordinary stories.

One fresh independent whole-branch review found repeated observations incorrectly counted as distinct localities and an incorrect Early Classic/Postclassic label. Three reproducing tests failed before correction and passed afterward. Nine verified locality groups now retain canonical place identity, while separate observations and genuinely distinct nearby sites remain separate. The audit and workbook were regenerated.

The final stress checks also exposed animation overwriting typed dates. A reproducing browser scenario failed in each movie mode; focusing the manual date form now pauses that movie. All five network/date/search resilience scenarios and the complete final gate passed. No second reviewer was used; no unresolved material findings or deferred minors remain.

The review did not certify exhaustive history, every citation's full text or future deployment. Those are not claimed here. The author rechecked the locally retained Admission Act and accessible GPO transcription after the reviewer's PDF request timed out. Actual public deployment, download hashes, neighboring pages and rolling retention are verified separately during activation.

Tablet/computer are primary targets; phone remains best effort. Selected geographic and chronological gaps are listed in [the coverage report](world-coverage-audit.md), with source decisions for [land and sovereignty](land-sovereignty-dives.md), [trade, missions and materials](remaining-topic-dives.md), and [Australia/Aotearoa](australasia-archaeology.md).
