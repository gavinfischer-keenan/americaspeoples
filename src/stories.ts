import {sixGuideStories} from './six-guide-stories';
import {comingSoonBStories} from './coming-soon-b-stories';
import {comingSoonAStories} from './coming-soon-a-stories';
import {earlyContinuityStories} from './early-continuity-stories';
import type { MapScope } from "./map-projection";
import { expansionStories } from './expansion-stories';
import { northernStory } from './northern-story';

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
    description: "Begin with Pleistocene sea crossings and island occupation, then follow later Lapita and Polynesian settlement. These are different migrations, separated by many millennia.",
    scenes: [
      {
        id: "early-sahul", year: -63050, title: "Sea crossings long before Lapita",
        body: "People had reached northern Australia tens of thousands of years before Lapita. The early occupation model at Madjedbebe belongs to this much older history. Reaching Sahul required sea crossings even when lower sea levels joined land that is separate today.",
        note: "An archaeological arrival estimate does not recover a particular boat or a complete route. Today’s coastlines and relief are reference geography.",
        recordIds: ["px-madjedbebe-onset", "comparative-sahul-purposeful-voyaging"], scope: "pacific", center: [132, -8], zoom: 4,
      },
      {
        id: "raja-ampat-crossings", year: -51000, title: "Island life near New Guinea",
        body: "Mololo Cave on Waigeo records early human activity around or before 55,000–50,000 years ago. People used both rainforest and marine resources. Seafaring simulations identify a viable northern crossing corridor through Raja Ampat; it is one possible pathway into Sahul.",
        note: "The line is a modeled corridor. The cave is a published physical location; the precise journeys are not known.",
        recordIds: ["context-mololo-early", "context-raja-ampat-crossings"], scope: "pacific", center: [130, -2], zoom: 12,
      },
      {
        id: "early-timor", year: -42000, title: "People on Timor",
        body: "Laili’s earliest intensive occupation is modeled around 44,000 years ago. It belongs to a southern island history with marine food, stone working and movement between islands. This dates one shelter, rather than proving the first human arrival anywhere on Timor.",
        note: "The displayed window is uncertainty around occupation onset, not continuous residence through every year in it. The map uses a regional Laili locator.",
        recordIds: ["context-laili-early"], scope: "pacific", center: [125, -8], zoom: 8,
      },
      {
        id: "beyond-near-oceania", year: -1250, title: "Reaching Vanuatu",
        body: "Lapita communities expanded eastward from the Bismarck region into islands including Vanuatu. Early settlements mark a major extension of inhabited Oceania across open water. Archaeology connects these founding communities, although it does not preserve the course of an individual voyage.",
        note: "The estimated arrival window is broad; this viewing year is not a dated voyage or evidence of annual traffic.",
        recordIds: ["history-lapita-bismarcks-vanuatu"], scope: "pacific", center: [161, -10], zoom: 3,
      },
      {
        id: "toward-fiji", year: -1100, title: "New settlements farther east",
        body: "People founded early settlements in Fiji after the first Lapita arrivals farther west. The archaeological chronology places Fiji within this eastward expansion across the Pacific. The founders’ particular departure places and individual journeys remain uncertain.",
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
        body: "One influential chronology places the founding of Society Island communities in the eleventh and early twelfth centuries. These settlers came within a much later expansion from western into eastern Polynesia, many centuries after the first Lapita settlements. Their intermediate landfalls remain uncertain.",
        note: "Other work favors earlier, incremental settlement in the southern Cook Islands. This is one published chronology, not a settled universal start date.",
        recordIds: ["history-west-east-polynesia-migration"], scope: "pacific", center: [-160, -16], zoom: 3,
      },
      {
        id: "hawaii-arrival", year: 1100, title: "A connection reaches Hawaiʻi",
        body: "People reached Hawaiʻi through a long ocean crossing from East Polynesia. One combined archaeological and environmental model places their arrival between 940 and 1130 CE. The particular homeland islands and courses of the founding voyages remain unresolved.",
        note: "Published arrival models differ. This is an arrival window; it does not date the end of later return voyages or exchange.",
        recordIds: ["context-hawaii-arrival", "hawaii-athens2014-model"], scope: "pacific", center: [-153, 5], zoom: 3,
      },
      {
        id: "rapa-nui-arrival", year: 1250, title: "Toward Rapa Nui",
        body: "Rapa Nui was settled during a later founding pulse into the far eastern Pacific in the chronology used here. Its founding population had connections with central Polynesia. Archaeology supports that regional relationship, while the precise departure islands remain uncertain.",
        note: "The approximate regional window is not a measured duration of migration. Mangareva is a schematic origin proxy.",
        recordIds: ["history-central-polynesia-rapanui", "history-rapa-nui-regional-occupation"], scope: "pacific", center: [-122, -25], zoom: 3,
      },
      {
        id: "communities-after-arrival", year: 1300, title: "Arrival is a beginning",
        body: "Rapanui communities continued living on the island after its founding period. Habitation evidence also records the longer histories of communities in Tonga and Samoa. These later occupations extend the story beyond the migrations that first brought people to each island group.",
        note: "Regional presence does not prove uninterrupted occupation at every site. The record’s later boundary is not extinction or abandonment.",
        recordIds: ["history-rapa-nui-regional-occupation", "history-tonga-regional-occupation", "history-american-samoa-regional-occupation"], scope: "pacific", center: [-148, -20], zoom: 1.8,
      },
    ],
  },
  {
    id: "hawaii-connections", title: "Hawaiʻi in a connected Pacific", subtitle: "Arrival, island exchange, and ocean trade",
    description: "Hawaiian communities remained connected: distinguish settlement models, sourced tools, and documented maritime commerce.",
    scenes: [
      {id:"hawaii-founding",year:1100,title:"Across the open ocean",body:"An East Polynesian migration brought people to Hawaiʻi. One arrival model places settlement in 940–1130 CE; precise departure islands and individual voyages remain unresolved.",note:"The route is a regional relationship. Alternative chronologies remain in the evidence library.",recordIds:["context-hawaii-arrival"],scope:"pacific",center:[-154,8],zoom:3},
      {id:"hawaii-valleys",year:1350,title:"Communities after arrival",body:"Pololū Valley preserves evidence of continuing habitation on Hawaiʻi Island. People occupied the valley after the founding period, adding a local settlement history to the wider story of migration and island connections.",note:"One inhabited valley is positive evidence of people, not a map of every Hawaiian settlement.",recordIds:["history-hawaii-island-regional-occupation","hawaii-local-lapakahi"],scope:"pacific",center:[-156.4,20.5],zoom:45},
      {id:"hawaii-island-exchange",year:1700,title:"Tools move between islands",body:"Basalt used at Kahikinui on Maui came from several islands. These sourced objects make interisland exchange visible alongside local settlement and agricultural growth.",note:"The archaeological contexts span roughly 1400–1800. They do not provide an annual shipping schedule or a known date when contact stopped.",recordIds:["context-hawaii-maui-adzes","context-lanai-maui-adzes","context-kahoolawe-maui-adzes","context-oahu-maui-adzes","context-kahikinui-community"],scope:"pacific",center:[-156.8,20.8],zoom:45},
      {id:"hawaii-contested-islands",year:1782,title:"Rival rulers, connected islands",body:"Kamehameha and his allies fight Kīwalaʻō in south Kona while Kahekili retakes Kaʻuiki in east Maui. These are separate conflicts within a connected archipelago, not an inevitable march toward one kingdom.",note:"The named headland is known. Regional battle references do not pretend to locate every fighter or defensive wall.",recordIds:["hawaii-local-mokuohai","hawaii-local-kauiki"],scope:"pacific",center:[-156.3,20.3],zoom:65},
      {id:"hawaii-kepaniwai",year:1790,title:"War in ʻĪao Valley",body:"Kamehameha’s army defeats the Maui defenders at Kepaniwai. On Hawaiʻi Island, work begins at Puʻukoholā. The military campaign and the construction of the heiau belong to the same period of political change across the archipelago.",note:"A valley reference locates the event without inventing a battlefield boundary. The displayed year does not mean continuous fighting for twelve months.",recordIds:["hawaii-local-kepaniwai","hawaii-local-puukohola"],scope:"pacific",center:[-156.49,20.86],zoom:220},
      {id:"hawaii-kawaihae",year:1791,title:"A temple, a naval battle, a killing",body:"Puʻukoholā is completed. Kamehameha’s fleet defeats the invading coalition near Waipiʻo. Keōua and companions are killed after arriving at Kawaihae; accounts differ about the planning and immediate circumstances.",note:"Documented construction, an approximate sea-battle location, and disputed responsibility are separate kinds of evidence.",recordIds:["hawaii-local-puukohola","hawaii-local-waipio-sea-battle","hawaii-local-keoua-killed"],scope:"pacific",center:[-155.72,20.06],zoom:230},
      {id:"hawaii-nuuanu",year:1795,title:"The struggle for Oʻahu",body:"Kamehameha’s forces defeat Kalanikūpule in the Nuʻuanu campaign. Fighting culminates at the pali, the steep cliffs above the valley. The campaign extends across a much wider inhabited landscape than that final battlefield.",note:"We show the named parties and year. No precise casualty total or reconstructed tactical positions are added.",recordIds:["hawaii-local-nuuanu"],scope:"pacific",center:[-157.88,21.39],zoom:300},
      {id:"hawaii-ocean-commerce",year:1828,title:"A Hawaiian port in a wider world",body:"Hawaiian ports provision whalers and China-trade vessels. Lumber and salmon travel from the Columbia River, while Hawaiian people, goods and labor connect the islands with the Pacific coast. Lahaina is the capital of the Hawaiian Kingdom.",note:"These are selected documented trade windows, not the complete network. The rest of the atlas remains visible at the same year.",recordIds:["context-hawaii-china","context-hawaii-columbia","context-hawaii-whaling","context-lahaina-capital"],scope:"pacific",center:[-160,29],zoom:2},
    ],
  },
  {
    id: "built-places",
    title: "Places people built",
    subtitle: "Five places, different kinds of dates",
    description: "Explore monumental construction, urban life, and the surviving buildings of Caral, Teotihuacan, Chaco, Cahokia, and Tenochtitlan.",
    scenes: [
      {
        id: "caral-construction", year: -2400, title: "Building at Caral",
        body: "Plant fibers associated with construction and occupation help date contexts at Caral in Peru’s Supe Valley. Nearby regional research describes many large centers with monumental and residential architecture. Together these records place Caral within a broader landscape of building, rather than an isolated monument.",
        note: "The date ranges summarize sampled contexts. They do not date every building or establish occupation in every intervening year.",
        recordIds: ["south-caral-dated-contexts", "r4-norte-chico-centers"], scope: "americas", center: [-77.5, -10.9], zoom: 7,
      },
      {
        id: "teotihuacan-city", year: 400, title: "An urban landscape at Teotihuacan",
        body: "Teotihuacan developed into a planned city with extensive residential remains during the first through seventh centuries. Its archaeology brings homes into view alongside the city's monumental architecture. The broad chronology describes urban development over centuries, rather than a single building campaign.",
        note: "This broad urban phase is not the exact date of each building, first occupation, or final reuse.",
        recordIds: ["south-teotihuacan-urban-development"], scope: "americas", center: [-98.84, 19.69], zoom: 7,
      },
      {
        id: "chaco-great-houses", year: 1000, title: "Chaco’s great houses",
        body: "Chaco Canyon’s great houses formed part of a regional ceremonial and economic center. These large buildings provided spaces used by residents and visitors. Their architecture reveals the scale of construction, while the numbers of occupants and the uses of particular rooms remain debated.",
        note: "The regional phase is approximate; household numbers and the balance of residence, gathering, and ceremony remain interpretive.",
        recordIds: ["chaco-regional-center"], scope: "americas", center: [-107.96, 36.06], zoom: 7,
      },
      {
        id: "cahokia-urban-phase", year: 1150, title: "Cahokia’s urban phase",
        body: "Cahokia grew into a large urban place during its Mississippian phase. Its built landscape belongs to a distinct regional history east of Chaco. The two centers offer different examples of how communities concentrated people, construction, and activity in major gathering places.",
        note: "The urban interval does not define the first or last human presence in the region, and no population total is inferred here.",
        recordIds: ["cahokia-urban"], scope: "americas", center: [-90.06, 38.66], zoom: 7,
      },
      {
        id: "templo-mayor-phase", year: 1400, title: "One surviving stage at Templo Mayor",
        body: "At Tenochtitlan, a surviving stage of the Templo Mayor preserves part of the Mexica capital’s architectural history. INAH associates Stage II with rulers’ reigns between 1376 and 1427. The building was one phase in the development of an already established city.",
        note: "Stage II is the earliest excavated surviving stage described by this source, not the founding date of Tenochtitlan.",
        recordIds: ["site-templomayor-stageii"], scope: "americas", center: [-99.13, 19.43], zoom: 8,
      },
    ],
  },
  {
    id: "pacific-exchange",
    title: "Islands exchanging with islands",
    subtitle: "Different networks, different evidence windows",
    description: "Stone tools and pearl shell reveal exchange among Pacific island communities, including networks that flourished, weakened, or resumed at different times.",
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
        body: "Mangaia received stone from Eiao, Samoa, and Rurutu during different periods. The dated evidence for Eiao’s connection ends earlier than the sampled Samoan and Rurutu connections. These differences reveal changing relationships among particular islands, although they cannot date the end of all exchange with the Marquesas.",
        note: "A final dated context is an evidence boundary, not necessarily the last voyage. Missing years remain gaps in this record.",
        recordIds: ["history-eiao-cooks-exchange", "history-samoa-mangaia-exchange", "history-rurutu-mangaia-exchange"], scope: "pacific", center: [-153, -17], zoom: 3,
      },
      {
        id: "regional-decline", year: 1451, title: "Decline in one southeastern network",
        body: "Exchange among Mangareva, Pitcairn, and Henderson declined around 1450. Rurutu and Mangaia remained connected during a later dated period. Henderson’s occupation also continued beyond the decline of its exchange network, showing that settlement and long-distance supply had different histories.",
        note: "The year shown is just beyond a rounded boundary. It is not the date of an abrupt final voyage or island-wide abandonment.",
        recordIds: ["history-mangareva-pitcairn-henderson", "history-rurutu-mangaia-exchange"], scope: "pacific", center: [-142, -23], zoom: 2.5,
      },
      {
        id: "later-samoan-links", year: 1550, title: "Later evidence of Samoan connections",
        body: "Samoan stone appears again in later dated contexts on Mangaia and Tonga. The tools attest to continuing or renewed relationships between these island communities. Gaps between sampled deposits leave the frequency of voyages uncertain.",
        note: "Tools could be kept or transferred indirectly. The evidence does not distinguish every new voyage from later deposition of older objects.",
        recordIds: ["history-samoa-mangaia-exchange", "history-samoa-tonga-exchange"], scope: "pacific", center: [-166, -18], zoom: 3.5,
      },
      {
        id: "beyond-sampled-exchange", year: 1673, title: "Beyond the sampled exchange windows",
        body: "Communities in Tonga and Samoa continued living in the region after the latest exchange episodes sampled here. The dated stone tools illuminate some of their overseas relationships, while habitation evidence records a longer history of island life.",
        note: "These endpoints limit the displayed evidence. They do not prove that all inter-island exchange ceased.",
        recordIds: ["history-samoa-mangaia-exchange", "history-samoa-tonga-exchange", "history-tonga-regional-occupation", "history-american-samoa-regional-occupation"], scope: "pacific", center: [-170, -18], zoom: 3,
      },
    ],
  },
  {
    id: "connected-oceans",
    title: "Ports, crossings, and colonial systems",
    subtitle: "Pacific and Atlantic routes with different endings",
    description: "Follow colonial ports, Pacific crossings, Atlantic convoys, and the people and goods carried through these shipping systems.",
    scenes: [
      {
        id: "colonial-port-lineages", year: 1519, title: "Ports with different founding histories",
        body: "Havana’s settlement at its present bay and Veracruz’s municipal foundation both date to 1519. Veracruz subsequently relocated more than once. These towns developed into colonial ports on coasts that already had long histories of human occupation.",
        note: "Havana refers to its present site; Veracruz refers to a municipal lineage, not one unchanging location.",
        recordIds: ["history-havana-current-site", "history-veracruz-lineage"], scope: "atlantic", center: [-89, 22], zoom: 4,
      },
      {
        id: "existing-capital", year: 1522, title: "A colonial transition in an existing city",
        body: "After the conquest of Tenochtitlan, colonial planners began reshaping the existing Mexica capital in late 1521 and early 1522. Mexico City developed through this political and urban transformation of an inhabited Indigenous city.",
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
        body: "Returning fleets from Veracruz assembled at Havana before crossing the Atlantic toward Spain. In 1715, a hurricane wrecked a convoy along Florida’s Atlantic coast. The losses were part of the history of this organized colonial shipping system.",
        note: "The fleet marker groups multiple vessels. Route motion shows an intermittently operating system, not a departure in every displayed year.",
        recordIds: ["history-veracruz-havana-fleets", "history-havana-spain-fleets", "history-spanish-fleet-1715"], scope: "atlantic", center: [-48, 29], zoom: 1.5,
      },
      {
        id: "atlantic-system-boundary", year: 1779, title: "The organized fleet system ends",
        body: "The Spanish Atlantic fleet system ended in 1778. That change closed a particular form of organized convoy shipping. Ports such as Havana had longer histories, and the convoy system’s endpoint does not date the end of their commerce.",
        note: "The system’s beginning is a decade-level estimate. Its operation was intermittent, and later independent shipping continued.",
        recordIds: ["history-veracruz-havana-fleets", "history-havana-spain-fleets", "history-havana-current-site", "history-spanish-fleet-1715"], scope: "atlantic", center: [-77, 24], zoom: 3,
      },
      {
        id: "after-the-galleon-system", year: 1816, title: "Beyond the galleon system",
        body: "The Manila galleon system conventionally ends in 1815. For centuries, its eastbound and westbound crossings had linked Asia and the Americas through colonial shipping. This endpoint marks the closure of that system within a longer history of trans-Pacific commerce, migration, and travel.",
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
  ...sixGuideStories,
  ...expansionStories,
  ...earlyContinuityStories, ...comingSoonAStories, ...comingSoonBStories,
  northernStory,
];
