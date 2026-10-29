# Americas Peoples — hybrid hosting

Version0.4.0 requires Python3.11+ with SQLite FTS5/RTree and an HTTP origin. No Python package installation is required on Debian13. Node22+ is needed only to build from source. The public API is read-only; do not expose the editorial import command as a public write endpoint.

## Run the self-host download

Extract the selfhost ZIP. From its `americas-peoples` folder:

    python server/app.py --db data/atlas.sqlite3 --root web --host 127.0.0.1 --port 8105

Open http://127.0.0.1:8105/. Keep the database outside the public web directory. A normal static-only host or file:// launch is insufficient.

For production, run the service as a non-root systemd user on loopback, behind Caddy with HTTPS supplied by Cloudflare. Static frontend files may be served directly by Caddy; proxy only `/api/*` to the service. This server binds loopback by default, caps concurrent requests at8, validates query bounds, restricts methods and opens SQLite in immutable read-only mode. It is intended behind a reverse proxy, not as an Internet-facing general-purpose server.

## Build and publish

    npm ci
    npm test
    npm run typecheck
    npm run build
    python server/test_api.py
    npm run test:hosted

Set `PYTHON_PATH` to the Python executable if `python` is not on PATH. The build creates frontend `dist/`, a release database `release/atlas.sqlite3`, a self-host ZIP and SHA256 manifest. The database contains the full published evidence, hazard catalog and ice snapshots. Check `PRAGMA integrity_check` before publication; the importer does this automatically.

Production publication makes a new immutable app/database release, validates health and switches symlinks. Restart the atlas service when changing its database pointer: each running process pins one release path. Keep the earlier app/database pair for rollback. Never modify the database under an active immutable reader. Back up versioned DB files outside the public root. Editorial source JSON and import scripts are publication inputs; spreadsheets are exchange formats.

## API

- GET `/api/manifest`: version, counts, dated ice index.
- GET `/api/catalog?limit=1000&offset=0`: compact map records, paging cursor.
- GET `/api/records?from=0&to=1000&bbox=-120,20,-60,60&q=maize&layer=trade`: indexed temporal/geographic/full-text filtering. Bounding boxes are conservative candidates, not exact route intersections; west>east crosses the dateline. Maximum1000rows per response, integer pagination.
- GET `/api/records/{id}`: full evidence and all claim/source links.
- GET `/api/hazards/index`: paginated event summaries; `/api/hazards/{id}` retains the full catalog fields.
- GET `/api/ice/{optimal|min|max}/{ageCalBP}`: one original dated snapshot. No server-generated interpolation.
- GET `/api/export`: complete evidence snapshot for optional bulk import/export.
- GET `/api/health`: release and evidence count.

The browser preloads the compact map and hazard indexes, then draws and animates locally. Full records and ice snapshots are separate requests, with an8-snapshot browser cache. Initial catalog loading is deliberately global to preserve instant timeline changes; it is not yet vector-tile/viewport streaming. Public API requests contain selection/search parameters, not private suggestion contents. Cloudflare analytics is disclosed on the site.

## Resource isolation

Use a dedicated systemd service, restricted user, `NoNewPrivileges`, `ProtectSystem`, bounded memory/tasks and CPU quota. NODE01 CT101 also serves other public sites, so changes must be scoped to the atlas service and hostname. Check Proxmox memory/load/storage and container headroom before increasing allocation. Do not change other nodes, tunnels, app processes or storage partitions unless a measured need exists.
