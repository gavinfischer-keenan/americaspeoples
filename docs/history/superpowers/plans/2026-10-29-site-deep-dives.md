# Site deep dives and natural events implementation plan

**Goal:** Publish individually sourced complex/site pages and make them discoverable from atlas records; combine physical disasters in a master map control.

**Architecture:** Keep the existing TypeScript atlas and server catalog. A small explicit site registry maps stable record IDs to static deep-dive pages; detailed content loads only on navigation. Never match affiliations or locations using broad title substrings. Preserve the existing physical-event API and chronology, applying a derived hidden-category set for the master switch.

**Approaches:** Selected implementation choice: static source-linked pages plus explicit registry, preserving lightweight map loading. Bundling long reports into every map load is wasteful. A new content-management service is unnecessary for this first collection.

**Constraints:** Consensus DEEP queries run strictly sequentially. Archive complete reports privately, byte-for-byte with citation markers. Publish clearly labelled research reviews with access limits; verified atlas evidence remains distinct. Do not invent building dates, resident counts, coordinates, roads or ethnicity/language assignments. No 3D model is supplied or promised in this release.

## Tasks

- [x] Test explicit stable-ID page resolution, no matches for unrelated records, and no arbitrary URLs.
- [x] Implement `src/site-guides.ts` registry lookup; add site guide badge to map/list and link in selected details/full review. Add an index linked in main navigation. Use static pages for detailed tables and cited report material.
- [x] Test master natural-event switch preserves individual preferences and leaves ENSO/climate enabled.
- [x] Implement `effectiveClimateHidden(hidden, showNaturalEvents)` in `physical-rules.ts`; use it consistently for map symbols, selected event count and playback index; add accessible master checkbox.
- [x] Complete sequential research collection: Four Corners, Inca, Maya, Cahokia, Pacific complexes. Preserve original reports and expose their citation-rich text with clear research status and limits; provide focused pages for individual major complexes.
- [x] Add primary park/heritage/excavation sources for missing site-specific facts. Match guide registry to existing mapped IDs only where the page actually covers the site.
- [x] Run unit/type/build checks, browser navigation and event-toggle tests, release checks. Publish atomically and verify public routes, report links and neighboring apps.

## Review focus

1. Multiple records at one site must all retain their original identity and evidence chronology.
2. A master switch must not reset a user's hidden individual hazard choices.
3. Static report links must survive direct opening/refresh and use properly escaped content.
4. Research-synthesis dates must not silently become source-checked map occupations.
5. Page availability must be discoverable by keyboard and independent of color alone.
