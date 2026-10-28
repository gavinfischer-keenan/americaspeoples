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
