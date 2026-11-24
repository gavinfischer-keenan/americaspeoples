# Literature intake and temporal uncertainty implementation plan

**Goal:** Publish the supplied literature as source-linked evidence and show uncertain dates and inferred regions without inventing settlements or probability estimates.

**Architecture:** Extend existing browser-only overlays with population-history, regional-evidence and environmental kinds. Reuse existing possible bounds and optional certain core for opacity. Preserve the workbook contract and all previously published evidence.

**User requirements:** Author additions included by default; abstracts suffice when full text unavailable; temporal fading; distinguish genomic movement, archaeological sites, environmental context and causal hypotheses. Site deployment and repository updates already authorized.

**Design decision:** Use broad blurred schematic connections/regions, without arrows, for inferred movement. Opacity is illustrative temporal support, never a posterior probability or population size. Never widen source dates to manufacture a fade. Without a supported certain core, use a symmetric illustrative fade within the published window and retain an uncertainty symbol. Single approximate dates remain single reference dates.

## Tasks
- [ ] Add failing tests for opacity boundaries, precise dates, uncertain windows, supported certain cores, and new layer validation.
- [ ] Implement opacity and cloud rendering, keyboard review access and explanatory legend/review text.
- [ ] Reconcile provided sources, correct metadata and date units, add distinct claim records and augment existing context citations.
- [ ] Generate full published workbook preserving Evidence/Claims/References/ClaimSources/Overlays; verify citations, dates, geometry and round trip.
- [ ] Test, version, build, publish and atomically deploy; verify live app and downloads.

## Review focus
Do not equate genetic divergence with an excavated site. Do not infer exact paths from regional models. Do not equate extinction overlap with proven human causation. Preserve AD 2000 versus BP 1950 baselines. Do not remove previous records or expose private drafts.

## Follow-on requirements: settlement detail

User requests individual named settlement points throughout all regions, greatest source-supported geographic specificity, dated population size changes, and very soft cultural-reach overlays on the same map. Unknown population uses the smallest 1–500 symbol with stripes, explicitly labeled unknown; no guessed demographic count. Source-scope population ranges and precision qualifiers must survive editor, JSON and XLSX round trips. Review local map focus, deep zoom, attribution, citation anchors and independent code review before publishing.

Implemented: population model/tests, explicit unknown stripes, larger date-indexed bands and upper-range halo, no interpolation or duplicate sums; separate cultural reach toggle; deep zoom and named labels; nine Hovenweep-area public site records; backward-compatible workbook columns. Full-source audit and pending additional regional inputs continue before release.

## Next content round — started only after deployment

v0.3.0 was deployed at `/srv/tripofisch/releases/20261028T234637Z`, with267records,59passingtests, public byte/hash and browser checks complete. Git tagv0.3.0 points to4fb65d1. That release remains unchanged.

User then explicitly asked for a separate next round beginning with Patagonia; companion MonteVerde and twoLouisiana exports followed. Preparev0.3.1 locally, preserving all source-specific dates and disagreements. NorthPatagonia/MonteVerde, SouthPatagonia, andLouisiana are independent evidence-review streams; reconcile existing records before adding duplicates. Originalexports become intakearchive24–27. No new release is live until the next round is built and deployed.

## Closed batch and language layer — author authorized deployment

The author closed uploads after export 37 (Fiji) and explicitly requested a full update and deploy. This supersedes the intake deployment hold. Preserve all 37 complete exports, reconcile accumulated Caribbean/Patagonia/Pacific evidence, and regenerate the complete workbook before publishing v0.3.1.

Language design: optional source-linked linguistic metadata; a separately toggleable language layer with dated distributions and relationships. Distinguish descent, borrowing, contact and unclassified relationships; source-specific uncertainty and disputes remain visible. Language and genetic ancestry are separate evidence types. Existing record time bounds control display; do not invent dates or territorial outlines. Add Pacific map view for island Asia through Hawaii, excluding New Zealand/Australia records. Preserve existing data/imports and all source text.

Release checks: schema and citation validation, language/import/population/map tests, typecheck, workbook roundtrip, build, browser verification, immutable versioned downloads and checksum comparison, atomic NODE01 CT101 release with previous release retained. No NODE02/TTO changes.
