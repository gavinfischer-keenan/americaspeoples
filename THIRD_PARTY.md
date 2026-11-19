# Third party notices

## GeoNames geographic references

Selected modern locality coordinates in the Borneo/Brunei, Cebu/Philippines, Timor and New Guinea additions come from public GeoNames country extracts. Credit: **GeoNames**, [data exports](https://www.geonames.org/export/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The [gazetteer readme](https://download.geonames.org/export/dump/readme.txt) states that license. Feature identifiers and source URLs remain in each applicable record’s geographic provenance. Coordinates are rounded for public display; they are reference anchors, not surveyed ancient boundaries. Historical claims and dates have separate sources. These geographic references retain CC BY 4.0, independently of the atlas’s noncommercial terms. License checked 17 November 2026.

## Modern locality references

Selected modern town/village coordinates were checked against OpenStreetMap through Nominatim. These references are credited in each affected location's provenance and on the map: © OpenStreetMap contributors, [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/). See [OpenStreetMap copyright and attribution](https://www.openstreetmap.org/copyright).

OpenStreetMap-derived geographic references retain those terms; the atlas's noncommercial terms do not replace them. Historical dates, claims and original educational summaries have independent sources and the atlas's content terms. These references do not make OSM a source for historical settlement boundaries. No OSM tiles are served and no visitor geocoding requests are sent.

## Self-hosted topographic relief

`data/terrain/natural-earth-relief.webp` is derived from Natural Earth II, 1:50 m shaded relief (10800 × 5400). Source: https://www.naturalearthdata.com/downloads/50 m-raster-data/50 m-natural-earth-2/ and https://naciscdn.org/naturalearth/50 m/raster/NE2_50M_SR.zip. Natural Earth material is public domain: https://www.naturalearthdata.com/about/terms-of-use/.

The Hawaiian Islands, Four Corners, Chaco, Mesa Verde and Hovenweep rasters are derived from the USGS National Map 3DEP elevation service, using its Hillshade Gray rendering: https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer. USGS-produced elevation material is public domain. Exact requests, extents, image sizes and hashes are recorded in `data/terrain/sources.json`; `scripts/prepare-terrain.py` reproduces the assets with Pillow. These are modern terrain references, not ancient shorelines, vegetation or historical reconstructions. No visitor requests go to an outside map/tile service.

These public-domain assets remain public domain; the atlas's noncommercial licenses do not restrict their independent reuse.

## Archaeological place references

The 0.10 additions use factual coordinates from NPS NPMap public archaeological point features, USGS GNIS, official INAH site metadata, Georgia DNR and UNESCO property reference coordinates. Each record states the source and distinguishes a building/site locator from a regional or visitor reference. No third-party photographs, floor plans, reconstructed building meshes or descriptive essays have been copied into these additions. Original summaries and curation follow the atlas content license; underlying facts remain unrestricted. UNESCO's descriptions have their own CC BY-SA IGO 3.0 terms and are linked, not republished as atlas prose.

## Natural Earth land geometry

Public domain generalized land geometry from https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson, retrieved 2026-10-28. Terms: https://www.naturalearthdata.com/about/terms-of-use/. Modern reference coastlines only. Original file is stored in data/land.geojson; dependency/network access is unnecessary at runtime.

## Natural Earth rivers and lake centerlines

The regional guide basemaps use a generalized modern drainage and lake-centerline dataset at 1:10,000,000. The bundled GeoJSON preserves all 1,455 source line geometries and reduces each feature’s attributes to its English name. Natural Earth places the source geometry in the public domain. [Original GeoJSON](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_rivers_lake_centerlines.geojson) · [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/) · [Asset and upstream hashes](https://github.com/gavinfischer-keenan/americaspeoples/blob/refs/tags/v0.30.0/data/world-guide-context-sources.json).

## Noto fonts for original-script texts

Noto Sans Cuneiform Regular and Noto Sans Coptic Regular are copyright 2022 The Noto Project Authors and licensed under the SIL Open Font License 1.1. The font binaries and complete license texts are bundled together and match the Google Fonts distributions byte for byte. [Cuneiform license](https://github.com/gavinfischer-keenan/americaspeoples/blob/refs/tags/v0.30.0/data/writing-media/NotoSansCuneiform-OFL.txt) · [Coptic license](https://github.com/gavinfischer-keenan/americaspeoples/blob/refs/tags/v0.30.0/data/writing-media/NotoSansCoptic-OFL.txt) · [Upstream files and SHA-256](https://github.com/gavinfischer-keenan/americaspeoples/blob/refs/tags/v0.30.0/data/world-guide-context-sources.json).

## Historical writing witnesses and English readings

Each object record credits the original artifact or scholarly transcription and carries its own source and rights. The bundled original-image records also give the creator, image source, local file, dimensions, and SHA-256. English translations credit their edition and translator, identify the extent included, and retain their own terms or excerpt notice. Reuse is governed by those item-level rights. [Writing corpus records](https://github.com/gavinfischer-keenan/americaspeoples/tree/refs/tags/v0.30.0/data/writing-examples) · [Collection method](docs/world-deep-dives.md#everyday-writing).

## d3-geo

The ice display also uses d3-contour 4.0.2, Copyright 2012–2023 Mike Bostock, under the following ISC permission and disclaimer (also retained in the dependency's LICENSE).

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.

Copyright 2010-2024 Mike Bostock

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.

This license applies to GeographicLib, versions 1.12 and later.

Copyright 2008-2012 Charles Karney

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


## d3-array

Copyright 2010-2023 Mike Bostock

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.


## internmap

Copyright 2021 Mike Bostock

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.


## Scholarly sources

Citation metadata and original short explanations are bundled. Referenced publications retain their respective copyrights. No publication PDFs are included. Source access and review limitations are recorded per citation.

## SheetJS Community Edition 0.20.3

Bundled for offline XLSX parsing. Official distribution: https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz

                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "{}"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright (C) 2012-present   SheetJS LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.


## fflate 0.8.3

Bundled for bounded ZIP inspection before workbook parsing.

MIT License

Copyright (c) 2026 Arjun Barrett

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## NADI-1 physical context and hazard catalogs(v0.3.7)

Dalton et al.(2023), North American Deglacial Isochrones1, QSR321:108345, https://doi.org/10.1016/j.quascirev.2023.108345. GIS dataset https://doi.org/10.5281/zenodo.8161764, CC BY 4.0. Modified: simplified WGS84 polygons at 0.12degrees, ring orientation adapted for d3; author minimum/maximum/optimal scenarios preserved. Source dates retain those outlines. Between source dates, the atlas displays explicitly labeled approximate signed-distance interpolation on a 0.25degree grid; this is not part of the authors' reconstruction and is not a glacier-dynamics, sea-ice or open-water model. The public source panel documents the method and both bracketing ages.

Gergis and Fowler(2009), A history of ENSO events since A.D.1525, Climatic Change92:343–387, https://doi.org/10.1007/s10584-008-9476-z. NOAA/WDS data https://doi.org/10.25921/ebpz-a913;1525–1934 subset. Original data fields retained. Investigator attribution and NOAA use constraints apply; no NOAA endorsement.

NOAA/NCEI/WDS Global Historical Tsunami Database, https://doi.org/10.7289/V5PN93H7; paginated source-event extract, geographic subset and dates through 1934. Validity codes and original facts retained. Not a wave/inundation simulation.

Global Volcanism Program,2026, Volcanoes of the World, Smithsonian Institution, compiled by Venzke,E., https://doi.org/10.5479/si.GVP.VOTW5-2026.5.4. Holocene eruption WFS extract; source fields and status retained. Database compilation is a product of US employees; attribution/terms at https://volcano.si.edu/gvp_termsofuse.cfm. No photographs or third-party publication text copied.

NOAA JetStream / Ocean Service guidance for modern major-current and trade-wind schematic arrows: https://www.noaa.gov/jetstream/ocean/circulations/jetstream-max-major-ocean-currents and https://oceanservice.noaa.gov/facts/tradewinds.html. Editorial geometry, not a paleo-reconstruction. ENSO mechanism https://www.noaa.gov/understanding-el-nino.

All data retrieved2026-10-29. Acquisition parameters, hashes, source coverage and limitations are retained in the physical source manifest and in-app source reviews. Scientific dataset facts and paraphrased explanations are distinguished from copyrighted publications.


## Round8 research provenance(v0.3.8)

Scholarly works are linked by DOI with access limitations in each record; short original paraphrases and bibliographic metadata are supplied, not article figures or full text. User-provided Consensus reports remain in a private archive. The Gemini Argon colonial registry is author-supplied AI-generated material, explicitly labelled in titles, claims, source access notes and the public report. This attribution does not imply verification or endorsement by any model provider. Conflicting population series are excluded. See docs/round8-synthesis.html and docs/colonial-ai-registry.html.

## NOAA/NCEI historical earthquake catalog

The Significant Earthquake Database (DOI 10.7289/V5TD9V7K) is credited in the physical-source catalog. The standalone scripts/fetch-earthquakes.py importer freezes 34 API pages with SHA-256 hashes, preserves original fields, and applies the documented geographic/time selection. The 1,580 selected epicenters are not damage footprints or an exhaustive earthquake chronology. See data/physical-sources/noaa-earthquake-import.json for provenance and limitations.
# Historical geography and research additions (v0.9.0)

Original software and educational material have separate scopes in LICENSE.md. Nothing in those licenses removes the rights or restrictions below. Public-domain material remains public domain. Third-party software retains its original licenses.

- **Werner Stangl, HGIS de las Indias**: Spanish provinces, principal divisions, and foreign colonial claims from the official feature service, restricted here to 1701–1808. CC BY-NC-SA 4.0, https://creativecommons.org/licenses/by-nc-sa/4.0/. Source: https://www.hgis-indias.net and service license metadata https://www.arcgis.com/home/item.html?id=c79002d305f74820b27be4233e2d0d76. Modified by filtering dates, simplifying at 0.015 degrees, rounding coordinates, reorienting rings, adding display anchors and original explanatory notes. These derivatives retain CC BY-NC-SA 4.0. See expanded-boundary-sources.json for source layers and hashes. No endorsement implied.
- **Schvitz, Rüegger, Girardin, Cederman, Weidmann and Gleditsch, CShapes 2.0**: https://icr.ethz.ch/data/cshapes/. CC BY-NC-SA 4.0. Citation: “Mapping the International System, 1886–2017: The CShapes 2.0 Dataset,” Journal of Conflict Resolution 66(1), 144–161 (2022). Modified by date/geographic selection, study-region clipping, simplification, ring orientation and documented display labels; derivative remains CC BY-NC-SA 4.0. National/dependency geometry is not proof of actual control or Indigenous land tenure.
- **Seshat Global History Databank, Cliopatria**: https://github.com/Seshat-Global-History-Databank/cliopatria; dataset license CC BY 4.0, https://creativecommons.org/licenses/by/4.0/. Scholarly description https://www.nature.com/articles/s41597-025-04516-9. Original data remains available under its own terms. Selected American components, date clipping, simplified geometry and documented label/chronology corrections are described in early-national-boundary-sources.json and docs/early-national-boundary-source-decisions.md. Original source row metadata and pinned archive hash are retained. No endorsement implied.
- **Newberry Library, Atlas of Historical County Boundaries**: https://publications.newberry.org/ahcb/pages/United_States.html. The current reuse notice permits any lawful purpose, commercial or noncommercial, and supersedes the old license bundled in the archive: https://publications.newberry.org/ahcb/downloads/states.html. State/territorial versions selected through 1934, proposed Deseret omitted, generalized source geometry rounded and reoriented. Dates and source citations retained in historical-boundaries.json.
- **Natural Earth 1:10 million land, version 5.1.1**: https://www.naturalearthdata.com/downloads/10 m-physical-vectors/10 m-land/; public domain. Present-day reference coastlines simplified at 0.005 degrees and reoriented for spherical display. No ancient shoreline reconstruction or navigational accuracy claimed.
- **Jeremy Atack, Historical Geographic Information Systems database of U.S. Railroads, 1826–1911**, revised 31 October 2023: https://my.vanderbilt.edu/jeremyatack/data-downloads/. Archive XML permits free use with source acknowledgment. The atlas groups 76,849 source features into 1,755 display groups, uses opening dates where supplied and otherwise first map attestations, and simplifies geometry. The source includes four later 1912/1916 features. Accumulation records construction/attestation, not ongoing service. Source archive, documentation, original dating fields and limitations are recorded in rail-network.json and scripts/prepare-rail-network.py. This dataset is not presented as project-owned material.
- **Historical reservation reconstructions**: original approximate geometry derived from public-domain treaties, executive orders and statutes, cited in reservation-boundary-sources.json. No modern tribal GIS layer is copied. Tribal institutional explanatory pages are cited, not relicensed. The original reconstructions follow the project's educational-content license to the extent copyright applies; underlying legal facts remain unrestricted.
- **Primary historical and archaeological sources**: new records contain original summaries and source metadata, not copied paper text, figures, maps, or photographs. Access notes distinguish actual source access and limitations. A citation does not transfer a publication's copyright.

**Consensus publication practice:** private research reports and raw responses are excluded from new public packages pending a verified redistribution grant. Public legacy report paths now contain short access notices and source links. Consensus Terms of Service: https://consensus.app/home/terms-of-service/, reviewed 2026-11-15. A subscription is not treated as permission to relicense source papers or entire generated reports. Older repository history and prior deployed releases may still contain earlier reports; replacing current files does not erase those copies or revoke prior lawful grants.


## v0.11 city, encounter and language additions

- CWSAC structured transcription by Jeffrey B. Arnold and contributors: BSD-3-Clause. The full notice is retained in `licenses/acw-battle-data-BSD-3-Clause.txt`, including in the self-host package. NPS ABPP study-area geography is a U.S. federal public source, collapsed to locality points with the transformation stated per record; study areas are not tactical boundaries.
- Selected Glottolog classification facts: Hammarström, Forkel, Haspelmath and Bank, Glottolog / glottolog-cldf, consulted November 2026, https://glottolog.org/ and https://github.com/glottolog/glottolog-cldf. Licensed CC BY 4.0: https://creativecommons.org/licenses/by/4.0/. Atlas changes: selected families/members, omitted intermediate branches, alternative reader-facing labels, and explanatory prose. No modern coordinate layer is used as an ancient language map. Upstream attribution and permissions remain effective.
- INAH and SIC: original factual site summaries and public location references, with chronology separately checked. INAH's page/media notice is CC BY-NC-ND 4.0; no source images, copied pages, adapted plans or artworks are included. The SIC directory was not wholesale republished or presumed to share a license from a different portal. Its placeholder dates were rejected.
- The 2014 Cusco draft document supplies factual city-reference vertices for Machu Picchu. No page image or plan is redistributed, and no enacted regulation or exclusive boundary right is asserted.
- Research papers, institutional archives and community sources remain citations, not bundled reports or licensed image collections. The Amah Mutsun community language page is credited for its account of the early Mutsun vocabulary. No claim of scholarly or community endorsement is made.
- Consensus outputs from the two new Deep runs remain private. New records contain independently written claims with underlying scientific or documentary sources. No complete generated report or borrowed quotation is shipped.

See `docs/cities-conflicts-coverage.md` for exact coverage and unresolved cases. Project noncommercial terms apply to original protected contributions; they do not revoke more permissive rights in upstream components or create copyright in facts.


Pacific topic expansion (v0.12): original factual syntheses cite the papers and historical sources listed in docs/pacific-topic-dives.md and each evidence record. No paper text, figures or generated Consensus report is distributed. The queue is original editorial planning, not a third-party dataset. Existing licenses remain unchanged.


## Community history topics (v0.13)

New records and chapter text are original factual summaries. Mohawk chronology cites Manning, Lorentzen and Hart (2021), https://doi.org/10.1371/journal.pone.0258555; Isla del Tesoro cites Lombardo et al. (2013), https://doi.org/10.1371/journal.pone.0072746. Both publications are CC BY; no article text, figures, photographs or maps are reproduced.

Cotoca and Landívar public coordinate facts come from Supplementary Table 1 of Prümers et al. (2022), https://doi.org/10.1038/s41586-022-04780-4, under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). The atlas transforms WGS84 UTM zone 20S coordinates to longitude/latitude and rounds them to two decimals, with approximately 1 km location precision. The regional cultural phase is distinguished from direct dates for every building. These source permissions remain effective; no source figures or site plans are bundled.

Onondaga, Ganondagan and Garifuna community accounts, archival treaty scans, government archives and collection guides are individually attributed in records and docs/community-topic-dives.md. Citations do not relicense their publications, imagery or cultural knowledge. The Dutch National Archives emancipation-register index (CC BY-SA 3.0) is not copied or republished; only the documented emancipation date and archive coverage limitations are summarized. No source claims endorsement of this atlas.

The new Consensus Deep dossier remains private. No generated report, long quotation or bulk source dataset was added to the public package. Project licenses cover original protected contributions; they do not create ownership over facts or remove upstream permissions.

### New locality references in v0.17

Uripiv uses the [GeoNames Uripiv Island reference](https://www.geonames.org/2134451/uripiv-island.html), credited to GeoNames under its [attribution terms](https://www.geonames.org/about.html). Named Peruvian archaeological places and the coarse Nimowa island setting use independently checked OpenStreetMap references credited in each location provenance field; OpenStreetMap data retains its existing ODbL terms. No source maps, figures, photographs or raw research reports are redistributed. Sangay/Huapula, Kilamope, Lake Cormorán and Pernil Alto reference the public archaeological inventory or original study listed in their records.


### Dedicated-study references in v0.18–0.19

The new guides use original factual summaries and individually linked sources. Public archaeological and town references are distinguished from surveyed buildings. No paper figures, institutional photographs, source plans or raw Consensus output are redistributed. Existing more permissive upstream terms remain effective.

Additional GeoNames references for Nukuleka and Tahiti are credited in their location provenance under [GeoNames attribution terms](https://www.geonames.org/about.html). The five additional Glottolog examples retain the classification attribution above; modern catalog positions are not historical language distributions. Nan Madol uses UNESCO's public property reference; its descriptive source text is linked rather than copied.

Cerrito, Salvatierra and Santa María use further coordinate facts from Prümers et al. (2022), Supplementary Table 1, [CC BY 4.0](https://doi.org/10.1038/s41586-022-04780-4). These are transformed from WGS84 UTM 20S into longitude/latitude and rounded to 0.001°, approximately 100 m; they locate public site references, not buildings or excavation units. Other sources and their geographic transformations are recorded per observation.

Carrington geographic context is cross-checked against Penny Edmonds’ *Humanitarians in the Antipodes: Travelling Under Concern*, contributed by Heidi Ing to [TLCMap layer 2012](https://tlcmap.org/index.php/layers/2012), entry td3dd2. Only an independently described public locality reference is used; the layer, narrative, map and media are not redistributed. Its 1836 travel date does not replace the company-settlement chronology.
### Archaeological local studies in v0.20

New factual summaries cite the original archaeological reports, National Park Service and Crow Canyon publications, SPARC Salmon/Aztec material, and community-authored histories listed in each record and guide. Public feature anchors drawn from OpenStreetMap retain attribution to OpenStreetMap contributors and the existing ODbL terms. Source plans are used to check named positions; their images, map tiles, photographs and full reports are not redistributed. No claim of community or institutional endorsement is made.

The two new Consensus Deep reports remain private. Published chapter text and claims are independently authored; the underlying evidence sources are linked. Project noncommercial terms do not remove upstream permissions or create copyright in historical or geographic facts.


### Labeled place-guide terrain in v0.20

The 35 guide relief images are derived from Mapzen/Tilezen Terrain Tiles, https://registry.opendata.aws/terrain-tiles/, retrieved 2026-11-17. Source attribution and terms: https://github.com/tilezen/joerd/blob/master/docs/attribution.md. Providers relevant to this geographic coverage include USGS 3DEP, SRTM and GMTED2010, NOAA ETOPO1, INEGI's 2016 continental relief data, and © Commonwealth of Australia (Geoscience Australia) 2017 under CC BY 4.0. These are mixed upstream terms, not a blanket public-domain claim. Full source-provider credit remains at the linked attribution page; the source manifest records each tile URL, hash, map bounds and transformation.

Processing decodes Terrarium elevations, resamples into registered Web Mercator rectangles, and draws shaded relief and elevation contours. The project does not claim ownership of source elevation facts or restrict rights already granted by their providers. Modern terrain is not an archaeological excavation plan. Building labels use the independently credited public feature anchors in atlas records; no third-party archaeological plan images are reproduced.

## Guide photographs and independently authored reading material

Original guide narratives are independently authored from their cited evidence and retain the project’s educational-content license. Wikipedia articles and institutional essays are linked for further reading, not copied. The photographs below retain their own terms; **the atlas’s noncommercial restriction does not apply to these photographs**. Each public caption also supplies the creator, source, license and changes.

| Local asset | Creator / original copyright | Source and separate rights | Changes |
| --- | --- | --- | --- |
| `data/guide-media/pueblo-bonito-east.jpg` | Joekoz451. Public-domain dedication or expired copyright; see the item’s rights evidence. | [Pueblo Bonito seen from the east](https://commons.wikimedia.org/wiki/File:PuebloBonito2006.JPG) · [Public domain](https://commons.wikimedia.org/wiki/File:PuebloBonito2006.JPG#Summary) | None; original JPEG copied without cropping, retouching or recompression. |
| `data/guide-media/nan-madol-stonework.jpg` | CT Snow. Copyright retained by CT Snow. | [Nan Madol ruins in Pohnpei](https://commons.wikimedia.org/wiki/File:Nan_Madol_5.jpg) · [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | Wikimedia-generated 960-pixel preview; no local cropping or retouching. |
| `data/guide-media/machu-picchu-landscape.jpg` | Sasha India. Copyright retained by Sasha India. | [Machu Picchu, Peru](https://commons.wikimedia.org/wiki/File:Machu_Picchu,_Peru_(36130383073).jpg) · [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | Wikimedia-generated 960-pixel preview; no local cropping or retouching. |
| `data/guide-media/yap-rai-modern.jpg` | David Weekly. Copyright retained by David Weekly. | [“fei” = Yap Stone Money (2008)](https://commons.wikimedia.org/wiki/File:%22fei%22_=_Yap_Stone_Money_(2849026175).jpg) · [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | Wikimedia-generated 960-pixel JPEG preview; no local cropping or retouching. |
| `data/guide-media/palau-stone-quarry.jpg` | Elisabeth Krämer-Bannow. Public-domain dedication or expired copyright; see the item’s rights evidence. | [Scaffolding for cutting stone money in Palau, 1910](https://commons.wikimedia.org/wiki/File:Palaos,_%C3%89chafaudage_pour_tailler_la_monnaie_de_pierre,_Die_Hamburger_S%C3%BCdsee-Expedition_1908-1910.tif) · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | Wikimedia-generated 960-pixel JPEG preview; no local cropping or retouching. |
| `data/guide-media/mesa-verde-cliff-palace.jpg` | Lisa Redfern / Lisafern. Public-domain dedication or expired copyright; see the item’s rights evidence. | [Mesa Verde: Cliff Palace detail](https://commons.wikimedia.org/wiki/File:Mesa_Verde_Public_Domain.jpg) · [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Wikimedia-generated 960-pixel JPEG preview; no local cropping or retouching. |

The Palau quarry photograph is attributed to Elisabeth Krämer-Bannow, photographed during the 1908–1910 Hamburg expedition and published in Wilhelm Müller, *Yap*, in *Ergebnisse der Südsee-Expedition 1908–1910* (Hamburg, 1914). Commons identifies it as public domain under life-plus-70 terms and pre-1931 publication in the United States. The source-page link provides the Hamburg library scan. The photograph is historical evidence of one working setting, not an illustration of every period of quarrying.

The factual provenance, item-level rights evidence, original and downloaded URLs, dimensions, byte counts, checksums, guide placements and verification dates are recorded in `data/guide-media/manifest.json`, published as `sites/guide-media/manifest.json`. The current six-image selection totals 1455575 bytes. No full scholarly reports or raw research-provider responses are redistributed by this feature. See [the guide reuse policy](docs/guide-reuse.md).


## Canada, Aleutian and expanded-guide images

The v0.23.0 village studies add the U.S. Coast Survey's *Chart of Iliuliuk Harbor, Unalashka*, published July 1875 from W. H. Dall's 1871–72 survey, drawn by H. Lindenkohl. The full-sheet library rendition is credited to the American Geographical Society Library, University of Wisconsin–Milwaukee Libraries, item 4677 (am011235). The original federal chart is public domain in the United States. [Library source](https://collections.lib.uwm.edu/digital/collection/agdm/id/4677/) · [Library reuse statement](https://uwm.edu/libraries/digital-collections/copyright-digcoll/) · [17 USC 105](https://uscode.house.gov/us/usc/t17/s105/). No local cropping or retouching was applied. Its independent terms, dimensions and checksum appear in the media manifest. The Amaknak house diagram is original atlas artwork describing cited spatial relationships; no copyrighted excavation figure was copied or traced. The new Consensus report remains private.

The guide-media manifest now includes 31 individually credited photographs and museum-object images. New items retain public-domain, CC0 1.0, or CC BY 2.0/2.5/3.0/4.0 terms as recorded for each file; none is relicensed under the atlas’s noncommercial terms. Creator, source-page, license link, modification statement and verification date appear in `data/guide-media/manifest.json` and beneath each image. Self-hosted copies have recorded dimensions, byte counts and SHA-256 hashes. Referenced Canadian community histories and archaeological research are cited as evidence; no permission to redistribute their original text or illustrations is implied.

## Atlantic Brazil excavation figure

The complete Figure 3 from Colonese and coauthors (2025), *New insights into the formation process and chronology of the Sambaqui Morro do Ouro*, is reused unchanged under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The published caption credits the photographs to the author(s), 2019. [Article, figure and rights notice](https://www.scielo.br/j/bgoeldi/a/FBBPdxrrKkzM9kSczgKBHWh/?lang=en). The separate third-party map in Figure 1 is not included. Creator, source, license, modification statement and checksum are recorded in the guide-media manifest and public caption. This image retains its own license, independently of the atlas’s noncommercial terms.

## Morro Grande funerary vessels

Figure 4 from Buarque, Baumann, Barbosa-Guimarães and Cordeiro (2020), *Entre dois mundos*, credits Angela Buarque (2009b). The complete embedded photograph is extracted unchanged from PDF page 12 (printed page 32). The [article's copyright notice](https://www.revista.sabnet.org/ojs/index.php/sab/article/view/726#license) grants [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); the figure has no separate rights exception. The photograph is not cropped, retouched or recompressed. The guide caption and media manifest preserve its creator, source, license, extraction statement and checksum. These third-party terms remain attached to the image independently of the atlas's original writing.


## Whole-area guide map sheets (v0.27.0)

The 16 source-map assets in `data/guide-maps/` retain the item-level source, creator, rights statement, processing description, dimensions and SHA-256 in `data/guide-maps/manifest.json`, published as `sites/maps/manifest.json`. They include U.S. BLM and NPS public-domain cartography, the public-domain 1912 Machu Picchu/Urubamba survey published in 1913, and credited CC BY 4.0 Casarabe study figures. Public-domain works remain unrestricted; CC BY works retain that license independently of the atlas's noncommercial original text. Historical interpretation and map dates are preserved in captions. Linked reference maps are not redistributed where reuse rights have not been established.

The larger guide relief images use the existing Mapzen/Tilezen terrain source and its provider attribution elsewhere in this notice. Source tile URLs and hashes, Mercator bounds, output pixels, approximate grid sampling and contour intervals are recorded in `data/guide-terrain/sources.json`. These are modern terrain references. A larger output image does not increase the accuracy of the underlying elevation survey.

## Maritime inventories and route-guide maps

Historical loss markers retain publisher field provenance. Original dataset terms remain in force. The atlas does not relicense these sources.

- **shipcatalog-ukho-202610** — Open Government Licence v3.0 [Source](https://datahub.admiralty.co.uk/portal/sharing/rest/content/items/60c0908526b844a68494c038a457e1a7/data). [Licence](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
- **shipcatalog-ireland** — Public inventory accessed 18 November 2026. CC BY 4.0; attribution to National Monuments Service, Government of Ireland. [Source](https://www.archaeology.ie/advice-and-support/locate-a-monument-or-wreck/wreck-viewer/).
- **shipcatalog-wam** — Public inventory accessed 18 November 2026. CC BY 4.0. This spatial subset is smaller than the full museum inventory. [Source](https://catalogue.data.wa.gov.au/dataset/shipwrecks).
- **shipcatalog-michigan** — Public inventory accessed 18 November 2026. Only factual vessel, loss-year and location fields are reproduced; photographs and descriptive prose are excluded. [Source](https://www.michiganpreserves.org/divers-guide/).
- **shipcatalog-farallones** — Public inventory accessed 18 November 2026. US federal government factual inventory; underlying photographs retain their individual credits and are not included. [Source](https://www.arcgis.com/home/item.html?id=83fb39636e48428f915237ec403e859a).
- **shipcatalog-wisconsin** — Public inventory accessed 18 November 2026. Only factual vessel, loss-year and location fields are reproduced; photographs and descriptive prose are excluded. [Source](https://dnr.wisconsin.gov/topic/parks/watertrails).

NOAA Thunder Bay, NOAA Greater Farallones, National Park Service, US Coast Guard and state institutional wreck pages are cited for factual vessel names, loss dates and public locations. No third-party wreck photographs or descriptive catalogue prose are copied. Individually credited exceptions retain their terms.

- **North Atlantic regions in the 1021 dating study** — R. Klaarenbeek, in Kuitems et al. (2022); Evidence for European presence in the Americas in AD 1021. DOI 10.1038/s41586-021-03972-8. CC-BY-4.0. [Source](https://www.nature.com/articles/s41586-021-03972-8); [rights](https://creativecommons.org/licenses/by/4.0/). Original repository image converted to WebP at its native size; no upscaling. The relief map above is independently rendered at higher pixel resolution.
- **L’Anse aux Meadows: excavated structures and dated wood** — Kuitems et al. (2022), after Wallace (2003); Evidence for European presence in the Americas in AD 1021. DOI 10.1038/s41586-021-03972-8. CC-BY-4.0. [Source](https://www.nature.com/articles/s41586-021-03972-8); [rights](https://creativecommons.org/licenses/by/4.0/). Original repository image converted to WebP at its native size; no upscaling. The relief map above is independently rendered at higher pixel resolution.
- **Northern Canada: the complete regional reference sheet** — Natural Resources Canada, Atlas of Canada Reference Map Series, Northern Canada / Nord du Canada, MCR0036, 2012, scale 1:4,000,000. Contains information licensed under the Open Government Licence – Canada. Open Government Licence – Canada. [Source](https://open.canada.ca/data/en/dataset/ed9208a8-54dd-516a-9e63-68bc0be258f7); [rights](https://open.canada.ca/en/open-government-licence-canada). Converted to WebP at the downloaded 7,200 × 6,600 pixels; no enlargement, cropping, added route lines or retouching. The legend and source credits remain on the sheet.
- **The whole Arctic Ocean: IBCAO bathymetry and relief** — IBCAO Editorial Board; map by Martin Jakobsson, Stockholm University. Jakobsson et al., The International Bathymetric Chart of the Arctic Ocean (IBCAO) Version 3.0, Geophysical Research Letters (2012), doi:10.1029/2012GL052219. Distributed by GEBCO. GEBCO public-domain terms for grid-derived information products. [Source](https://www.gebco.net/data-products/printable-maps); [rights](https://www.gebco.net/data-products/gridded-bathymetry/terms-of-use). Rendered from the full PDF sheet at 200 dpi to 8,662 × 10,237 pixels, then encoded as WebP. Labels, legend and credits preserved. The underlying grid spacing is 500 m, with uneven survey coverage; output pixels do not imply 500 m measured accuracy everywhere.
- **Hansen’s map of Gjøa and the 1903–06 Arctic surveys** — Map to illustrate the voyage and Arctic explorations of Capt. Roald Amundsen, from surveys by Lieut. G. Hansen, 1903 to 1906. The Geographical Journal, May 1907; Smithsonian Report, 1906, Plate I. Digitized by Princeton University Library. Public domain in the United States. [Source](https://static-prod.lib.princeton.edu/visual_materials/maps/websites/northwest-passage/amundsen.htm); [rights](https://static-prod.lib.princeton.edu/visual_materials/maps/websites/northwest-passage/amundsen.htm). Converted to WebP at its native 1,404 × 1,239 pixels. This modest-resolution historical scan supplements the large modern sheets; it has not been enlarged or redrawn.
- **The whole Southern Ocean: IBCSO v2 bathymetric chart** — Dorschel et al. (2022); chart by Simon Dreutter, IBCSO / Alfred Wegener Institute / GEBCO / Seabed 2030. PANGAEA dataset 937574. CC BY 4.0. [Source](https://doi.pangaea.de/10.1594/PANGAEA.937574); [rights](https://creativecommons.org/licenses/by/4.0/). Full PDF sheet rendered to 5,460 × 6,500 pixels and converted to WebP; no labels, borders or legend removed.
- **The full Strait of Magellan: Admiralty survey chart** — Great Britain Hydrographic Office; surveys directed by Phillip Parker King, Pringle Stokes and Robert FitzRoy; engraved by J. & C. Walker. David Rumsey Map Collection, David Rumsey Map Center, Stanford Libraries, 11940.000. CC BY-NC-SA 3.0 (digitization terms supplied by the collection). [Source](https://www.davidrumsey.com/luna/servlet/detail/RUMSEY~8~1~306175~90077866); [rights](https://www.davidrumsey.com/about/copyright-and-permissions). Complete 23,588 × 15,478 source scan reduced to 9,000 pixels wide and converted to WebP; source fold lines and original labels preserved. The source’s separately stated noncommercial/share-alike terms remain attached to this derivative.
- **Beagle’s Tierra del Fuego: channels, islands and Cape Horn** — Robert FitzRoy / HMS Beagle survey; J. & C. Walker engravers, 1839. Wellcome Collection, b33288136, volume II, foldout chart. Public Domain Mark 1.0. [Source](https://wellcomecollection.org/works/cun78dra); [rights](https://iiif.wellcomecollection.org/presentation/v2/b33288136_0002). Full 6,420 × 4,405 Wellcome IIIF scan converted to WebP without cropping, retouching or added route lines.
- **Wind across the whole southern archipelago in four seasons** — Castillo et al. (2026), Ocean Science 22, 2221–2247, Figure 3; ERA5 reanalysis data © ECMWF/Copernicus. CC BY 4.0. [Source](https://os.copernicus.org/articles/22/2221/2026/); [rights](https://creativecommons.org/licenses/by/4.0/). Published figure retained in full at 1,892 × 1,127 pixels and converted to WebP. Panel codes retained; the source caption’s inconsistent prose expansion of AMJ/JAS is not repeated.
- **Summer wind, wave-height and current maps around Antarctica** — Derkani et al. (2021), Earth System Science Data 13, 1189–1209, Figure 5. CC BY 4.0. [Source](https://essd.copernicus.org/articles/13/1189/2021/); [rights](https://creativecommons.org/licenses/by/4.0/). Full six-panel figure converted to WebP at 2,067 × 2,348 pixels; colour scales, panel labels and route retained. The 2° bins cannot resolve individual channels.

Route-guide photographs preserve the individual creators, source URLs, licence statements and modification notes in `data/guide-media/manifest.json` and in the displayed captions. The native source image dimensions are retained in the manifests; derivatives are not claimed as higher-resolution originals.
