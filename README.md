# Americas Peoples · Alaska Blackfish

Version 0.4.5: a hybrid, source-linked atlas hosted at https://americaspeoples.11mosswood.us/ and launched from https://tripofisch.com/free-utilities/americaspeoples/.

The server holds894 published records, including102 round11 findings across the Andes, Amazonia, Central America, northern South America, Southern Cone, California and Great Lakes. Twenty-nine additions have named-locality evidence anchors;73 have supported calendar windows. These are records, not102 newly discovered settlements. The round11 source report accounts for16 distinct receipts,82PDF pages,244 bibliographic leads and112 held source/interpretation leads. Original access and chronology limits remain explicit. The earlier author-supplied colonial registry remains visibly marked **AI generated facts**, with conflicting population columns excluded from map sizing. See docs/round11-synthesis.html and docs/coverage-audit.html.

The browser renders a compact map catalog and handles smooth timeline playback. SQLite handles authoritative evidence/source storage and indexed queries. Full reviews and large climate snapshots are loaded on demand, rather than compiled into JavaScript. The separately sourced physical catalog contains7316 hazard/ENSO entries and147 ice-scenario snapshots. Geographic/time coverage, uncertainties and source-access limits remain explicit.

## Run and contribute

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Python/SQLite server, build/test commands, API, resource limits, backup and rollback. The self-host bundle requires an HTTP origin and the API; file:// and static-only hosting are no longer supported. Public reads do not grant permission to modify evidence. Visitor drafts and spreadsheet/JSON parsing remain local; exported suggestions are optional editorial inputs, never the authoritative store.

Sources, original methods, disagreement, AI attribution and uncertain geometry are part of the data. See docs/evidence-policy.md and THIRD_PARTY.md. Do not interpret a missing record as absence of people, a broad region as an excavated site, or genetic affinity as proof of a language. API requests expose requested records/search terms to the host; Cloudflare usage analytics is disclosed. No private drafts are uploaded automatically.


## Maintenance and review

The scaling audit separates compact/full API contracts, cancels/debounces IDs-only search, pages table rendering, preserves keyed map-panel focus, caches projected geometry, indexes playback boundaries and validates proposal transactions before commit. Climate loading failures are isolated from the evidence atlas. See docs/code-audit-2026-10-29.md and docs/developer-guide.md. Run `npm run verify:release`; the self-host bundle is part of the verification, not an optional manual afterthought. Future3Dsite deep dives are documented in docs/roadmap.md and are not implemented in this release.
