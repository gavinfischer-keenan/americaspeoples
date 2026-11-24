# Bulk evidence import implementation plan

Goal: publish v0.1, then make a documented XLSX workbook directly importable as unreviewed suggestions with structured bibliography.

The user chose a spreadsheet direction and requested a public document that spells out evidence-page and citation inputs. Default to XLSX rather than CSV so multiple related tables and multiline text remain together. Four input tabs: Evidence, Claims, References, ClaimSources. Exact headers live in src/bulk-schema.ts. Standard JSON proposal imports remain supported; BibTeX, RIS and CSL-JSON are documented interchange choices, not falsely advertised as native app imports. DOI-only records cannot be resolved offline.

1. Push the verified v0.1 source and tag to the empty remote; preserve tag thereafter.
2. Test and implement XLSX parsing and deterministic table-to-proposal conversion with schema/header/relationship/date checks. Formulas and macro workbooks are rejected, no cell executes code, and size limits apply before and after decompression.
3. Extend source metadata and deterministic author-year bibliography formatting for eight source kinds. Keep original authors and identifiers; retain metadata through correction editing and sharing.
4. Add XLSX to existing Suggestions import, with the same preview and no automatic promotion. Add local guide and template links in the app and release.
5. Create an accessible XLSX template using the spreadsheet skill and publish full field definitions, worked examples and alternative reference formats in docs/bulk-import-guide.md.
6. Run unit/browser checks, import the actual exported template, review changes independently, package the update and publish guide/template/source to main. Keep v0.1 fixed at its original commit.

Tests must cover BCE conversion without date coercion, missing/duplicate IDs, missing source relationships, incorrect corrections, formula input, unsafe URLs, multiline prose, repeat import idempotence, citation preservation, and actual file:// XLSX import without networking.
