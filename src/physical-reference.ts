// Scientific source descriptions and editorial ocean geometry; no fetch or UI state.
export const climateKinds = [
  "drought",
  "cold",
  "heat",
  "other-climate",
  "el-nino",
  "la-nina",
  "volcano",
  "tsunami",
  "earthquake",
] as const;
export const climateLabels: Record<string, string> = {
  drought: "Drought / dry conditions",
  cold: "Cold episodes",
  heat: "Warm episodes",
  "other-climate": "Other environment context",
  "el-nino": "El Niño reconstructions",
  "la-nina": "La Niña reconstructions",
  volcano: "Volcanic eruptions",
  tsunami: "Tsunami source events",
  earthquake: "Significant earthquake epicenters",
};
export const physicalSources = [
  {
    id: "nadi1",
    title: "North American Deglacial Isochrones, NADI-1",
    authors: "Dalton et al. (2023)",
    url: "https://doi.org/10.1016/j.quascirev.2023.108345",
    data: "https://doi.org/10.5281/zenodo.8161764",
    method:
      "49 dated ice-sheet outlines per scenario, 25,000–1,000 calendar years BP (epoch 1950). Author MIN, MAX and OPTIMAL scenarios retained. At source dates, show the archived WGS84 polygons simplified at 0.12°. Between dates, linearly interpolate signed approximate distances on a 0.25° display grid and extract a smooth contour; the eight-neighbor distance calculation uses longitude scaled at 60° N. Source ages and interpolation are labeled. Frames are rounded to 1/256 of a 500-year interval (about two years). This is illustrative edge interpolation, not a glacier-dynamics model. During loading, retain and label the previous outline from the same scenario.",
    limits:
      "North American ice sheets only; reconstructed boundaries, not measured certainty. Does not reconstruct sea ice, shorelines or navigable open water. Outside dataset dates, no ice geometry is shown; that does not mean ice absence.",
    license:
      "CC BY 4.0. GIS snapshot downloaded 2026-10-29; processing script and checksums retained.",
  },
  {
    id: "gergis2009",
    title: "Multiproxy ENSO Event Reconstructions",
    authors: "Gergis, J. and Fowler, A.M. (2009)",
    url: "https://doi.org/10.1007/s10584-008-9476-z",
    data: "https://doi.org/10.25921/ebpz-a913",
    method:
      "NOAA/WDS dataset noaa-recon-8408, Table 9 annual classifications 1525–2002 CE; atlas subset 1525–1934. Tree-ring, coral, ice-core and documentary proxies. Original proxy ratio, mean skill, quality-adjusted magnitude and class are retained per event.",
    limits:
      "One reconstruction, not agreement among all reconstructions. Both ENSO phases can appear in one calendar year. Classes reflect this reconstruction, not modern ONI thresholds. Earlier years are not assessed by this dataset; no local drought or social impact is inferred.",
    license:
      "Cite investigators, publication and NOAA archive; retrieved2026-10-29. No NOAA endorsement implied.",
  },
  {
    id: "noaa-tsunami",
    title: "NCEI/WDS Global Historical Tsunami Database",
    authors:
      "NOAA National Centers for Environmental Information / World Data Service",
    url: "https://doi.org/10.7289/V5PN93H7",
    data: "https://www.ngdc.noaa.gov/hazel/view/hazards/tsunami/event-search",
    method:
      "All API pages checked against catalog total, then subset by atlas geography and year<=1934. Catalog source locations and validity codes retained; BCE dates converted to astronomical year numbering. No runup area is generated.",
    limits:
      "Includes doubtful and questionable historical reports; those are separately marked. Source-event points are not inundation maps. Catalog completeness varies by region and period. No causal link to abandonment is assumed.",
    license:
      "NOAA/NCEI factual catalog extract, retrieved2026-10-29; cite database and original event references through the linked catalog.",
  },
  {
    id: "noaa-earthquake",
    title: "NCEI/WDS Global Significant Earthquake Database",
    authors:
      "NOAA National Centers for Environmental Information / World Data Service",
    url: "https://doi.org/10.7289/V5TD9V7K",
    data: "https://www.ngdc.noaa.gov/hazel/view/hazards/earthquake/search",
    method:
      "All 34 API pages frozen and checked against 6,697 unique catalog IDs, then subset by atlas geography and source year<=1934. Original source dates, coordinates, publication status and all available fields retained. Negative historical BCE dates converted to astronomical numbering (1 BCE = year0). No date uncertainty or duration is invented where the catalog supplies none.",
    limits:
      "Selective significant-event catalog, not an exhaustive earthquake history. Historical coverage depends on documentary survival and reporting; missing events do not establish absence. Epicenters are approximate source points, not shaking footprints. Source casualty and damage fields are event-level reports, never impacts assigned to atlas settlements. No causal link to abandonment is inferred.",
    license:
      "NOAA/NCEI factual catalog extract, retrieved2026-10-29; cite database DOI and original event references. Reproducible standalone importer, raw API pages and SHA-256 checksums retained. No NOAA endorsement implied.",
  },
  {
    id: "gvp",
    title: "Volcanoes of the World, Holocene eruptions",
    authors:
      "Global Volcanism Program, Smithsonian Institution; compiled by Venzke, E. (2026)",
    url: "https://doi.org/10.5479/si.GVP.VOTW5-2026.5.4",
    data: "https://volcano.si.edu/database/webservices.cfm",
    method:
      "Full GVP WFS eruption response, subset by atlas geography and startyear<=1934. Original date modifiers, uncertainty, evidence method, activity type and VEI retained. Earliest/latest bounds use reported uncertainties; missing end dates are references to the start, not inferred duration.",
    limits:
      "Catalog reports may be uncertain or discredited. Volcano point is not an ashfall footprint; VEI does not establish deaths, climatic forcing or societal disruption. Holocene catalog is not a complete Pleistocene eruption history.",
    license:
      "Database compilation is a product of US employees; GVP attribution and source links retained. See https://volcano.si.edu/gvp_termsofuse.cfm. Retrieved2026-10-29.",
  },
  {
    id: "ocean",
    title: "Major ocean currents and trade winds",
    authors: "NOAA JetStream and NOAA Ocean Service",
    url: "https://www.noaa.gov/jetstream/ocean/circulations/jetstream-max-major-ocean-currents",
    data: "https://oceanservice.noaa.gov/facts/tradewinds.html",
    method:
      "Editorial schematic arrow paths based on NOAA descriptions of major surface currents and tropical trade winds. Winds point toward the direction they blow, although wind names describe the direction they come from.",
    limits:
      "Modern climatological orientation only, independent of selected year. Not reconstructed ancient currents, a navigation forecast or proof of a route. Seasonal shifts, ENSO and other changes can weaken, shift or reverse flows.",
    license:
      "Paraphrased NOAA scientific guidance; editorial geometry. Accessed2026-10-29.",
  },
  {
    id: "enso-mechanism",
    title: "Understanding El Niño & ENSO",
    authors: "NOAA",
    url: "https://www.noaa.gov/understanding-el-nino",
    data: "https://www.noaa.gov/jetstream/tropical/enso/enso-patterns",
    method:
      "Physical mechanism guidance: El Niño can weaken or sometimes reverse tropical trade winds, redistribute warm water eastward and change rainfall patterns.",
    limits:
      "Different regions can experience drought or increased rainfall. A reconstructed ENSO year alone cannot identify where drought occurred or prove that voyaging, trade or settlement collapsed.",
    license: "Paraphrased NOAA guidance; accessed2026-10-29.",
  },
  {
    id: "miller2020",
    title: "Cenozoic Sea-Level & Benthic δ¹⁸O Spline",
    authors: "Miller, K.G. et al. (2020), Science Advances 6(20):eaaz1346",
    url: "https://doi.org/10.1126/sciadv.aaz1346",
    data: "https://www.ncei.noaa.gov/pub/data/paleo/contributions_by_author/miller2020/miller2020rsl-sm-noaa.txt",
    method:
      "Smoothed Cenozoic global mean sea-level curve (7 Ma–980 ka subset) combining deep-sea benthic foraminifera δ¹⁸O with Mg/Ca deep-ocean temperature separation and Pacific/Atlantic margin backstripping.",
    limits:
      "Smoothed spline resolves tectonic-to-orbital trends (~20 kyr spacing before 980 ka) and carries ±10–15 m global sea-level uncertainty.",
    license: "NOAA NCEI paleoclimate archive; retrieved 2026-11-21.",
  },
  {
    id: "lr04",
    title: "LR04 Global Pliocene–Pleistocene Benthic δ¹⁸O Stack",
    authors: "Lisiecki, L.E. and Raymo, M.E. (2005), Paleoceanography 20:PA1003",
    url: "https://doi.org/10.1029/2004PA001071",
    data: "https://www.ncei.noaa.gov/pub/data/paleo/contributions_by_author/lisiecki2005/lisiecki2005-d18o-stack-noaa.txt",
    method:
      "57 globally distributed deep-sea sediment cores aligned by benthic foraminifera calcite δ¹⁸O from 5.32 Ma to present (mean δ¹⁸O and stacked standard error retained).",
    limits:
      "Benthic δ¹⁸O blends continental ice volume and deep-water temperature; plotted inverted so warmer / lower-ice intervals appear upward.",
    license: "NOAA NCEI archive; retrieved 2026-11-21.",
  },
  {
    id: "epica2007",
    title: "EPICA Dome C 800-kyr Antarctic Deuterium Temperature",
    authors: "Jouzel, J. et al. (2007), Science 317:793–796",
    url: "https://doi.org/10.1126/science.1141038",
    data: "https://www.ncei.noaa.gov/pub/data/paleo/icecore/antarctica/epica_domec/edc3deuttemp2007.txt",
    method:
      "Hydrogen isotope (δD) profile along the 3,260 m EPICA Dome C Antarctic ice core on the EDC3 chronology (801 ka through 1900 CE, °C relative to last-millennium mean).",
    limits:
      "Reflects Antarctic Plateau condensation temperatures; polar amplification means global mean glacial–interglacial swings were smaller (~5–6 °C global vs ~9–12 °C Dome C).",
    license: "NOAA NCEI / EPICA Community; retrieved 2026-11-21.",
  },
  {
    id: "spratt2016",
    title: "800-kyr Global Mean Sea Level Stack (PC1 Long)",
    authors: "Spratt, R.M. and Lisiecki, L.E. (2016), Climate of the Past 12:1079–1097",
    url: "https://doi.org/10.5194/cp-12-1079-2016",
    data: "https://www.ncei.noaa.gov/pub/data/paleo/paleocean/by_contributor/spratt2016/spratt2016-noaa.txt",
    method:
      "Principal-component synthesis of multiple independent sea-level reconstructions across 798–0 ka with 95% confidence bounds (err_lo to err_up) and 1-kyr downsampling.",
    limits:
      "Global eustatic mean; local relative sea levels along glaciated margins and far-field coasts diverged by meters due to glacial isostatic adjustment.",
    license: "CC BY / NOAA NCEI archive; retrieved 2026-11-21.",
  },
  {
    id: "bereiter2015",
    title: "Antarctic Ice-Core 800-kyr Revised CO₂ Composite",
    authors: "Bereiter, B. et al. (2015), Geophysical Research Letters 42:542–549",
    url: "https://doi.org/10.1002/2014GL061957",
    data: "https://www.ncei.noaa.gov/pub/data/paleo/icecore/antarctica/antarctica2015co2composite.txt",
    method:
      "Composite direct air-bubble CO₂ concentration measurements from EPICA Dome C, Vostok, Taylor Dome, Siple Dome, and Law Dome on AICC2012 gas ages through 1900 CE.",
    limits:
      "Firn-air enclosure smooths multi-decadal peaks slightly in low-accumulation East Antarctic cores; series capped at 1900 CE to match atlas scope.",
    license: "NOAA NCEI archive; retrieved 2026-11-21.",
  },
  {
    id: "loulergue2008",
    title: "EPICA Dome C 800-kyr Atmospheric Methane (CH₄)",
    authors: "Loulergue, L. et al. (2008), Nature 453:383–386",
    url: "https://doi.org/10.1038/nature06950",
    data: "https://www.ncei.noaa.gov/pub/data/paleo/icecore/antarctica/epica_domec/edc-ch4-2008-noaa.txt",
    method:
      "2,100+ trapped-air methane measurements from EDC99 tracking tropical wetland & monsoon productivity alongside glacial cycles over 800–0 ka BP.",
    limits:
      "Requires gas-age vs ice-age synchronization across abrupt Dansgaard–Oeschger shifts.",
    license: "NOAA NCEI archive; retrieved 2026-11-21.",
  },
  {
    id: "ngrip2004",
    title: "NGRIP Greenland Ice Core δ¹⁸O (GICC05 60-kyr)",
    authors: "NGRIP Members (2004), Nature 431:147–151",
    url: "https://doi.org/10.1038/nature02805",
    data: "https://www.ncei.noaa.gov/pub/data/paleo/icecore/greenland/summit/ngrip/gicc05-60ka-20yr.txt",
    method:
      "Layer-counted GICC05 20-year Greenland δ¹⁸O chronology from 60 ka b2k through 1900 CE (year = 2000 − age_b2k), resolving abrupt Dansgaard–Oeschger & Younger Dryas swings.",
    limits:
      "Greenland temperature signal is strongly amplified around North Atlantic sea-ice retreats compared to global or tropical averages.",
    license: "NOAA NCEI / Centre for Ice and Climate; retrieved 2026-11-21.",
  },
  {
    id: "kaufman2020",
    title: "Temp12k Multi-Method Holocene Global Temperature",
    authors: "Kaufman, D. et al. (2020), Scientific Data 7:201",
    url: "https://doi.org/10.1038/s41597-020-0530-7",
    data: "https://www.ncei.noaa.gov/pub/data/paleo/reconstructions/kaufman2020/temp12k_allmethods_percentiles.csv",
    method:
      "Global mean surface temperature median with 5th–95th percentile ensemble envelope across five statistical methods using 1,319 Holocene marine & terrestrial proxy records (12 ka to 1900 CE).",
    limits:
      "Proxy weighting between Northern Hemisphere land and global oceans produces a debated mid-Holocene warmth peak relative to climate models.",
    license: "CC BY 4.0 / NOAA NCEI; retrieved 2026-11-21.",
  },
  {
    id: "pages2k2019",
    title: "PAGES 2k Common Era Global Mean Temperature Ensemble",
    authors: "PAGES 2k Consortium / Neukom et al. (2019), Nature Geoscience 12:643–649",
    url: "https://doi.org/10.1038/s41561-019-0400-0",
    data: "https://www.ncei.noaa.gov/pub/data/paleo/pages2k/neukom2019temp/recons/Full_ensemble_median_and_95pct_range.txt",
    method:
      "7-method multiproxy global surface temperature ensemble across 1–1900 CE combining tree rings, corals, ice cores, speleothems, lake varves & documents (5-year averages plus major volcanic years).",
    limits:
      "Proxy density increases sharply toward 1500–1900 CE; earlier centuries carry wider 95% confidence bounds.",
    license: "CC BY 4.0 / NOAA NCEI; retrieved 2026-11-21.",
  },
  {
    id: "batchelor2019",
    title: "Quaternary Northern Hemisphere Ice Sheets (~3.59 Ma–30 ka)",
    authors: "Batchelor, C.L. et al. (2019), Nature Communications 10:3713",
    url: "https://doi.org/10.1038/s41467-019-11601-2",
    data: "https://osf.io/7jen3/",
    method:
      "Best-estimate Northern Hemisphere ice-sheet reconstructions across 15 pre-LGM Marine Isotope Stages and late Pliocene–Pleistocene chrons, reprojected from North Pole LAEA to WGS84 and simplified for web rendering.",
    limits:
      "Best-estimate hypotheses combine empirical moraine limits with ice-sheet modeling; pre-MIS 6 margins remain uncertain across several basins.",
    license: "CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); retrieved 2026-11-21.",
  },
  {
    id: "dated1",
    title: "DATED-1 Eurasian Ice Sheet Time-Slices (40–10 ka)",
    authors: "Hughes, A.L.C. et al. (2016), Boreas 45(1):1–45",
    url: "https://doi.org/10.1111/bor.12142",
    data: "https://doi.org/10.1594/PANGAEA.848117",
    method:
      "Most-credible (mc) time-slice outlines of British-Irish, Scandinavian, and Svalbard-Barents-Kara ice sheets from 25–10 ka cal BP, paired with NADI-1 OPTIMAL North American margins.",
    limits:
      "Submarine shelf grounding lines rely on sparse offshore cores and seismic stratigraphy.",
    license: "CC BY 3.0; retrieved 2026-11-21.",
  },
];
export const oceanPaths: {
  name: string;
  kind: string;
  coordinates: [number, number][];
}[] = [
  {
    name: "North Equatorial Current",
    kind: "warm",
    coordinates: [
      [-110, 12],
      [-145, 12],
      [-178, 12],
      [160, 12],
      [130, 13],
    ],
  },
  {
    name: "South Equatorial Current",
    kind: "warm",
    coordinates: [
      [-85, -8],
      [-120, -10],
      [-160, -12],
      [175, -14],
      [155, -14],
    ],
  },
  {
    name: "Equatorial Countercurrent",
    kind: "warm",
    coordinates: [
      [140, 5],
      [175, 5],
      [-150, 5],
      [-115, 5],
      [-90, 5],
    ],
  },
  {
    name: "Kuroshio",
    kind: "warm",
    coordinates: [
      [125, 15],
      [128, 24],
      [135, 32],
      [145, 36],
    ],
  },
  {
    name: "North Pacific Current",
    kind: "warm",
    coordinates: [
      [150, 38],
      [180, 40],
      [-150, 42],
      [-128, 43],
    ],
  },
  {
    name: "California Current",
    kind: "cold",
    coordinates: [
      [-128, 44],
      [-127, 36],
      [-119, 27],
      [-113, 22],
    ],
  },
  {
    name: "Peru / Humboldt Current",
    kind: "cold",
    coordinates: [
      [-77, -40],
      [-79, -28],
      [-82, -14],
      [-85, -5],
    ],
  },
  {
    name: "Alaska Current",
    kind: "warm",
    coordinates: [
      [-133, 46],
      [-138, 54],
      [-149, 58],
    ],
  },
  {
    name: "Caribbean Current",
    kind: "warm",
    coordinates: [
      [-60, 13],
      [-70, 15],
      [-80, 17],
      [-86, 20],
    ],
  },
  {
    name: "Florida Current / Gulf Stream",
    kind: "warm",
    coordinates: [
      [-82, 24],
      [-79, 28],
      [-75, 35],
      [-64, 40],
      [-50, 43],
    ],
  },
  {
    name: "Labrador Current",
    kind: "cold",
    coordinates: [
      [-57, 60],
      [-54, 52],
      [-52, 47],
    ],
  },
  {
    name: "Brazil Current",
    kind: "warm",
    coordinates: [
      [-36, -10],
      [-40, -20],
      [-48, -30],
      [-50, -36],
    ],
  },
  {
    name: "Falkland / Malvinas Current",
    kind: "cold",
    coordinates: [
      [-58, -53],
      [-56, -45],
      [-53, -38],
    ],
  },
  ...[-160, -130, 170, 140, -45].flatMap((lon) => [
    {
      name: "Northeast trade winds",
      kind: "wind",
      coordinates: [
        [lon, 24],
        [lon - 12, 12],
      ] as [number, number][],
    },
    {
      name: "Southeast trade winds",
      kind: "wind",
      coordinates: [
        [lon, -24],
        [lon - 12, -12],
      ] as [number, number][],
    },
  ]),
];
