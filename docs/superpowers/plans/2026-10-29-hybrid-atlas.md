# Hybrid atlas implementation

Owner authorized implementation, no backward compatibility requirement, and software/resource changes on the serving server provided other applications are not harmed. Existing public-web container is Debian13,1GB RAM,16GB disk, about7GB free. No resize or other application change is justified by current measurements.

## Architecture

- Dedicated loopback Python service, SQLite authoritative release database with indexed time/geography and FTS search. Standard-library runtime avoids a heavyweight service/dependency chain on this small shared container.
- Caddy proxies only this app's `/api/` paths. Static presentation and all other application hostnames stay on their current routes.
- Compact, source-linked map summaries load via API. Full claims/bibliographies are fetched on review/correction; indexed server search covers full evidence. Smooth time playback and rendering stay in the browser.
- Climate event summary index loads separately; detailed hazard entries and specific dated ice snapshots load on demand. No full evidence or ice archive is compiled into JavaScript.
- Versioned database release is read-only to the public API. Editorial publication imports validated structured data into a new database, checks integrity and switches atomically. SQLite backups are release snapshots. Visitor suggestions remain private until explicitly exported; no new public write endpoint or implied authentication system.
- Spreadsheet and JSON exports remain exchange/download formats. Replace the offline-only ZIP with a self-host bundle including server/setup instructions. No requirement to maintain file:// execution or earlier local drafts.

## Work

1. Build database importer, read-only bounded API/static server and request tests, including geometry/time/search, pagination, malformed inputs, full source preservation, API-only query boundaries and inaccessible database/private paths.
2. Split runtime data from build-time editorial data. Initialize map catalog from API, fetch detailed reviews, server search, lazy physical data with correct source-year/scenario selection and stale-response protection.
3. Rewrite current hosting/privacy/download docs to match hybrid behavior. Import previous research batch, keep new whaling and census intake out of this content release.
4. Unit/type/data checks, actual Python API integration tests and desktop/mobile browser checks for panels, timeline, source details, import/export, storage and errors. Independent focused review and fixes.
5. Deploy only NODE01 CT101: non-root loopback service with resource limits, separate release DB and backup, scoped Caddy route validation, atomic app switch and health check/rollback. Confirm other public hostnames still respond. Publish source/tag and checksummed downloads after success.

## Verification limits

Initial map catalog contains all lightweight map records to support instant global timeline changes. This is deliberately hybrid, not a claim of complete viewport streaming. API spatial queries are bounding-box candidate matches, not excavated extent or precise route intersections. Future high-volume vector tiles or a separate PostgreSQL service are only justified after measurements. Public API accepts read-only GET/HEAD; source links and analytics are disclosed. Reconciliation and AI labels remain unchanged.
