# Current source verification

Version **0.19.1** includes the remaining 12 entries in the accepted 25-study campaign. The [patch receipt](releases/v0.19.1-verification.json) records checks and publication status; the [v0.18 receipt](releases/v0.18.0-verification.json) records the first-half deployment.

The atlas contains **2,218 records: 2,148 shared and 70 focused**. This release adds 70 shared observations and five focused records, 52 contextual chapters across nine new place/culture guides, and 34 independent chapters across three topics. The four lists contain 70 available cards with no entries left in this campaign’s Coming soon queue. Six older guide expansions remain separate future work.

All **36 release checks passed**, including 309 unit tests, type checking, validation of all 2,218 records, production packaging, five package checks and all 86 new chapters. Shared context, independent-clock restoration, desktop/tablet layouts and the main 1934 endpoint passed. The existing Hawaiian 1959 exception is unchanged. Five Linux-specific retention cases are run separately on the deployment host.

Independent review found Carrington’s public locality about 32 km too far west. Two records and the chapter camera were corrected against the historical gazetteer, with geographic source support and a regression demonstrated failing before the fix and passing afterward. The original dates remain unchanged. One guide’s internal editorial wording was also clarified. The full release gate passed after those changes.

Source checking rejected unsupported exact cargo quantities and preserved conflicting Nan Madol and Mungo chronology accounts. Four older public geographic references were refined without changing their original time bounds. The expanded Library test follows all result pages rather than assuming every filtered list fits on one page.

Consensus Deep usage remains **74/100**, including polls, with 26 remaining. No extra calls were used for the second half. Full source extracts and generated reports remain private. [The campaign guide](coming-soon-campaign.md) documents scope, source access, temporal and spatial limits, and continuing expansion work. Deployment is verified separately in the release receipt.

The v0.19.0 live check exposed an inherited exact-date navigation error: selecting a December event opened January 1. The v0.19.1 patch preserves the documented day for source-review, local chronology and Explore navigation. Its regression was observed failing before the fix and passing afterward. All 309 units, type checks, record validation, packaging and the relevant shared-movie, dated-geography and selection checks passed again. The full 36-stage campaign gate belongs to v0.19.0; the patch did not repeat unrelated suites.
