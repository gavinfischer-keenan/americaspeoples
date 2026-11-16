# Current source release verification

Version **0.12.0 source release candidate**. Live remains the deployed v0.11.0. This revision has not been merged or deployed.

The 27-phase release verification passed: 253 unit tests, TypeScript contracts, validation of all 1,833 records, production packaging, spreadsheet round trips, all source reviews, and hosted/browser behavior. Python ran 15 cases: ten passed and five filesystem-symlink retention cases were skipped on this Windows host. Those five are not claimed as newly verified here.

The subsequent visual check found that topic maps were missing detailed coastlines. A delayed-load browser test reproduced the failure; topic maps now receive coastlines both when the asset arrives late and when it is already cached. After that fix, typechecking, production build, all seven movies and 52 chapters, tablet portrait/landscape, basic phone layout, and all seven navigation regressions passed. The geography regression is now part of the release gate. A timing-only test failure was corrected to wait for the asynchronous evidence page before asserting its return link.

Screenshots were inspected at 1,440 × 960 desktop, 1,024 × 768 tablet landscape and 768 × 1,024 tablet portrait. Small Pacific islands are present; tablet playback controls remain on screen and both map and narrative retain usable space.

Coverage: 1,833 records; seven separate topics, 52 chapters; 11 contextual stories, 66 scenes. New intake: 16 topic records and eight shared human-context records. Cumulative Consensus Deep calls:34/100. See [source decisions and limitations](pacific-topic-dives.md).

Tablet/computer are primary targets; phone is best effort. Current timelines retain the 1934 endpoint; queued topic-specific exceptions are not implemented yet.
