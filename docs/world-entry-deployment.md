# Staged world entrance

The user authorized paired publication on 2026-11-19 after compilation and checks. This document describes the generated bundle and the publication sequence. The self-hosted Tripofisch website is separate from the registered Sites project.

`buildWorldCatalogue()` in `scripts/world-build.ts` merges `data/world/*.json`, validates citations and cross-shard taxon identities, and writes `dist/world-catalogue.json` and `dist/world-summary.json`. Its returned filenames must join the release build’s `names` list. Missing research, conflicting source identities or invalid combined citations stop generation before output is written.

The website source is `src/world-website.ts`; future builds must use it instead of an external landing snapshot. The Americas `about.html` retains the full v0.31.0 introduction, including its visual tour, Consensus acknowledgement, navigation, reuse and privacy copy. A visible notice dates release-specific counts to that preserved edition and links to the current world coverage. Existing Tripofisch stylesheet and gallery/logo asset links are absolute URLs; preserve those existing files when installing the new directory. The shared browser entry supplies the interactive hub, with a fully readable regional list present in the initial HTML.

The staged directory is `dist/tripofisch-site/spread-of-peoples/`:

- `index.html`, `world-summary.json`, `world-catalogue.json`
- `americas/index.html`, `americas/about.html`
- `africa/index.html`, `europe/index.html`, `asia-pacific/index.html`
- `world-site.js`, `world-site.css`, and the land asset copied by the main build

The hub mount reads `data-summary-url`, `data-catalogue-url`, `data-base-root` and `data-app-origin` from `#world-site`. The supplied app origin is `https://americaspeoples.11mosswood.us`. Region pages use explicit established hashes, so changing the atlas root to the world view does not redirect their movies.

## Counting contract

Global records are a union of canonical published archive evidence eligible through 1900, including undated archive rows; Europe evidence; and foundation evidence. Europe’s `canonicalRecordId` joins duplicate identities. Foundation waves have a separate count. A count is not a claim that every record is mapped or playable.

Archive and Europe coordinates, destinations and route vertices enter broad navigation bins. Americas is longitude −170 to −25; Africa is longitude −20 to 55 and latitude −36 to 37; Europe is longitude −25 to 60 and latitude 35 or higher; Asia–Pacific includes other coordinates and longitudes east of 55. These approximate rectangles deliberately overlap around the Mediterranean and are not historical borders. Foundation region IDs and actual guide atlas memberships take precedence for those catalogues. Pacific records in the legacy collection do not make that entire collection geographically American. Regional totals overlap; the global total is not their sum.

References include actual cited record, foundation, wave, dated territory, population-observation and taxon sources plus guide bibliographies. URL normalization and explicit DOI metadata join aliases. Source titles, similar wording and guessed DOI strings never manufacture an identity. Optional studies and territory arrays are retained during the combined catalogue merge; territory snapshots and study groupings do not inflate the evidence-record count. Earliest dates come only from mapped observations with known dates and retain the source label and evidence title. Undated evidence does not become year zero. The separate Hawaiʻi statehood chronology stays in the existing application; the summary’s ordinary timeline universe ends in 1900.

## Local verification

Run `node --import tsx --test tests/world-build.test.ts`, the repository’s type/data checks, unit suite, production build and relevant browser tests. Serve `dist/tripofisch-site` as the web root so `/spread-of-peoples/` paths resolve. Inspect the globe, regional list, 390-pixel layout and keyboard navigation. The generated region frames target production; local preview of new atlas behavior requires a local atlas origin substituted for that preview. This is a preview setting, not a reason to change the published origin.

The production atlas currently disallows framing. A working standalone map does not verify an embedded map. Do not mark framing as verified from local HTML inspection or an iframe load event.

## Authorized publication steps

1. Finish the established full release verifier and retain the current staged-release and rollback procedure. Save a backup of the Tripofisch pages, tile links and atlas-host headers.
2. Publish the matching atlas build before exposing links to its new foundation routes. Install the staged `spread-of-peoples` directory under the Tripofisch document root without overwriting unrelated site files.
3. On the **atlas host only**, replace the existing CSP `frame-ancestors` directive with exactly `frame-ancestors https://tripofisch.com`. Keep every other CSP directive and existing security header. Remove `X-Frame-Options` on this host because `DENY` or `SAMEORIGIN` conflicts with the intended cross-origin embedding. Do not loosen these headers globally or use wildcard ancestors.
4. If Caddy forwards an upstream `X-Frame-Options`, strip that response header in the atlas `reverse_proxy` as well as removing any atlas-site Caddy header that adds it. Confirm the final response, not just one configuration layer. Merge the CSP directive into the current policy; do not replace the full policy with a lone framing directive.
5. Update Tripofisch’s Alaska Blackfish tiles and project links to `https://tripofisch.com/spread-of-peoples/`, using “The Spread of Peoples” as the subject and retaining Alaska Blackfish as the identity. Keep the old `/free-utilities/americaspeoples/` address as a permanent redirect or compatibility page to `/spread-of-peoples/americas/`. Do not repoint explicit atlas `#movie`, `#explore`, topic or Europe bookmarks.
6. Check the actual HTTPS response headers with `curl.exe -I https://americaspeoples.11mosswood.us/`. In a real browser on `https://tripofisch.com`, verify all four embedded regional maps, the full-window links, console CSP messages, browser back/forward and mobile navigation. Verify that an unrelated parent origin remains blocked. Framing is complete only after these checks pass.
7. If the atlas or website checks fail, restore the paired previous atlas release, Tripofisch pages/links and atlas-specific header configuration. Recheck the established legacy links after rollback.

No DNS, TLS, repository rename, new regional hostnames or Sites deployment is required.
