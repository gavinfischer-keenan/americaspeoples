# Current release verification

Version 0.4.1maintenance release follows the publicly verified0.4.0hybrid release. Current runtime requires HTTP and the Python/SQLite API; file:// checks are historical only.

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
