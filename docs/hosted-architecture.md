# Hosted atlas: authoritative structured data

Author decision,2026-10-29: Americas Peoples is a hosted web application at its existing address, launched through its existing product page. Spreadsheet compatibility must not constrain the application schema or richer map features.

The authoritative published store is the version-controlled structured data in this repository. Archaeological/historical evidence, physical geometry, climate reconstructions and natural-hazard catalogs may have separate schemas with explicit source mappings. Builds publish immutable snapshots. Data refreshes are explicit editorial changes, not silent third-party runtime updates.

Spreadsheets and share packages remain optional import/export and suggestion channels. They are not the database and cannot represent every physical layer. Visitor proposals do not automatically overwrite reviewed data. The current release still processes visitor drafts locally; this decision does not claim that accounts, a submission backend, persistent shared editing or a database service have already been implemented. Those can be added as actual feature requirements develop.

Self-hosting requires the documented application build and web-server configuration. The existing offline archaeological export remains a convenience, not a constraint on the hosted architecture. Physical catalog exports are separate from the archaeological workbook.

Each climate/hazard collection records provider, publication/dataset reference, access date, exact acquisition parameters, raw-download hashes, geographic/year subset, transformations, uncertainty and limitations. Reconstructed conditions are separate from sourced interpretations about human consequences. Modern reference currents/winds never silently become ancient reconstructions. Open-water conditions require sea ice and paleogeography sources; land-ice retreat alone is insufficient.
