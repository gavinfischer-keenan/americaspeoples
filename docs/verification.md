# Current release verification

Version 0.4.2 is the current research release. It follows the verified 0.4.1 maintenance and 0.4.0 hybrid releases. Current runtime requires HTTP and the Python/SQLite API; file:// checks are historical only.

Round-nine verification, October 29, 2026 (America/Los_Angeles):
- All 18 ordered release phases passed: 120 unit tests, 10 Python API tests, strict TypeScript, full dataset validation, actual workbook import and all 738 full review pages, privacy/CSP, map/timeline/mobile/physical layers, network failures and extracted self-host bundle.
- 87 new source-checked records; 651 preceding full records byte-identical. Hazards and ice geometry unchanged. Repeated Louisiana and Central American trade findings reconciled. Source-access limits and 31 held interpretation groups are explicit in the public round-nine report.
- Public build/assets, four new report/data files, five sampled new API reviews, 53-region coverage audit, launch flow, ENSO sources, latest-research link and all three hosted download checksums passed.
- Static release: `/srv/tripofisch/releases/20261030T005513Z`. API/database release: `/srv/americaspeoples/releases/20261030T005513Z`. Both preceding rollback directories end in `20261030T002228Z`.
- All 12 neighboring public app responses remained byte-identical. Proxmox had about 60 GB available memory and low load; public container storage 61% used. API service active at approximately 14 MB memory. No Caddy, resource or other-app changes in this release.
- [Future issue #1](https://github.com/gavinfischer-keenan/americaspeoples/issues/1) and [future issue #2](https://github.com/gavinfischer-keenan/americaspeoples/issues/2) created and independently read back with the exact `feature request` label. These features were not implemented.

The following observations describe the preceding 0.4.1 maintenance release.

Run `npm run verify:release` for the ordered current checks, including the extracted self-host bundle and actual API/browser tests. [Code audit](code-audit-2026-10-29.md) records findings and measurements. [Developer guide](developer-guide.md) explains module contracts. [Historical verification](release-verification-history.md) preserves earlier observations without treating them as current guarantees.

Production verification completed 2026-10-30 UTC.


Final source/package verification: all18phases pass, including116unit tests and10PythonAPItests. Fresh independent integration review found no new blocking issue; the conservative circle-edge advisory was fixed. Complete source records, uncertainty and metadata remain covered by exact-export/parity tests. Root before/after measurements and limits are in the code-audit report.

Production maintenance release:
- Static files: `/srv/tripofisch/releases/20261030T002228Z`.
- API/database: `/srv/americaspeoples/releases/20261030T002228Z`.
- Both rollback targets: preceding `20261029T234257Z` release in their respective release directories.
- All 17 public assets/documents matched the build; all three hosted download hashes matched. API manifest, full citations, dated ice snapshot, product launch, Smart/log timeline, ENSO review and coverage page passed live checks.
- All 12 neighboring public application responses remained byte-identical. Proxmox had approximately 60 GB available memory and low load; container storage was 59% used. API service active, approximately 13 MB memory.
- Deployment compared every full evidence record, hazard and ice snapshot against v0.4.0 in both directions: identical. No new facts or 3D features were included.
- The live climate check now waits for the visible ENSO marker: climate data intentionally loads after the core atlas, so an immediate count was a test timing error. The corrected live check passes.
