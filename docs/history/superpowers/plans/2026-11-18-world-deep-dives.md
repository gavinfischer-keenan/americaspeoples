# World deep dives, before world timelines

## Scope and decisions

The user has authorized the four-atlas architecture and now asks for sourced deep dives in the three new regions. Their clarification includes earliest hominin activity, not only human settlements. Guides get their own maps and geological-age labels; the Americas clock, dataset, stories and existing record IDs stay intact. The regional atlas maps remain explicitly coming soon while their guide collections become available.

Keep one repository with per-region content files and one guide renderer. Cross-region subjects have one guide with multiple atlas memberships. Voyage connections are generated from canonical voyage IDs/stops, with no duplicate journeys. Roman history is a hub with distinct expansion/frontier, city/network and late-antiquity studies. Future political boundaries require dated, sourced geometries with uncertainty; they are not part of this release.

## Tasks

1. Research and independently author Lucy, a branching human-family guide, and ten early activity localities with qualified ages and sources. Separate fossil ages, discovery dates, taxonomy and evidence of occupation.
2. Research and author Lascaux and Roman studies, and the three Asian monuments. Root authors the Congo River study and canonical voyage connections.
3. Build a typed guide-only schema, validation, reusable static guide renderer, accessible zoomable map, source-linked sections, regional guide navigation and index integration. Keep full guide text out of the app bundle.
4. Prepare modern high-resolution terrain maps for local studies, include wider-area scope, and link institutional archaeological plans. Native imagery must have explicit reuse rights. Scientific maps are not invented imagery.
5. Verify schema, geography, cross-links, chronology, unchanged Americas data, regional navigation and desktop/mobile guide reading. Review independently, fix findings, then build and run the required release checks before the previously authorized publication.

## Content contract

Research workers own separate JSON files under data/atlases/<atlas>/; each file is {schemaVersion:1,guides:WorldGuide[]}. Each guide has id (world- prefix), atlasIds (africa/europe/asia-pacific), category (places/subjects/cultures/languages), title, description, intro, scope, map {bounds:[west,south,east,north], scope, points:[{id,label,coordinates:[lon,lat],date,description,sources:[https URL]}]}, sections:[{heading,paragraphs:[{text,sources:[https URL]}],columns?:string[],rows?:[{cells:string[],sources:[https URL]}]}], sources:[{title,url}], relatedGuideIds?:string[], referenceMaps?:[{title,url,description}], voyageIds?:string[]. All historical claims and mapped localities require citations. Approximate map points are labeled as such. Bounds encompass every point. No raw HTML or Markdown in prose fields. No invented direct-ancestor arrows.

## Progress

- Design fixed from user instructions; no additional approval needed for reversible implementation.
- Existing clean checkout reused on feat/world-deep-dives; base 697918f71e583db50128e50864ca2d61d5896f7c.
- Research and guide implementation in progress.

## User additions during implementation

- Dedicated Hadrian's Wall and Stonehenge guides (Europe research completed).
- Scotland standing stones hub, Orkney, Shetland, Calanais and Kilmartin landscape guides (research in progress).
- Tibet and the Dalai Lama institution, reincarnation recognition, government and ordinary lives; changing political relationships, and clearly dated post-1934 exile continuation. Correct destination: India in 1959, not Nepal. Do not adopt the user's categorical sovereignty assertion as settled history (research in progress).
- Hindu and Muslim histories in South Asia, with period-specific interaction, patronage and conflict and a clearly separated Partition continuation (research in progress).
- Buddhist temple/monastery networks across Asia; linked Confucian traditions, education and government guide. Both begin in the first millennium BCE, not just recent history (research queued).
- Mesopotamia and clay-tablet writing, including cities, administration, ordinary lives and decipherment (research queued).
- Rosetta Stone: decree, scripts, discovery, decipherment, ownership history and broader Egyptian writing (research queued).
- Egyptian writing now has its own guide, with many entertaining translated texts, linked to Rosetta.
- User expanded the language request to a large collection of ordinary and unusual ancient texts: receipts, animal sales, complaints, debts, deliveries, household correspondence. Pair originals (artifact image or verified original-script text) with sourced translations, explicitly mark excerpts/restorations/transliterations, verify image and translation rights, and include supported American examples. Aim at least sixty distinct well-supported examples rather than padding repeated records. Research and rendering in progress.
- Dead Sea Scrolls explicitly required in this first round; authored guide includes Qumran and later documentary archives, with discovery/modern research separate from manuscript dates.
- Final user instruction: **one combined deployment, then stop for review before starting the next round**. Do not publish incremental feature releases or automatically begin another expansion after deployment.

## Implementation status

- Separate per-region guide JSON files, shared validation and renderer, regional guide navigation and full-text-free index added.
- Modern 3,600-pixel terrain preparation running; Natural Earth generalized river reference prepared. Historical archaeological plans linked with institutional attribution.
- Canonical voyage cross-links: 58 Europe, 15 Africa and 41 Asia–Pacific itineraries, with 251 dated regional anchors. One voyage may belong to several collections; these are not new voyages. Direct #voyage/<id> navigation added and awaiting browser verification.
- Focused guide and atlas tests pass on current content; final aggregate, independent review, full build/browser checks and release gate still pending.

## Integrated release candidate

- All 41 guides and 87 writing pairs authored, source reviewed and integrated. Modern terrain: 168 frames across existing and new guides.
- Core and corpus reviews resolved voyage-loading, stop-order/membership, bounds, crowded labels, image quality, passage alignment, rights metadata, original-language tags, narrow-phone controls and reciprocal Americas links.
- Focused browser pass verifies regional guide navigation, full-area maps, 87 searchable pairs, all 18 images and both script fonts. Final aggregate release gate follows these fixes.
- User-authorized single publication remains the final step; no next-round expansion starts automatically.

## Completed publication

PR 28 merged the combined v0.30.0 release. All 62 verification phases completed with 466 unit tests; the directory mouse test now scrolls its target into view. The final merged package passed guide/browser and extracted self-host checks again. The deployed release passed 430 public asset comparisons, 48 source reviews, three neighboring-page checks, live world-guide/writing/voyage browser tests, and five Linux retention tests. Current v0.30.0 and rollback v0.29.0 are retained; temporary uploads were removed. The versioned deployment receipt records the exact commit and artifact hashes. This round is complete; stop for user review before new expansion.
