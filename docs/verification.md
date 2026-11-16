# Current source release verification

Version **0.12.0 source release candidate**. Live remains the deployed v0.11.0. This revision has not been merged or deployed.

Final revision checks passed: **255 unit tests**, TypeScript contracts, validation of all **1,834 records**, production build, the complete workbook round trip, packaged documentation, extracted self-host startup and all four topic browser suites.

The 27-phase release gate also passed before the final two review fixes, at 1,833 records and 253 unit tests. That gate covered all source reviews, hosted privacy/security, map behavior, spreadsheet editing, API and package checks. Python ran 15 cases: ten passed and five filesystem-symlink retention cases were skipped on this Windows host. Those five are not claimed as newly verified here.

The one whole-branch review identified two material issues, both reproduced and fixed: manual topic dates and review actions can now reach evidence earlier than the opening chapter, and the Hawaiian dog observation links reciprocally to an independently supported visit/provisioning record in shared history. Four new browser scenarios passed for these fixes. No critical issues, deferred minor findings or unjudged behaviors remain from that review.

The final topic browser suites checked all seven movies and 52 chapters, tablet portrait/landscape, basic phone layout, seven navigation regressions, and detailed island coastlines on both delayed and cached loads. A timing-only assertion was corrected to wait for the asynchronous evidence page before checking its return link. All these regression checks are included in the release gate.

Screenshots were inspected at 1,440 × 960 desktop, 1,024 × 768 tablet landscape and 768 × 1,024 tablet portrait. Small Pacific islands are present; tablet playback controls remain on screen and both map and narrative retain usable space.

Coverage: 1,834 records; seven separate topics, 52 chapters; 11 contextual stories, 66 scenes. New intake: 16 topic records and nine shared human-context records. Cumulative Consensus Deep calls:34/100. See [source decisions and limitations](pacific-topic-dives.md).

Tablet/computer are primary targets; phone is best effort. Current timelines retain the 1934 endpoint; queued topic-specific exceptions are not implemented yet.
