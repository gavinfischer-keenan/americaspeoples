# Round 9 research release implementation plan

> **For agentic workers:** Use the executing-plans skill; independent source-check groups are delegated under dispatching-parallel-agents. Integrate and verify sequentially.

**Goal:** Collate the closed round-nine intake, publish supported additions, and regenerate an actionable geographic/temporal coverage audit.

**Architecture:** Preserve the v0.4.1 hybrid service and reviewed record contracts. Raw uploads remain private; new original summaries and claim-level sources enter the versioned release database. Reconcile repeats; explicitly account for leads that remain unresolved.

**Tech stack:** TypeScript frontend, Python read-only API, SQLite, existing coverage/build/export scripts.

**Spec:** User's closed batch: 17 topics with the follow-up Inca PDF/RIS; held Nuu-chah-nulth report and official census sources; requested coverage-light review after integration. No new UI design or infrastructure changes are required.

## Constraints and review focus

- Do not harm other applications; scoped release with rollback and neighbor response checks.
- Keep uncertainties and disputes; never convert room, artifact or survey counts into residents.
- Distinguish individual sites from regions and model context; preserve granular known locations and unknown populations.
- Climate correlation, causal explanation, environmental evidence and warfare are separate claims.
- Historical enumeration coverage is incomplete and inequitable; colonial totals are not Indigenous population totals or language percentages.
- All reports and RIS originals are archived with hashes; primary/authoritative-source access limits explicit. No raw report redistribution.

## Tasks

- [x] Archive all supplied files, including Inca follow-up; extract text by page and RIS bibliography; hash duplicates.
- [x] Independently source-check Inca; Southwest/Pueblo/conflict; Caribbean/Central America; root handles inventories/Montana/Northwest/whaling/census.
- [x] Combine validated records and dispositions; validate duplicate IDs, dates, references, source support and locations. Retain pending leads without silently treating them as verified.
- [x] Refresh coverage audit from all current records, distinguishing dated site evidence, regional context, modeled evidence and unresolved leads. Produce specific next research questions by region/time.
- [x] Update version, build database/downloads/export, run the ordered release checks and evidence-specific regressions.
- [x] Deploy only atlas API/static/product/download artifacts, verify public results and neighboring apps/host health, then commit and tag.
- [x] Report release totals, material limitations and useful next-round gaps.
