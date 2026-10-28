# Americas Peoples — informational page material

For the TripoFisch website deployment agent. Place under Utilities. Preserve the site's existing branding and product-page section navigation; keep that navigation outside the working atlas.

## Suggested explanation

Americas Peoples is an interactive atlas of archaeological and historical evidence across the Americas. Move through time—from the earliest included findings to 1934—and explore dated sites, cultural histories, movements, trade, conflict, forced removals and epidemics. Every record opens its supporting explanation and bibliography. Claims under scholarly discussion are marked, with the debate described alongside the evidence.

The map shows the evidence included in this edition. A marker disappearing does not establish that a people disappeared. Culture colors describe supported identifications, not racial categories. Routes are schematic where an exact path is unknown, and mortality estimates retain their source and limitations.

The application runs in your browser. Your suggestions stay in your browser or exported files; Send to others downloads a file for you to share. A separate ZIP works fully offline after extraction. Source links require internet access.

## Buttons, in this order

1. **Launch Americas Peoples** → proposed `https://americaspeoples.11mosswood.us/` (new tab is appropriate).
2. **Download for offline use** → locally mirrored ZIP from the release manifest; offer its GitHub URL alongside it.
3. **Download the researched spreadsheet** → `templates/americas-peoples-researched-import.xlsx` on the app host or local mirror.
4. **Contribution format and references** → `docs/bulk-import-guide.html` on the app host.
5. **Source code on GitHub** → https://github.com/gavinfischer-keenan/americaspeoples.

Do not mark the launch button live until the deployment agent verifies the public URL. Animal name and logo are still to be provided; do not invent them or add an unapproved animal article.

## Appendix below the explanation and launch link

Heading: **Data and evidence appendix**.

Intro: This edition includes eight default evidence records and a separate set of 51 optional research proposals. The proposals include 21 overlays, 145 claims and 123 bibliography entries. Import the researched workbook or JSON under Suggestions, then enable Preview complete suggestions to explore them. Structurally complete proposals are not independently peer-reviewed additions to the default dataset.

Use `dist/evidence-appendix.json` as the source of truth. Every `records[]` entry contains:

- `collection`: `bundled` or `research-proposal`; `defaultVisible` explicitly states the collection's default inclusion, not visibility at every year.
- `record`: the full evidence record with dates, culture, location, optional overlay, claims, source mappings, bibliography and review text.
- `reviewPath`: stable in-app review link for bundled records; null for proposals whose local indices vary by visitor.
- `appendixPath`: stable link to supporting detail in the public appendix for every record.

Suggested visible columns: Dates; culture/people; place; title; record/overlay type; collection; scholarly status; detailed evidence. Render dates from the astronomical integer convention: year 1 is 1 CE, 0 is 1 BCE, -1 is 2 BCE. Preserve original published dates and display interpretation in expanded detail. A record has an asterisk if any claim is not `well-supported`. Do not replace claim-specific disagreement with a blanket claim that the entire event is disputed.

Retain complete bibliography entries and source-access notes. Make search and filtering useful across both collections. The script-free `dist/evidence-appendix.html` provides a ready-readable reference; JSON is preferable for integrating with the site's own layout. Escape text when rendering it, and do not insert unsanitized user-contributed prose as HTML.
