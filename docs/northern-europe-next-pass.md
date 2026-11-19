# Northern Europe — release review and next research pass

This batch was developed on `feat/northern-europe-1900`. After an initial local hold, the user explicitly authorized publishing it as the next release. Version 0.31.0 establishes this playable northern beginning; the next research pass remains a proposal to review separately.

## What this batch establishes

- Ordinary map timelines end in 1900 inclusive; the Hawaiʻi statehood topic retains 1959. Historical source records and later research/discovery dates are retained rather than rewritten.
- Europe has its own playable clock, date controls, camera and selection. Americas retains its independent state when switching maps.
- Initial research includes Norway, Finland, Sweden, Denmark, Sápmi, Svalbard, England, Wales, Scotland and its islands, Ireland, Northern Ireland as a modern navigation area, Iceland, Greenland and the Faroes. Modern region names do not define ancient polities.
- The first collection contains 396 dated entries, including 75 additional warfare entries. Six Nordic, six British/Irish and three Arctic guides support the regional movie. Separate guides cover the Picts, Ötzi, other cold-preserved people and the Andean summit children.
- There are 362 dated political geometry versions, with source-row provenance and nine explicit coverage gaps. Reconstructed territories, shared crowns, and settlement districts use different styles. A border describes the cited authority, not the distribution of a people or proof of uniform control.
- Roads, railways, trade and journeys are distinct. Earlier recorded infrastructure can remain as construction history, with continued service unproven. Comparable London and Dublin census observations can interpolate for display, explicitly labeled and never extrapolated. Other population observations remain snapshots.
- Full-area modern terrain supports each guide; institutional historical plans remain separately identified. Six licensed photographs illustrate the three cold-preservation guides. None of the new mummy studies adds a new playable event merely because a body was discovered recently.

The generated `data/atlases/europe/coverage-audit.json` is the current region/era coverage inventory. Counts measure research, not the intensity of history or the number of people.

Research decisions are preserved in the [Arctic chronology review](research/northern-europe/arctic-review.md), [warfare and Picts notes](research/northern-europe/warfare-and-picts.md), and [cold-preserved people notes](research/northern-europe/cold-preserved-people.md). The exact six bundled photographs and their credits are registered in `data/world-guide-media.json`; the research notes also retain additional image candidates for later consideration.

## Review before extending south

1. Watch a northern region from its earliest date, then use the medieval and railway-era jumps. Inspect whether the current evidence explains the places rather than presenting only counts.
2. Compare political outlines at 1603, 1707, 1801, 1809/1812, 1814 and 1864. Shared crowns must remain distinct from merged institutions, legal claims and actual territorial control.
3. Compare Norse movement, trading connections, raids and settlement. A raid does not by itself establish a colony; an imported object does not prove a direct voyage from its source.
4. Read the Picts and Scottish warfare together. The Pictish-to-Alba transition is not a supported story of an entire population disappearing, and later Scottish conflicts cannot be reduced to Scots against English.
5. Inspect Greenland’s distinct Inuit and Norse histories. The Western and Eastern Norse abandonment anchors are approximate. Iceland’s population continues; 1900 does not signify abandonment anywhere.
6. Check town-size readability and the difference between observed census years, interpolated years and unknown counts. The dots use a logarithmic scale; grouped map symbols are not summed populations.

## Priority gaps within the current northern area

**Political geography:** Scottish and Welsh regional lordships, Irish kingdoms and crown claims, contested Scandinavian frontiers, and Sámi overlapping taxation/movement require more detailed sources. The current union exteriors do not replace internal jurisdictions. The rejected southern Greenland source polygon missed the Kujataa core; a documented Eastern Settlement reconstruction is a priority. First-century Roman control remains deliberately omitted where the source geometry was misleading.

**Everyday settlement and economy:** Add local farming, fishing, harbour, market and household evidence outside the best-known towns. Iceland is still concentrated around Reykjavík, Þingvellir, Skálholt and Hólar; Faroese late-medieval community coverage is thin. Greenland’s coastal and interior archaeological gaps need regional datasets, not generic continuity bars.

**Transport:** Expand documented road and rail segments, opening and closure phases, ports and river corridors. Prioritize route maps and operating records over straight-line assumptions. Connect goods to supported source/destination evidence, and distinguish migration and coerced transport from commercial exchange.

**Population:** Add comparable census series for more towns. Record the counted area, annexations and alternative estimates before enabling interpolation. Ancient town-size estimates need their own methods and uncertainty; built area is not automatically a resident count.

**Warfare:** The new catalogue is substantial selected coverage, not every recorded conflict. Extend campaign phases and civilian effects using battlefield inventories, siege archaeology, annals and administrative sources. Do not draw an army’s exact path when the sources only establish two dated localities. Casualties and force sizes require independently qualified estimates.

## Proposed next geography

First close the most consequential northern gaps above. Then extend the same evidence model south through the southern Baltic, northern Germany and the Low Countries, followed by France. These areas connect directly to the trade, migration and warfare already visible and provide a manageable test of denser overlapping jurisdictions. Italy and the Mediterranean can follow, with the existing Roman guides supporting—but not substituting for—dated territorial research.

Keep the four atlas destinations in this repository. Shared renderer, time policy, guides and source registration should remain common; regional evidence files and historical geometry imports remain separately owned. Each agreed batch should become a reviewed, verified release. Publishing this northern beginning does not authorize starting all proposed southern regions automatically.
