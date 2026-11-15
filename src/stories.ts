import type { MapScope } from "./map-projection";

export interface StoryScene {
  id: string;
  /** Astronomical year numbering, matching the evidence records. */
  year: number;
  title: string;
  body: string;
  note: string;
  recordIds: string[];
  scope: MapScope;
  center: [number, number];
  zoom: number;
  holdMs?: number;
}

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  scenes: StoryScene[];
}

// Scene years are viewing positions inside the cited evidence windows, not new
// historical estimates. Notes distinguish representative years from dated events.
export const stories: Story[] = [
  {
    id: "pacific-arrivals",
    title: "Across the Pacific",
    subtitle: "Arrivals, onward voyages, continuing communities",
    description: "Follow selected founding evidence from the western Pacific into Polynesia, then distinguish the end of an arrival window from the lives that followed.",
    scenes: [
      {
        id: "beyond-near-oceania", year: -1250, title: "Reaching Vanuatu",
        body: "Early Lapita settlement evidence connects the Bismarck region with islands farther east, including Vanuatu. The moving line introduces a broad founding pulse across this ocean geography. It represents inferred movement between regions, rather than the recorded track of a particular canoe.",
        note: "The estimated arrival window is broad; this viewing year is not a dated voyage or evidence of annual traffic.",
        recordIds: ["history-lapita-bismarcks-vanuatu"], scope: "pacific", center: [161, -10], zoom: 3,
      },
      {
        id: "toward-fiji", year: -1100, title: "New settlements farther east",
        body: "Founding estimates place early settlement in Fiji after the first Lapita arrivals farther west. The map now emphasizes that next regional connection. Archaeological chronologies help order this expansion, while leaving the identities, departure places, and individual journeys of the founders uncertain.",
        note: "Vanuatu is a schematic origin anchor, not proof that every founder departed from that island group.",
        recordIds: ["history-lapita-vanuatu-fiji"], scope: "pacific", center: [174, -18], zoom: 4,
      },
      {
        id: "tonga-and-samoa", year: -890, title: "Arrivals in Tonga and Samoa",
        body: "At Nukuleka in Tonga, dated coral files constrain an early Lapita founding horizon. Samoa also has early settlement evidence within this broader period. These records reveal neighboring areas being settled without requiring a single itinerary that passes through Tonga before reaching Samoa.",
        note: "The Tonga estimate is unusually precise; the Samoan window dates occupation, not a particular sea crossing.",
        recordIds: ["history-lapita-fiji-tonga", "r6-nukuleka-onset", "history-lapita-fiji-samoa"], scope: "pacific", center: [-179, -18], zoom: 5,
      },
      {
        id: "within-tonga", year: -815, title: "Settlement within an island chain",
        body: "Dated early horizons in Haʻapai and Vavaʻu help describe expansion within Tonga. Their estimates overlap, so the evidence does not resolve every island arrival into a neat sequence. A regional model connects this northern expansion with earlier settlement on Tongatapu.",
        note: "Overlapping modeled ranges do not establish which northern island group was settled first.",
        recordIds: ["r6-haapai-onset", "r6-vavau-onset", "r6-tonga-northward-model"], scope: "pacific", center: [-174.8, -19.5], zoom: 8,
      },
      {
        id: "east-polynesian-founding", year: 1070, title: "A later expansion into East Polynesia",
        body: "Much later, one influential chronology places a founding pulse in the Society Islands during the eleventh and early twelfth centuries. The connection from western Polynesia shows the regional relationship. It does not identify all intermediate landfalls or reconstruct the navigators’ exact course.",
        note: "Other work favors earlier, incremental settlement in the southern Cook Islands. This is one published chronology, not a settled universal start date.",
        recordIds: ["history-west-east-polynesia-migration"], scope: "pacific", center: [-160, -16], zoom: 3,
      },
      {
        id: "rapa-nui-arrival", year: 1250, title: "Toward Rapa Nui",
        body: "A later founding pulse reaches the far eastern Pacific in the chronology used here. Rapa Nui becomes the focus of this connection. The line expresses a central Polynesian relationship; its western anchor is an orientation aid, not an established departure port for every founder.",
        note: "The approximate regional window is not a measured duration of migration. Mangareva is a schematic origin proxy.",
        recordIds: ["history-central-polynesia-rapanui", "history-rapa-nui-regional-occupation"], scope: "pacific", center: [-122, -25], zoom: 3,
      },
      {
        id: "communities-after-arrival", year: 1300, title: "Arrival is a beginning",
        body: "The founding connection has faded, but evidence of Rapanui presence continues. Separate records also describe regional habitation in Tonga and Samoa. An arrival window answers when settlement began within a model; it cannot stand in for the subsequent history of an island’s communities.",
        note: "Regional presence does not prove uninterrupted occupation at every site. The record’s later boundary is not extinction or abandonment.",
        recordIds: ["history-rapa-nui-regional-occupation", "history-tonga-regional-occupation", "history-american-samoa-regional-occupation"], scope: "pacific", center: [-148, -20], zoom: 1.8,
      },
    ],
  },
  {
    id: "built-places",
    title: "Places people built",
    subtitle: "Five places, different kinds of dates",
    description: "Visit monumental centers, urban places, and one surviving building phase. Each stop asks what its dates actually describe.",
    scenes: [
      {
        id: "caral-construction", year: -2400, title: "Building at Caral",
        body: "Plant fibers associated with construction and occupation help date contexts at Caral in Peru’s Supe Valley. Nearby regional research describes many large centers with monumental and residential architecture. Together these records place Caral within a broader landscape of building, rather than an isolated monument.",
        note: "The date ranges summarize sampled contexts. They do not date every building or establish occupation in every intervening year.",
        recordIds: ["south-caral-dated-contexts", "r4-norte-chico-centers"], scope: "americas", center: [-77.5, -10.9], zoom: 7,
      },
      {
        id: "teotihuacan-city", year: 400, title: "An urban landscape at Teotihuacan",
        body: "Teotihuacan’s planned city and residential remains belong to a major period of urban development described across the first through seventh centuries. Moving to this place changes both the geography and the kind of evidence: the highlighted span summarizes a city’s development, not one construction event.",
        note: "This broad urban phase is not the exact date of each building, first occupation, or final reuse.",
        recordIds: ["south-teotihuacan-urban-development"], scope: "americas", center: [-98.84, 19.69], zoom: 7,
      },
      {
        id: "chaco-great-houses", year: 1000, title: "Chaco’s great houses",
        body: "Chaco Canyon’s great houses formed part of a regional ceremonial and economic center. Their scale makes this a striking place on the map, but architecture alone does not tell us how many people lived in each building or how residents and visitors used its spaces.",
        note: "The regional phase is approximate; household numbers and the balance of residence, gathering, and ceremony remain interpretive.",
        recordIds: ["chaco-regional-center"], scope: "americas", center: [-107.96, 36.06], zoom: 7,
      },
      {
        id: "cahokia-urban-phase", year: 1150, title: "Cahokia’s urban phase",
        body: "Farther east, Cahokia’s Mississippian urban phase offers another example of a large built place. Its highlighted interval identifies a particular phase of development. Comparing it with Chaco invites attention to distinct regional histories, without turning these different places into stages of a single sequence.",
        note: "The urban interval does not define the first or last human presence in the region, and no population total is inferred here.",
        recordIds: ["cahokia-urban"], scope: "americas", center: [-90.06, 38.66], zoom: 7,
      },
      {
        id: "templo-mayor-phase", year: 1400, title: "One surviving stage at Templo Mayor",
        body: "At Tenochtitlan, the evidence becomes more specific: a surviving stage of the Templo Mayor. INAH associates Stage II with named rulers’ reigns between 1376 and 1427. This dates an architectural phase within an existing city, rather than the beginning of the whole settlement.",
        note: "Stage II is the earliest excavated surviving stage described by this source, not the founding date of Tenochtitlan.",
        recordIds: ["site-templomayor-stageii"], scope: "americas", center: [-99.13, 19.43], zoom: 8,
      },
    ],
  },
  {
    id: "chaco-connections",
    title: "Chaco in a connected world",
    subtitle: "Objects, relationships, and regional change",
    description: "Follow changing Chaco connections through ceramics, scarlet macaws, regional building, and an interpretation of political reorganization.",
    scenes: [
      {
        id: "early-chaco-ties", year: 850, title: "Connections to the west and south",
        body: "A study of ceramic assemblages finds Chaco’s ninth-century connections primarily to the west and south. These relationships offer a way to see the emerging center within its wider region. They measure similarities and connections among assemblages, rather than identifying the journeys of individual people.",
        note: "Ceramic networks do not prove that every connection involved migration or locate a particular migrant’s origin.",
        recordIds: ["fc-chaco-early-network", "chaco-regional-center"], scope: "americas", center: [-110, 35], zoom: 5,
      },
      {
        id: "macaws-at-chaco", year: 950, title: "Scarlet macaws arrive through exchange",
        body: "Scarlet macaws at Chaco reveal a long-distance Indigenous exchange network. The regional line makes that connection visible, but the birds need not have traveled directly from tropical Mesoamerica. Genetic research suggests an as-yet unidentified breeding community outside the species’ natural range may have supplied birds.",
        note: "This is a macroregional connection, not a known road or supply settlement. The dated acquisition span is not all Indigenous trade.",
        recordIds: ["history-mesoamerica-chaco-macaws", "chaco-regional-center"], scope: "americas", center: [-105, 27], zoom: 2.5,
      },
      {
        id: "later-chaco-ties", year: 1090, title: "Stronger northern connections",
        body: "By the late eleventh century, the ceramic-network study finds strong Chaco ties with the Middle and Northern San Juan. The regional relationships have changed from the earlier pattern. This evidence describes integration among communities without demonstrating a single administrative transfer or a precisely dated migration.",
        note: "The record spans several network phases; its full date envelope does not mean identical ties persisted throughout.",
        recordIds: ["fc-chaco-late-network"], scope: "americas", center: [-108, 36.5], zoom: 6,
      },
      {
        id: "different-outliers", year: 1100, title: "New centers and existing communities",
        body: "Research in the Middle San Juan distinguishes abrupt Chacoan establishment at Salmon and Aztec from smaller outliers built within existing communities. A shared architectural tradition could take different local forms. The region cannot be reduced to one uniform episode of people arriving and replacing others.",
        note: "The smaller-outlier building process is dated approximately 1075–1125. Shared architecture does not identify individual migrants or document their routes.",
        recordIds: ["fc-middle-san-juan-outliers"], scope: "americas", center: [-108.1, 36.7], zoom: 7,
      },
      {
        id: "chaco-reorganization", year: 1150, title: "A center changes; communities continue",
        body: "One influential interpretation places the loss of Chaco Canyon’s central role around 1150 while broader community patterns continued. The map pauses at this approximate reference point. A change in institutional importance should not be read as the immediate disappearance of everyone connected with the region.",
        note: "This is a historical interpretation of reorganization, not a direct date for every departure or a system-wide abandonment event.",
        recordIds: ["fc-chaco-centrality-reorganization", "fc-chaco-late-network"], scope: "americas", center: [-108, 36], zoom: 5,
      },
    ],
  },
  {
    id: "pacific-exchange",
    title: "Islands exchanging with islands",
    subtitle: "Different networks, different evidence windows",
    description: "Stone and shell trace selected Pacific connections. Watch their distinct windows, and see why a fading line is not proof that voyaging stopped everywhere.",
    scenes: [
      {
        id: "island-networks", year: 1250, title: "Stone and shell connect communities",
        body: "Pitcairn stone and Mangarevan pearl shell supported exchanges among Mangareva, Pitcairn, and Henderson. Farther west, Samoan adzes entered the Tongan chiefly economy during an attested period. These are distinct networks with their own evidence, rather than one continuously operating ocean-wide trade system.",
        note: "The lines are schematic relationships. Their motion does not measure voyage frequency or require every exchange to follow the drawn chain.",
        recordIds: ["history-mangareva-pitcairn-henderson", "history-samoa-tonga-exchange"], scope: "pacific", center: [-153, -22], zoom: 2,
      },
      {
        id: "mangaia-connections", year: 1355, title: "Different stones reach Mangaia",
        body: "Stone sourced to Samoa, Rurutu, and Eiao appears in dated Mangaia contexts. These connections make the Cook Islands part of a wider set of exchanges. Material origins reveal relationships across the ocean, while leaving room for intermediaries and for tools kept before their final deposition.",
        note: "Artifact contexts constrain evidence windows; they do not directly date each voyage or prove nonstop travel from source to destination.",
        recordIds: ["history-samoa-mangaia-exchange", "history-rurutu-mangaia-exchange", "history-eiao-cooks-exchange"], scope: "pacific", center: [-153, -17], zoom: 3,
      },
      {
        id: "different-evidence-windows", year: 1365, title: "One connection fades from this record",
        body: "The displayed Eiao-to-Mangaia window has ended, while Samoan and Rurutu connections remain within their supported windows. This changing map reflects the evidence available for each relationship. It does not establish a single date when Marquesan people stopped exchanging with all other islands.",
        note: "A final dated context is an evidence boundary, not necessarily the last voyage. Missing years remain gaps in this record.",
        recordIds: ["history-eiao-cooks-exchange", "history-samoa-mangaia-exchange", "history-rurutu-mangaia-exchange"], scope: "pacific", center: [-153, -17], zoom: 3,
      },
      {
        id: "regional-decline", year: 1451, title: "Decline in one southeastern network",
        body: "Evidence supports decline around 1450 in the Mangareva–Pitcairn–Henderson network. The Rurutu–Mangaia connection still has a later evidence window. The contrast matters: a regional exchange system could weaken while other relationships continued, and Henderson’s occupation itself extended beyond the network’s displayed endpoint.",
        note: "The year shown is just beyond a rounded boundary. It is not the date of an abrupt final voyage or island-wide abandonment.",
        recordIds: ["history-mangareva-pitcairn-henderson", "history-rurutu-mangaia-exchange"], scope: "pacific", center: [-142, -23], zoom: 2.5,
      },
      {
        id: "later-samoan-links", year: 1550, title: "Later evidence of Samoan connections",
        body: "Later dated evidence again connects Samoan stone with Mangaia and Tonga. These windows are separated from some earlier attestations, so the map does not fill every intervening year with assumed traffic. The objects support continuing or renewed relationships without resolving how often people sailed.",
        note: "Tools could be kept or transferred indirectly. The evidence does not distinguish every new voyage from later deposition of older objects.",
        recordIds: ["history-samoa-mangaia-exchange", "history-samoa-tonga-exchange"], scope: "pacific", center: [-166, -18], zoom: 3.5,
      },
      {
        id: "beyond-sampled-exchange", year: 1673, title: "Beyond the sampled exchange windows",
        body: "The selected Samoan exchange windows have closed on the map. Regional habitation evidence still describes communities in Tonga and Samoa. Dated objects offer a partial view of their relationships, not a complete record of every voyage or an end date for island life.",
        note: "These endpoints limit the displayed evidence. They do not prove that all inter-island exchange ceased.",
        recordIds: ["history-samoa-mangaia-exchange", "history-samoa-tonga-exchange", "history-tonga-regional-occupation", "history-american-samoa-regional-occupation"], scope: "pacific", center: [-170, -18], zoom: 3,
      },
    ],
  },
  {
    id: "connected-oceans",
    title: "Ports, crossings, and colonial systems",
    subtitle: "Pacific and Atlantic routes with different endings",
    description: "Follow selected colonial ports and shipping systems, distinguish opposite Pacific crossings, and read wrecks and system endings without erasing the places that remained.",
    scenes: [
      {
        id: "colonial-port-lineages", year: 1519, title: "Ports with different founding histories",
        body: "Havana’s present bay settlement and Veracruz’s municipal lineage share the year 1519, but their markers mean different things. Veracruz relocated more than once. These selected colonial foundations introduce later shipping connections; they do not mark the beginning of human presence on either coast.",
        note: "Havana refers to its present site; Veracruz refers to a municipal lineage, not one unchanging location.",
        recordIds: ["history-havana-current-site", "history-veracruz-lineage"], scope: "atlantic", center: [-89, 22], zoom: 4,
      },
      {
        id: "existing-capital", year: 1522, title: "A colonial transition in an existing city",
        body: "After the conquest of Tenochtitlan, colonial planning in late 1521 and early 1522 took place over the existing Mexica capital. The marker records that political and urban transition. Read it alongside the earlier city, rather than as a first settlement on empty land.",
        note: "The earlier Templo Mayor record identifies a surviving building phase; the colonial record does not erase Indigenous presence.",
        recordIds: ["history-mexico-city-colonial-transition", "site-templomayor-stageii"], scope: "americas", center: [-99.13, 19.43], zoom: 7,
      },
      {
        id: "two-pacific-directions", year: 1600, title: "Two directions across the Pacific",
        body: "Manila’s galleon system connected Asia and the Americas through different sailing corridors. Eastbound ships sought northern westerlies before approaching Acapulco along the American coast. Westbound ships crossed the tropical Pacific toward Manila, carrying silver within this colonial exchange system alongside the eastbound Asian goods.",
        note: "Lines join source endpoints; separate display lanes are not reconstructed sailing tracks. The Manila-based window starts in 1571. Earlier Cebu crossings preceded it; traffic was intermittent.",
        recordIds: ["history-manila-acapulco-eastbound", "history-acapulco-manila-westbound"], scope: "pacific", center: [-170, 20], zoom: 1.2,
      },
      {
        id: "atlantic-fleets-and-loss", year: 1715, title: "Assembling at Havana; danger at sea",
        body: "Returning fleets from Veracruz assembled at Havana before crossing the Atlantic toward Spain. In 1715, a hurricane wrecked a convoy along Florida’s Atlantic coast. The disaster marker preserves a dated loss within a shipping system, rather than representing one vessel or all maritime activity.",
        note: "The fleet marker groups multiple vessels. Route motion shows an intermittently operating system, not a departure in every displayed year.",
        recordIds: ["history-veracruz-havana-fleets", "history-havana-spain-fleets", "history-spanish-fleet-1715"], scope: "atlantic", center: [-48, 29], zoom: 1.5,
      },
      {
        id: "atlantic-system-boundary", year: 1779, title: "The organized fleet system ends",
        body: "The displayed Spanish Atlantic fleet system ends in 1778, so its routes have faded by this scene. Havana’s established-place marker and the earlier disaster remain. Ending an organized convoy system is a change in shipping arrangements, not proof that the ports or independent commerce disappeared.",
        note: "The system’s beginning is a decade-level estimate. Its operation was intermittent, and later independent shipping continued.",
        recordIds: ["history-veracruz-havana-fleets", "history-havana-spain-fleets", "history-havana-current-site", "history-spanish-fleet-1715"], scope: "atlantic", center: [-77, 24], zoom: 3,
      },
      {
        id: "after-the-galleon-system", year: 1816, title: "Beyond the galleon system",
        body: "The Manila galleon system’s conventional endpoint is 1815. Its two routes leave the active display, while established places remain available for inspection. This boundary closes a colonial shipping system; it is not the end of trans-Pacific commerce, migration, or travel along these ocean corridors.",
        note: "A persistent foundation marker remembers an earlier event; by itself it does not establish uninterrupted habitation or unchanged sovereignty.",
        recordIds: ["history-manila-acapulco-eastbound", "history-acapulco-manila-westbound", "history-havana-current-site"], scope: "world", center: [-130, 20], zoom: 1,
      },
    ],
  },
  {
    id: "early-american-evidence",
    title: "Reading early American evidence",
    subtitle: "Footprints, artifacts, and debated dates",
    description: "Visit three different kinds of early evidence. This is a comparison of sites and their chronologies, not a reconstructed migration route between them.",
    scenes: [
      {
        id: "white-sands-trackmaking", year: -21000, title: "People leave footprints at White Sands",
        body: "Multiple footprint horizons at White Sands document repeated human presence during the Last Glacial Maximum. Different dating methods help assess the sequence. These traces bring people into view at a particular place, without identifying their cultural affiliation or the direction from which they arrived.",
        note: "The displayed year lies within an aggregate dating envelope, not a continuously occupied settlement. The map locator is generalized.",
        recordIds: ["white-sands-footprints"], scope: "americas", center: [-106.17, 32.78], zoom: 5,
      },
      {
        id: "coopers-ferry-contexts", year: -13900, title: "Artifacts within dated contexts",
        body: "At Cooper’s Ferry, early Area B pits contain projectile points, stone-working debris, and bone. A published model uses associated bone dates to estimate the pits’ ages. This interpretation depends on the relationships between the materials, their deposits, and the assumptions of the dating model.",
        note: "Bone dates do not directly date stone manufacture. The chronology remains under discussion; this assemblage does not establish a migration route.",
        recordIds: ["early-coopers-ferry-area-b"], scope: "americas", center: [-116.4, 45.91], zoom: 5,
      },
      {
        id: "monte-verde-interpretation", year: -12550, title: "Human activity and a disputed chronology",
        body: "At Monte Verde II in Chile, cultural materials are reported, while their chronological placement is disputed. This scene shows the late-Pleistocene interpretation associated with structures, hearths, and artifacts. The record retains competing interpretation and responses, separating evidence of activity from agreement about its age.",
        note: "Approximately 14,500 calibrated years before present is one disputed interpretation, not an exact year or a resolved arrival date. These three sites do not form a proven itinerary.",
        recordIds: ["monte-verde-ii"], scope: "americas", center: [-73.2, -41.5], zoom: 5,
      },
    ],
  },
];
