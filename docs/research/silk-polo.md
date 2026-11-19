# Marco Polo and Silk Roads: research and data audit

Prepared 2026-11-18. This is a source and modelling note for the two guides and their playable study data, not an exhaustive history.

## Deliverables and scope

- `data/world/silk-polo.json`: 36 evidence records, 10 schematic connections, 41 source records and two studies. Shared taxon `homo-sapiens` is supplied elsewhere.
- `data/atlases/asia-pacific/silk-polo-deep-dives.json`: two subject guides, seven sections each, with 17 and 19 matching map points respectively.
- Marco Polo study: 1254–1324 CE, mainly journey evidence from 1271–1295, plus the book's composition context.
- Silk Roads study: 200 BCE–1500 CE; selected archaeological phases and documents, not a universal chronology of exchange.
- No population counts or territorial polygons were added. None of the reviewed sources established a sufficiently defensible settlement population series for this dataset.

## Dating and map decisions

All numeric dates use astronomical integer years. A calendar BCE date becomes `1 - BCE`: Weiyang's 200 BCE anchor is −199; the approximately 150 BCE founding anchor for Sirkap is −149. CE dates are unchanged.

Sirkap's original date is “mid-second century BCE.” Its single-year anchor is explicitly an approximate display convention, not a precise foundation. Other archaeological intervals identify selected phases, not the whole lifespan of a settlement. Rounded century boundaries and Mogao's 1400 endpoint are explained in `dateBasis` or `limits`.

Polo's chapter sequence is not a day-by-day itinerary. Most outward points share the broad 1271–1275 window; court-related descriptions use a broad Yuan-period window. The account's approximate composition date is used for the secondhand Japan point. It is not evidence of occupation or a visit in 1298.

Published return chronologies differ. The Hormuz endpoint and maritime phase use 1293–1295 and 1291–1295 respectively. This intentionally permits overlap with the western return phase. It does not imply that the travellers were simultaneously in both regions.

Coordinates are approximate locality anchors in [longitude, latitude] order. Official UNESCO component coordinates inform Shangdu, Quanzhou and several Silk Roads settlements. Other coordinates represent familiar city or region locations, not surveyed excavation boundaries. Old Hormuz is placed on the mainland near Minab, with location uncertainty retained.

All lines are schematic connections. Offshore bends prevent a crude line through continental interiors but do not identify vessel tracks. Intermediate land bends likewise do not establish undocumented visits, camps or exact roads. The Pegolotti connection includes Qinsai before Khanbaliq because that sequence appears in the handbook.

## Polo: evidence distinctions

The primary-text basis is the NII Digital Silk Road edition of [Moule and Pelliot's Description of the World](https://dsr.nii.ac.jp/toyobunko/III-2-F-c-39/), supplemented by critical geographical commentary and institutional catalogues. Readable OCR or indexed passages were consulted; not every page image or manuscript witness was inspected.

- The [Venice/Acre prologue](https://dsr.nii.ac.jp/toyobunko/III-2-F-c-39/V-1/page/0089.html.en) separates Marco's departure from his relatives' earlier journey.
- The [homeward prologue](https://dsr.nii.ac.jp/toyobunko/III-2-F-c-39/V-1/page/0101.html.en) names Trebizond, Constantinople and Negroponte and dates the Venice return to 1295.
- Kashgar is labelled as a place described in the outward sequence. Hangzhou is a described city with an uncertain visit date. Neither marker claims independent confirmation of a specific arrival.
- [Ca' Foscari's Quinsai commentary](https://risorse-esterne.edizionicafoscari.it/lemmi/Quinsai.html) informs the treatment of variant descriptions and unaccepted numerical claims.
- Japan has no journey line. Sonia Favi's 2018 article, *Production and Circulation of Vernacular Italian Books Related to the Jesuit Mission in Japan in the Sixteenth Century*, discusses the secondhand character of Polo's information.
- [Hormuz in Yuan and Ming sources](https://www.persee.fr/doc/befeo_0336-1519_2001_num_88_1_3509) supports the mainland geographical setting.
- The [porcelain study](https://doi.org/10.1017/eaa.2017.21) is presented as an archaeological argument, not a proven ownership chain or a route log.

The guides do not adopt claims of an established Yangzhou governorship, a visit to every place in the book, or a recoverable original text. They distinguish the narrative's first-person weather-delay passage from later historians' differing reconstruction of the return.

## Silk Roads: selected evidence

The [Chang'an–Tianshan corridor](https://whc.unesco.org/en/list/1442/) and [Zarafshan–Karakum committee statement](https://whc.unesco.org/en/decisions/8394) establish network settings and broad phases. Individual settlement and monument dates come from separate records, not automatically from the overall corridor date.

Three university-hosted primary corpora add different kinds of dated evidence:

- [T. Burrow's Kharosthi document translations](https://depts.washington.edu/silkroad/texts/niyadocts.html): approximately 235–325 CE; documents are not the complete chronology of Niya.
- [Sogdian Ancient Letters](https://depts.washington.edu/silkroad/texts/sogdlet.html): scholarly date around 313–314; communications, trade and household hardship.
- [Pegolotti's handbook](https://depts.washington.edu/silkroad/texts/pegol.html): about 1340; practical route instructions, not the author's own Asian expedition.

The [Periplus](https://depts.washington.edu/silkroad/texts/periplus/periplus.html) supplies a separate first-century maritime scene. Its displayed 50–100 CE range is a broad textual context, not the foundation or abandonment of Berenike, Cana or Barygaza. Institutional archaeology anchors Palmyra, Taxila, Mogao, Penjikent, Suyab, Balasagun, Bukhara, Merv, Samarkand and Quanzhou.

## Access and verification

Each World source records its access scope. Some institutional pages and journal PDFs were available only as indexed passages; these are labelled accordingly. The Library of Congress catalogue was verified through indexed text after direct access failed; its manuscript was not inspected. The NII service intermittently returned 403 errors. Full-book or full-article access is never claimed from a search excerpt.

A final metadata check corrected the Niya translation credit to T. Burrow and the complete title of Favi's Japan article. Modern translations and scholarly commentary are paraphrased; no extended quotation or reproduced historical map is included.

The guide `referenceMaps` link to UNESCO's map indexes, which describe present heritage properties. They are not labelled as contemporary travel maps or reconstructions of ethnic boundaries.

## Validation and remaining gaps

Validated both guides with `validateWorldGuides`. Validated the shard with `validateWorldData` using a transient stand-in for the shared taxon. Checked all 30 connection start/end/after-end cases, study interval containment, matching map/evidence IDs, matching coordinates and date labels, safe URLs and source membership.

No build, commit or deployment was performed by this task. Terrain images and integration into the combined runtime belong to the parent task.

Remaining limitations are substantive: more Persian, Chinese, Arabic and regional-language sources would improve balance; precise Polo stop dates remain unrecoverable in many cases; medieval place-name identifications vary; the 19 Silk Roads points are a deliberate selection rather than an inventory of Eurasian trade. The selected sources do not justify numerical traffic flows, population bubbles or comprehensive territorial boundaries.
