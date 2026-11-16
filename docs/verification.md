# Current source release verification

Version **0.11.0 source release candidate**, checked 15 November 2026. These observations describe the review branch and locally built self-host package. The live site remains on the already deployed v0.10.0; this revision has not been merged or deployed.

## Results

All 27 required release phases passed after the review corrections. The final run passed phases 1–21. Phase 22 exposed an older test's list of permitted historical markers, which omitted the new attestation type; that test-only expectation was updated and phases 22–27 passed. Earlier full-year overlay-count assertions were also corrected to respect exact event dates. No production code changed during the resumed checks.

- 248 unit tests, strict TypeScript and validation of all 1,809 published records.
- 10 Python/SQLite API integration tests, full-data export and compact catalog contracts.
- The researched workbook imports all 1,809 records, including dates, history/linguistics metadata, geography, claims and references. Every imported review page rendered; reimport preserved correction/duplicate behavior.
- Production build, packaged documentation/licenses, and an independently extracted self-host package serving frontend, evidence reviews and dated ice requests.
- Shared Americas playback, simultaneous Columbus/Taos, contextual Beagle and regional stories, exact date gates, zoomed local places, relief, boundaries, rails, boats and loss history.
- Four focused topic controllers: direct links, all chapters with mapped evidence, play/pause/seek, 1799 language evidence, source review/return/locate, no unrelated context, and restoration of global year, fractional expedition date, selected journey, camera and Explore search, including entry through Library. Manual playback headings follow the live year and topic styling preserves header-link contrast.
- Desktop and 390-pixel phone screenshots inspected. Topic navigation fits, the map and transport remain usable, and additional narrative scrolls within its own panel. Source links and headings have explicit dark colors against the light panel.
- Privacy/CSP, same-origin read-only requests, editing/sharing, keyboard/touch interaction, map selection, panel identity, network failures and canceled searches.

The independent review led to corrections for Kitsissut’s specimen-date semantics, Ollantaytambo’s qualified construction attribution, and twelve imported encounter summaries. Source-described massacres and village attacks are distinguished from generic battle outcomes; Dakota/Lakota participants are not labeled Confederate from an inventory column heading. New regression tests failed before these fixes and passed afterward.

Two minor presentation follow-ups remain: ordinary-story detail blocks do not receive one intended decorative CSS rule, and some scientific source entries use generic display titles/venues instead of full formal bibliography metadata. The explanations remain readable and source URLs remain available.

## Coverage and limits

The 473 added records comprise 41 city and local-phase records, 401 encounter points, three northern evidence records and 28 topic-only records. Eleven ordinary stories contain 66 scenes; four separate topic movies contain 31 chapters. Ten expedition itineraries and the existing boundary/railway inventories remain shared-world context.

Source locations range from public archaeological-site references to explicitly approximate regional anchors. A historical document, construction window, specimen age and occupation interval remain different evidence. The language family forest is independent of the selected date; a 1799 frame is not a complete census or a guessed language polygon map. See [coverage decisions](cities-conflicts-coverage.md).

Two additional Consensus Deep runs bring the standing ledger to **31 calls out of 100**, including submission and polling calls. Raw generated reports remain private. Public records contain independently written claims and underlying source references.

Original software uses PolyForm Noncommercial 1.0.0; original educational content and copyrightable curated data use CC BY-NC-SA 4.0. Upstream BSD and CC BY terms, and unrestricted facts/public-domain material, retain their separate status. See [reuse and contributions](reuse-and-contributing.md).

Run `npm run verify:release` to reproduce all 27 ordered phases. [Historical verification](release-verification-history.md) preserves earlier observations.
