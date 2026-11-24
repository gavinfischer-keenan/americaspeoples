# Remaining Major Voyages Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for central integration and dispatching-parallel-agents for isolated source research. One fresh whole-branch review follows integration.

**Goal:** Fill major American, Arctic and Antarctic expedition gaps identified in v0.27.
**Architecture:** Extend voyages.json, canonical voyage evidence and expedition activity; reconcile every prior inventory entry without erasing unresolved source questions.
**Tech Stack:** Existing TypeScript, JSON, Python/SQLite and static guide/release pipeline.
**Spec:** docs/superpowers/specs/2026-11-18-remaining-major-voyages-design.md

## Global Constraints
- Shared clock ends 1934-12-31.
- Exact dates must be sourced; year/month evidence retains its precision.
- Separate parties, stays, drift and unsupported route gaps.
- Preserve protected/generalized locations, credits and noncommercial licensing.
- Reuse the clean checkout on a feature branch; no hosting migration.

## Review Focus
- Sea routes accidentally crossing continents or islands between sparse anchors.
- Winter bases rendered as continuous movement or drift rendered as a fixed camp.
- Conflicting dates, calendar conventions and uncertain landfalls made exact.
- Return journeys or rescue parties suppressing concurrent expedition context.
- Inventory completion claims exceeding the actual mapped phases or source coverage.

### Task 1: Source the outstanding inventory
Files: work/voyage-gaps/{americas,arctic,antarctic,pacific}.json and research notes.
Interface: candidate voyages, sources, source-located stops, activity updates and inventory decisions; isolated research files only.
- [x] Snapshot the 35-entry inventory and current 74 routes; assign independent source families.
- [x] Browse primary/institutional sources for missing stages; record source locators, evidence precision and unresolved cases.
- [x] Reconcile candidates against existing identities and dates.

### Task 2: Integrate documented journeys and evidence
Files: data/voyages.json, data/voyage-expansion-records.json, data/expedition-activity.json, data/voyage-coverage-inventory.json, tests/voyage-gap-completion.test.ts.
Interface: existing Voyage/VoyageStop and EvidenceRecord contracts; no fabricated exact dates.
- [x] Add failing contracts for representative missing major expeditions, linked source/evidence integrity, journey gaps and disputed claims.
- [x] Merge verified candidate routes, point records and coarse context with stable IDs and explicit phase/gap notes.
- [x] Update each inventory entry with mapped IDs and remaining precise questions; add a dated completion audit.
- [x] Run targeted tests, full unit tests, TypeScript and evidence validation.

### Workbook compatibility found during verification
The 3,492-record snapshot exceeds the old 2,000-row Evidence worksheet cap and inline-string XML budget. Share repeated strings, use the existing 5,000-proposal limit for worksheet bounds, and bound long globally scoped citation IDs while preserving their claim mappings. Keep compressed/expanded byte, archive-entry and combined-proposal limits. The complete workbook round trip and existing safety tests verify the change; a fresh independent review covers this follow-up.

### Task 3: Verify the map and publish
Files: docs/voyage-coverage-review.md, README.md, docs/verification.md, package metadata, browser regression, release receipt.
- [x] Verify representative American, Arctic and Antarctic phases on the shared clock, including concurrent parties and untraced intervals.
- [x] Perform fresh source/date/geography review and resolve material findings.
- [x] Build and run the release gate; preserve successful results when only a narrow follow-up test needs adjustment.
- [x] Merge, publish, verify the live API/assets/browser and retain current plus previous release.
