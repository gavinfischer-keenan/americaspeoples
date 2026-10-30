# Americas Peoples · Alaska Blackfish

Version 0.6.0: a hybrid, source-linked atlas hosted at https://americaspeoples.11mosswood.us/ and launched from https://tripofisch.com/free-utilities/americaspeoples/.

The server holds962 published records. Ten regional Consensus DEEP reviews were run sequentially, followed by original-source checks and geographic reconciliation:68 new findings and7 explicit revisions, including corrections to site classification and chronology.64 additions have supported calendar windows and36 have named-locality anchors; these are records, not68 new settlements.442 bibliographic leads retain their discovery trail, with held claims and source-access limitations explicit. Full generated reports and quotations remain private; published records cite the underlying sources. The separate author-supplied colonial registry remains visibly marked **AI generated facts**, with conflicting population columns excluded. See docs/round12-synthesis.html and docs/coverage-audit.html.

The new places/cultures collection adds twelve populated pages and five complete cited DEEP research reports. The Chaco and Inca culture pages include schematic geographic road-network maps, and culture pages introduce ritual, languages and historical transformation. These new reports are public, unlike the earlier round-twelve raw intake archive. The 962 individually reviewed archaeological records remain unchanged. NOAA/NCEI contributes 1,580 historical earthquake entries, alongside existing eruptions and tsunamis; a master Natural events control preserves individual selections and keeps ENSO independent.

The browser renders a compact map catalog and handles smooth timeline playback. SQLite handles authoritative evidence/source storage and indexed queries. Full reviews and large climate snapshots are loaded on demand, rather than compiled into JavaScript. The separately sourced physical catalog contains8896 hazard/ENSO entries and147 ice-scenario snapshots. Geographic/time coverage, uncertainties and source-access limits remain explicit.

## Run and contribute

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Python/SQLite server, build/test commands, API, resource limits, backup and rollback. The self-host bundle requires an HTTP origin and the API; file:// and static-only hosting are no longer supported. Public reads do not grant permission to modify evidence. Visitor drafts and spreadsheet/JSON parsing remain local; exported suggestions are optional editorial inputs, never the authoritative store.

Sources, original methods, disagreement, AI attribution and uncertain geometry are part of the data. See docs/evidence-policy.md and THIRD_PARTY.md. Do not interpret a missing record as absence of people, a broad region as an excavated site, or genetic affinity as proof of a language. API requests expose requested records/search terms to the host; Cloudflare usage analytics is disclosed. No private drafts are uploaded automatically.


## Maintenance and review

The scaling audit separates compact/full API contracts, cancels/debounces IDs-only search, pages table rendering, preserves keyed map-panel focus, caches projected geometry, indexes playback boundaries and validates proposal transactions before commit. Climate loading failures are isolated from the evidence atlas. See docs/code-audit-2026-10-29.md and docs/developer-guide.md. Run `npm run verify:release`; the self-host bundle is part of the verification, not an optional manual afterthought. Site/culture pages are implemented; future 3D model ingestion and ancestry graphs remain documented in docs/roadmap.md.

## Site-guide maintenance

Stable map IDs link through data/site-guides.json, while independently sourced editorial sections live in data/site-guide-content.json. Complete research documents stay byte-exact in sites/reports/*.md, with SHA-256 records in data/site-research-reviews.json. scripts/site-guide-build.ts validates report integrity and populated pages, escapes report HTML and builds the linked static guides. It does not convert regional research dates into map occupation intervals.

## Movie and Explore

Movie is the default time-filtered view. It excludes unresolved chronology and timeless wind/current references. Playback clears selection: hover reads the catalog summary; a map/evidence click pauses and consumes the click, then another click may select current evidence. Changing year removes stale selections. Explore is an all-period research view with viewport-filtered lists, unresolved question marks and contextual areas; its timeline is hidden and marker sizes are reference symbols, not a population at the movie year. Dated physical catalog events/ice remain in Movie; the full catalog is accessible separately. Layer preferences survive switching views.
