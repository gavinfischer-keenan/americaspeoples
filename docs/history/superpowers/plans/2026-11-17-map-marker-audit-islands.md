# Map markers and island evidence implementation plan

> For agentic workers: use superpowers:executing-plans, with one final independent review.

**Goal:** Make each mapped feature legible as one feature; audit duplicate representation across the published atlas; strengthen human-history coverage of the Falklands and Galápagos.

**Architecture / design:** Keep source evidence, date models, shared-clock behavior and distinct co-located phases. Replace detached dispute asterisks with status styling on the feature and a plain-language explanation on inspection. Audit the canonical published dataset, not archived intake files. Add only source-supported island finds, visits and built settlements; uncertain early visits remain visibly uncertain. Research summaries lead with what was found or happened.

**Tech stack:** Existing TypeScript/SVG atlas, JSON evidence, browser and Node tests.

**Spec:** This document records the user requests and implementation design. The user has authorized use of judgment, implementation and completed-release integration/deployment; no additional design approval is required.

## Global constraints
- No name-only or proximity-only deletion of records. Related finds, phases and disagreements stay inspectable.
- One calendar applies throughout the master map; no invented settlement continuity or exact landing points.
- Deep Consensus only; additional allowance75, count every tool call conservatively. This task starts with1dispatch and1status call.
- Current release plus one previous rollback only.

## Tasks
1. Audit canonical records for exact semantic duplicates, same-place groups and detached status symbols. Reproduce Bluefish in a browser. Record counts and classifications in a reproducible report. Fix marker status across ordinary, point-overlay and regional/area rendering. Test Bluefish at overview and close zoom, pointer/keyboard selection and retained dispute text.
2. Research both island groups using one Consensus Deep request and primary source checks. Expand the two existing assessments and add dated, located history records to the shared dataset with links between relevant entries. Verify chronology, location precision, bibliography, master-map membership and no fabricated prehistoric settlements.
3. Run targeted checks then required release validation; independent whole-branch review, bounded fixes, merge/deploy and public smoke checks. Update release receipts and retain one previous release.

## Review focus
- Catalog and full records, proposal corrections and identical coordinates must retain their identities.
- Dispute status is separate from date uncertainty and must not look like another site.
- Area/route information must not hide or displace physical sites.
- Island proxy dates must not become proven human occupation; distinguish discovery/claiming from construction.
- Shared clock, historical visibility and exported evidence remain consistent.

## Added user requirements (same release)
- Deepen Brunei/Borneo, Cebu, Timor, Papua New Guinea, Palau and Micronesian island chains; dedicated rich Yap rai stone-money topic. Shared-history evidence feeds the master map.
- Existing and new guides gain substantial source-linked narrative, licensed photographs, item-level attribution, Wikipedia and other relevant external reading links.
- Add a searchable Sources, attributions & licenses page covering every published reference plus actually reused content, media, map data and software; unknown rights remain explicitly unknown.
- All work is merged/pushed/deployed as one next release, explicitly reconfirmed by the user.

Independent domains are delegated under dispatching-parallel-agents: guide renderer/enrichment/attribution register; Borneo/Cebu/Timor/NewGuinea proposals; Yap/Palau/Micronesia proposals. Parent owns integration, markerfixes, Falklands/Galápagos and release.
