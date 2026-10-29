# Americas Peoples — deployment handoff

Hosted edition: Americas Peoples at https://americaspeoples.11mosswood.us/, launched through https://tripofisch.com/free-utilities/americaspeoples/. Animal identity: Alaska Blackfish. This document also describes self-hosting the current static implementation; it does not itself confirm a deployment. Release verification is recorded in docs/verification.md.

The author has authorized a fully hosted application and richer future services. Versioned structured collections are the current authoritative store; spreadsheets are optional import/export and suggestion channels. Current builds still run mapping and visitor draft processing in the browser. A server database, shared accounts or submission API have not been invented merely by changing this direction. See docs/hosted-architecture.md.

## Identity and destination

- App: **Americas Peoples**.
- Public origin: **https://americaspeoples.11mosswood.us/**.
- Layer: **Utilities**.
- Animal name and logo: **Alaska Blackfish**; linked product page supplies the logo and animal article.
- Description: A browser atlas of archaeological and historical evidence in the Americas, from the earliest included findings through 1934, with source-linked reviews and time-dependent overlays.
- Source: https://github.com/gavinfischer-keenan/americaspeoples, published branch `main`; handoff release `v0.2.1`. Resolve the exact immutable revision with `git rev-parse v0.2.1^{commit}` or the supplied handoff report.

## Architecture and hardware

The production application is static HTML, CSS and bundled JavaScript. Mapping, animation, filtering, detailed reviews, XLSX/JSON parsing, validation, editing, local persistence and file export run in the visitor's browser. There is no application backend, server computation, database, authentication, API key, account, telemetry, external map-tile server or runtime environment configuration.

Your hardware serves static files through the existing Caddy/Cloudflare Tunnel setup. It does not process uploaded spreadsheets or maintain user research collections. Node.js/npm are build and test tools; do not run a Node process in production for this app.

## Install, test and build

Use Node.js 22 or newer and npm. The verified build environment was Node.js 24.19.0. Run in the repository root:

```sh
npm ci
npm test
npm run typecheck
npm run validate
npm run build
```

The committed `package-lock.json` pins dependencies. Installation needs access to the npm registry and the official SheetJS package at `cdn.sheetjs.com`. These are build-time downloads only. All runtime vendor code and basemap data are bundled. Dependency attribution is in `THIRD_PARTY.md` and remains in every download.

**Deploy exactly the contents of `dist/` as the subdomain's document root.** The build recreates that generated directory and refuses a symlinked `dist`. Do not serve the repository, `node_modules`, scripts, tests, `.git`, private files or development servers.

The directory includes `index.html`, `app.js`, `app.css`, documentation, the two XLSX workbooks, `dataset.json`, `research-proposals.json`, `evidence-appendix.json` and `evidence-appendix.html`. The map data and default evidence are also compiled into the app; no runtime data-fetch API is needed. The ZIP contains the same deployable files in an `americas-peoples/` folder.

For local verification only:

```sh
npm run preview
# prints http://127.0.0.1:4173/ ; PORT can override the local port
npm run test:hosted
```

The hosted browser test starts and stops its own loopback HTTP server with the documented security headers. Set `BROWSER_PATH` to an installed Chromium-family browser executable. It defaults to Windows Edge; Playwright browser downloads are not needed. Optional `DIST_PATH` lets the hosted test check an extracted release directory.

Offline suites accept `APP_PATH` pointing to the extracted ZIP's `index.html`:

```sh
npm run test:browser
node scripts/regression-browser.mjs
node scripts/bulk-browser.mjs
node scripts/overlay-browser.mjs
node scripts/research-browser.mjs
```

## Routing and response headers

Deploy at the **root of its own subdomain**. Asset and guide URLs are relative. Application routes use URL fragments: `/#map`, `/#evidence`, `/#proposals`, `/#about` and `/#review/lanse-1021`. Refreshing a deep link requests `/`; the fragment stays in the browser. **No SPA fallback is required.** Unknown file paths should return 404, not `index.html`. There are no workers or service-worker paths. Permit GET/HEAD; the app does not require POST or uploads.

Serve correct MIME types: HTML `text/html`, JS `text/javascript` or `application/javascript`, CSS `text/css`, JSON `application/json`, XLSX `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, ZIP `application/zip`. UTF-8 applies to text. Ordinary Caddy `file_server` MIME detection is suitable.

Recommended app-host response policy, for the deployment agent to apply to this origin only:

```text
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
X-Frame-Options: DENY
Cache-Control: no-cache
```

Inline styles are required for map colors/SVG rendering and the bundled guide/appendix. Inline scripts and eval are not required. A stricter conflicting upstream CSP can break the app. HTTPS should be supplied by the existing hosting system. No CORS, WebSocket, cross-origin-isolation or special rewrite rule is required for the app. Launch it as a normal page/new tab, not an iframe.

Publish a complete versioned static directory, then switch the active release atomically using the established deployment workflow. Keep the previous release for rollback. Because filenames are not content-hashed, revalidate files and do not apply a Cloudflare Cache Everything/immutable policy. Preserve the app origin and storage key. Do not send `Clear-Site-Data` during updates. Open tabs keep their loaded code until the visitor reloads; there is no forced-update worker.

## Data appendix and product page

Use `docs/landing-page-content.md` for the explanation, launch/download labels and appendix instructions. `evidence-appendix.json` contains full records, claims, bibliographies, provenance and collection labels. `evidence-appendix.html` is a readable, script-free rendering of the same material. The source package is `data/research-proposals.json`.

There are **eight default bundled records** and **51 optional research proposals**. The latter include 21 overlays, 145 claims and 123 bibliography entries. They are not automatically shown or promoted to reviewed evidence: visitors import the supplied workbook or JSON under Suggestions and enable Preview complete suggestions. An appendix must retain this distinction. Bibliographic entry counts can include separate documents hosted on the same web page.

For an appendix below a product page on `tripofisch.com`, render/copy the JSON at site-build time or copy it to that page's origin. Do not introduce a cross-origin runtime fetch requirement for the app. `reviewPath` links are valid only for default records; proposal indices in a visitor's local collection are not portable URLs. Use each record's stable `appendixPath` for public supporting detail. Do not add corporate left-side section navigation inside the working atlas; its existing sidebar contains map controls.

## Storage and privacy

Suggestions are stored as a JSON proposal package under localStorage key `americas-peoples-proposals-v1`. Import reads only the files the visitor selects, in memory. Export/Send to others creates a browser Blob download: it does not upload, email or contact recipients. No app code uses fetch, XHR, WebSocket, EventSource or sendBeacon for user data. Runtime CSP blocks connections. Static assets and downloads are ordinary same-origin GETs; opening a scholarly/GitHub source link deliberately navigates to that external site.

The hosting server and Cloudflare can see ordinary request metadata such as IP address and user agent; the app's privacy claim is that it does not send research drafts, imports or edits to them. Do not inject analytics, third-party scripts or account integrations without revisiting that claim.

LocalStorage is origin- and browser-profile-specific. A different subdomain, browser or local file copy does not receive existing drafts automatically. Export JSON from the old copy and import it in the new one. Browser data clearing, private browsing, quota limits and storage restrictions can remove or prevent persistence. The app reports storage failures and keeps the current in-memory collection available for export. There is no cloud backup or cross-device sync. Same-origin reload/update preservation is covered by the hosted test.

## Offline use, PWA and downloads

This is **not an installable PWA**: no web manifest, install icons or service worker is registered. A hosted page needs its initial assets from the host; future offline reloads of a web URL are not guaranteed. The supported fully offline mode is the ZIP: extract it and open `americas-peoples/index.html` directly. All app features and included explanations work locally; publication links need internet.

`npm run build` creates `release/americas-peoples-v0.2.1-offline.zip`, `release/artifacts.json` and `release/SHA256SUMS.txt`. The manifest records exact filenames, byte sizes, SHA-256 digests and immutable tag download links. Published copies live in `downloads/americas-peoples-v0.2.1-offline.zip`, `downloads/v0.2.1-artifacts.json` and `downloads/v0.2.1-SHA256SUMS.txt`. The two workbooks are in `templates/`. The deployment agent may mirror these exact bytes for local download links and verify the supplied hashes. No EXE is needed.

## Verification and limitations

See `docs/verification.md` for actual test results. The hosted test checks the built files with response headers, deep-link reloads, preservation of a prior collection, import/export of all 51 research proposals, visible 1864 overlays, all 59 appendix records, no application data uploads, unsupported-feature messaging and JavaScript-disabled help. Offline suites verify the extracted build separately. This is local validation, **not verification of the public origin**.

Current Edge and Chrome are tested; Firefox/Safari and physical mobile devices have not been exhaustively tested. Essential missing browser APIs produce an explanatory startup message. File-location storage behavior varies. Imports remain bounded to 5 MB compressed XLSX / 20 MB expanded, or 2 MB JSON, with at most 200 proposals. The dataset is selected and incomplete; no population simulation, reconstructed disease-spread model, inferred ethnic borders or blanket extinction claim is provided. Five research overlays remain unmapped. The 1934 endpoint is a policy/display boundary, not the end of dispossession.

The deployment agent still needs to integrate the utility card and product/animal pages, choose final branding and hostname, publish through the established Caddy/tunnel workflow, and verify the actual public URL, headers and downloads. None of that infrastructure work has been performed in this handoff.


## TripoFisch hosted deployment privacy update — October 28, 2026

The owner authorizes Cloudflare Web Analytics on the hosted edition. Its CSP permits `https://static.cloudflareinsights.com` scripts and same-origin / `https://cloudflareinsights.com` analytics connections. The hosted About page and Privacy link disclose this. Research files and drafts remain local; no application upload endpoint is added. The tagged v0.2.1 offline download remains immutable and does not receive injected hosting analytics. Hosted app.js has a privacy-copy update relative to that tag.
