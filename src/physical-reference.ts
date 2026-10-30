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
      "49 dated ice-sheet polygon snapshots, 25,000–1,500 calendar years BP (epoch1950). Author MIN, MAX and OPTIMAL scenarios retained. Nearest snapshot is used, with its own age shown; no interpolation. WGS84 polygons simplified at0.12° for display.",
    limits:
      "North American ice sheets only; reconstructed boundaries, not measured certainty. Does not reconstruct sea ice, shorelines or navigable open water. Outside dataset dates, no ice geometry is shown; that does not mean ice absence.",
    license:
      "CC BY4.0. GIS snapshot downloaded2026-10-29; processing script and checksums retained.",
  },
  {
    id: "gergis2009",
    title: "Multiproxy ENSO Event Reconstructions",
    authors: "Gergis, J. and Fowler, A.M. (2009)",
    url: "https://doi.org/10.1007/s10584-008-9476-z",
    data: "https://doi.org/10.25921/ebpz-a913",
    method:
      "NOAA/WDS dataset noaa-recon-8408, Table9 annual classifications1525–2002CE; atlas subset1525–1934. Tree-ring, coral, ice-core and documentary proxies. Original proxy ratio, mean skill, quality-adjusted magnitude and class are retained per event.",
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
