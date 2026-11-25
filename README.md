# Americas Peoples · Alaska Blackfish

A free, noncommercial educational atlas. Redistribution, teaching, corrections, and contributions are encouraged. Original software: **PolyForm Noncommercial 1.0.0**. Original educational content and copyrightable curated data: **CC BY-NC-SA 4.0**, with third-party terms preserved. See [LICENSE.md](LICENSE.md), [reuse details](docs/reuse-and-contributing.md), and [CONTRIBUTING.md](CONTRIBUTING.md). This is source-available software with noncommercial permissions.

Version 0.35.0. The atlas opens with a world overview at https://americaspeoples.11mosswood.us/ and regional entrances under https://tripofisch.com/spread-of-peoples/.

## What it is

An open, source-backed atlas of how people spread and connected across the world, from the earliest hominin evidence (~7 million years ago) to 1900 CE. A world overview opens five regional atlases (Americas, Pacific, Africa & Middle East, Europe & Mediterranean, Asia), each with a playable timeline, an Explore research view, and linked deep dives on places, cultures, languages and subjects. A separate Climate section covers sea level, ice sheets, paleoclimate proxies and natural hazards.

Every mapped record carries its sources, dating method and uncertainty. A missing record is not evidence of absence, a broad region is not an excavated site, and genetic affinity is not proof of a language. See [docs/evidence-policy.md](docs/evidence-policy.md).

What changed in each release: [CHANGELOG.md](CHANGELOG.md).

## Quick start

```bash
npm ci
npm run typecheck && npm test   # fast checks, no build needed
npm run build                     # writes dist/ and release/ (needs python3)
npm run preview                   # serves dist/ locally on port 4173
```

Python is only needed for the API server and build (standard library only). The data-preparation scripts need the packages in [requirements-data.txt](requirements-data.txt). One-off intake scripts from earlier research rounds are kept in [scripts/archive/](scripts/archive/README.md).

## Run and contribute

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Python/SQLite server, build/test commands, API, resource limits, backup and rollback. The self-host bundle requires an HTTP origin and the API; file:// and static-only hosting are no longer supported. Public reads do not grant permission to modify evidence. Visitor drafts and spreadsheet/JSON parsing remain local; exported suggestions are optional editorial inputs, never the authoritative store.

Sources, original methods, disagreement, AI attribution and uncertain geometry are part of the data. See docs/evidence-policy.md and THIRD_PARTY.md. Do not interpret a missing record as absence of people, a broad region as an excavated site, or genetic affinity as proof of a language. API requests expose requested records/search terms to the host; Cloudflare usage analytics is disclosed. No private drafts are uploaded automatically.


## Maintenance and review

The scaling audit separates compact/full API contracts, cancels/debounces IDs-only search, pages table rendering, preserves keyed map-panel focus, caches projected geometry, indexes playback boundaries and validates proposal transactions before commit. Climate loading failures are isolated from the evidence atlas. See docs/code-audit-2026-10-29.md and docs/developer-guide.md. Run `npm run verify:release`; the self-host bundle is part of the verification, not an optional manual afterthought. Site/culture pages are implemented; future 3D model ingestion and ancestry graphs remain documented in docs/roadmap.md.

## Site-guide maintenance

Stable map IDs link through data/site-guides.json, while independently sourced editorial sections live in data/site-guide-content.json. Public sites/reports/* paths contain access-status notices, not raw research reports. Original reports are preserved outside the public repository. scripts/site-guide-build.ts validates source-status records and populated guides, and the release build rejects raw provider reports. It does not convert regional research dates into map occupation intervals.

## Watch and Explore

Watch opens with Americas · all histories, automatically playing from the earliest evidence to 1900. 84 contextual stories and expedition controls remain available. They change camera and emphasis while sharing one global date and contemporary world. Scene notes preserve dating and interpretation limits. Close zoom shows dated local place phases and events without inventing continuous growth. Explore adds named regions, global place search, local chronology and explicit conflict/violence filters. Overlapping map records open a ranked choice; the map fits its actual viewport, supports pointer-centered zoom and pinch, and labels selected places and routes. See [the UI redesign](docs/ui-redesign.md).

Movie is the default time-filtered view. It excludes unresolved chronology and timeless wind/current references. Playback clears selection: hover reads the catalog summary; a map/evidence click pauses and consumes the click, then another click may select current evidence. Changing year removes selections outside the current evidence and historical-context layers. Earlier places are historical memory, not evidence of current occupation. Explore is an all-period research view with viewport-filtered lists, unresolved question marks and contextual areas; its timeline appears when “At the map year” is selected, and marker sizes are reference symbols, not a population at the movie year. Dated physical catalog events/ice remain in Movie; the full catalog is accessible separately. Layer preferences survive switching views.
