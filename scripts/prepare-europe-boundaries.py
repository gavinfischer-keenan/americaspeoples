"""Rebuild Northern European historical outlines from three fingerprinted source files.
Download the files listed in SOURCES with their original licences. Requires Shapely 2.
Run python scripts/prepare-europe-boundaries.py --cliopatria PATH --cshapes PATH --ristat PATH.
Source years are coverage windows. The annual map samples 31 December.
"""
import argparse
import hashlib
import json
import sqlite3
import sys
import zipfile
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
for flag in ("cliopatria", "cshapes", "ristat"):
    parser.add_argument("--" + flag, type=Path, required=True)
parser.add_argument("--python-libs", type=Path)
parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "data/atlases/europe/boundaries.json")
args = parser.parse_args()
if args.python_libs:
    sys.path.insert(0, str(args.python_libs.resolve()))
from shapely import from_wkb, make_valid, union_all
from shapely.geometry import MultiPolygon, Point, box, mapping, shape
from shapely.geometry.polygon import orient

SHA = {
    "cliopatria": "e10a4e429fca708788ff9e7572a95fce801fae55852d217cffabc1c59cd4eed4",
    "cshapes": "9831764d2ad17e37bc009031829265621534de097f7b3e8d6928d1a828436279",
    "ristat": "807a7e531950a8f0c57517d13e43dfe781d09ac5309f7f4f02ab4cd3fe09c600",
}
for key, digest in SHA.items():
    if hashlib.sha256(getattr(args, key).read_bytes()).hexdigest() != digest:
        raise ValueError(f"Unexpected {key} edition. Review changes before rebuilding.")
COMMIT = "5f433377139a6eeaeacbdc894b70f8805b72c8b5"
SOURCES = []


def source(key, title, url, note, license="Linked chronology and interpretation.", **extra):
    SOURCES.append(dict(id=key, title=title, url=url, note=note, license=license, **extra))


source("cliopatria", "Cliopatria · Seshat Global History Databank", "https://seshat-db.com/core/cliopatria/",
       "Bennett et al., Scientific Data 12, 247 (2025), doi:10.1038/s41597-025-04516-9. Source rows and dates are retained. Selected components are simplified and wound for spherical display.",
       "CC BY 4.0 · https://creativecommons.org/licenses/by/4.0/", sha256=SHA["cliopatria"],
       download=f"https://raw.githubusercontent.com/Seshat-Global-History-Databank/cliopatria/{COMMIT}/cliopatria.geojson.zip")
source("cshapes", "CShapes-Europe · ETH Zürich, International Conflict Research", "https://icr.ethz.ch/data/cshapes/",
       "L.-E. Cederman, L. Girardin, C. Müller-Crepon and Y. Pengl, Nationalism and the Transformation of the State (2025). G. Schvitz et al., Mapping the International System (2022). Regional components selected, simplified and relabeled for crown and union distinctions.",
       "CShapes-derived geometry · CC BY-NC-SA 4.0 · https://creativecommons.org/licenses/by-nc-sa/4.0/", sha256=SHA["cshapes"],
       download="https://icr.ethz.ch/data/cshapes/CShapes-Europe.geojson")
source("ristat", "1897 Russian Empire governorates · International Institute of Social History",
       "https://doi.org/10.34894/NQOASN",
       "Gijs Kessler and Andrei Markevich, Electronic Repository of Russian Historical Statistics, 18th–21st centuries, https://ristat.org/, Version I (2020). Governorates prepared by Rombert Stapel, IISH. Eight Finnish governorates dissolved for a broad administrative outline.",
       "CC0 with requested source attribution · Dataverse edition 3.3.", sha256=SHA["ristat"],
       download="https://dataverse.nl/api/access/datafile/578936")
source("uk-crowns", "Union of the Crowns · UK Parliament",
       "https://www.parliament.uk/about/living-heritage/evolutionofparliament/legislativescrutiny/act-of-union-1707/overview/union-of-the-crowns/",
       "From 1603 England and Scotland shared a monarch while retaining separate political institutions.")
source("uk-unions", "Parliamentary kingdoms and their dates · UK Parliament", "https://api.parliament.uk/regnal-years/kingdoms",
       "The Kingdom of Great Britain began on 1 May 1707. The United Kingdom came into being on 1 January 1801.")
source("finland", "Tracing Finland’s eastern border · Finland Promotion Board",
       "https://finland.fi/life-society/tracing-finlands-eastern-border/",
       "Finland’s transfer from Sweden to Russia in 1809 and the addition of Old Finland in 1812 distinguish two administrative extents.")
source("norway", "The Storting marks 4 November · Norwegian Parliament",
       "https://www.stortinget.no/no/english/About-the-Storting/News-archive/Front-page-news/2013-2014/The-Storting-marks-4th-November",
       "In November 1814 Norway entered union with Sweden under its revised constitution.")
source("vienna", "Treaty of Vienna, 30 October 1864 · Danmarkshistorien, Lex",
       "https://danmarkshistorien.lex.dk/Wienertraktaten,_30._oktober_1864",
       "The Danish monarch ceded Schleswig, Holstein and Lauenburg. The year-end 1864 map uses the post-treaty outline.")
source("kalmar", "Erik of Pomerania and Kalmar · National Museum of Denmark",
       "https://natmus.dk/historisk-viden/temaer/kongeraekken/erik-7-af-pommern/",
       "The 1397 coronation connected three kingdoms through the crown.")
source("kalmar-end", "The Swedish wars · National Museum of Denmark",
       "https://natmus.dk/historisk-viden/temaer/militaerhistorie/flaadens-historie/svenskekrig-til-soes/",
       "The union's final dissolution came in 1523. Swedish participation had already varied.")
source("althingi", "A history of Alþingi · Icelandic Parliament", "https://www.althingi.is/pdf/Althingi2017_enska.pdf",
       "Assembly government, acceptance of the Norwegian crown in the 1260s and the 1874 constitution under the Danish crown.")
source("greenland", "Kujataa nomination dossier · Municipality of Kujalleq",
       "https://kujalleq.cowiplan.dk/media/1265/kujataa__unesco_nomination_2015.pdf",
       "The Western Settlement occupied fjords around Nuuk. The Eastern Settlement lay in southern Kujataa. Settlement localities do not delimit authority across Greenland.")
source("roman-frontier", "Frontiers of the Roman Empire in Britain · Historic England",
       "https://historicengland.org.uk/listing/the-list/list-entry/1000098",
       "Hadrian’s frontier began in 122; the later Antonine frontier lay farther north. Military reach, broad administration and a surveyed wall line describe different things.")
source("faroes", "The Faroes in the Norwegian and Danish monarchy · Government of the Faroe Islands",
       "https://www.faroeislands.fo/the-big-picture/history-of-the-faroe-islands/the-faroe-islands-in-the-norwegiandanish-monarchy",
       "The Faroes retained local jurisdiction under changing crowns. They remained with Denmark in 1814. The Løgting returned as an advisory county council in 1852.")
GAPS = [
    "Prehistoric occupation, languages and material cultures have no territorial outlines in this layer.",
    "Sámi homelands, seasonal movement, overlapping taxation and local authority cross the mapped crown outlines. Those outlines do not measure settlement or exclusive control.",
    "Roman coverage begins in 122. The first-century source includes Welsh and northern lands beyond secure early administration. The layer also omits second-century frontier phases when the geometry cannot reliably distinguish military reach from durable administration. No administrative boundary is inferred from a Roman road or fort.",
    "Medieval selections cover individual kingdoms or settlement districts where usable historical geometry survives. The Irish kingdoms, many Welsh and Scottish polities and Scandinavian power centres have substantial gaps.",
    "Greenland’s Western Settlement appears only for a dated source reconstruction. The source’s southern Norse polygon misses the documented Kujataa core, so it is omitted. Inuit territories and later trading-post jurisdictions are not reconstructed.",
    "Kalmar coverage starts with the available 1402 reconstruction. Its crown membership and authority fluctuated. Constitutional and military transitions with conflicting source geometries have gaps.",
    "Norway and Sweden share one exterior after 1814 where the source combines the two kingdoms. Their internal boundary and distinct institutions persist. Iceland has separate geometry where the source supports it.",
    "The 1809 Finnish outline approximates the Swedish territories transferred that year. After the 1812 transfer of Old Finland, the eight late-century governorates approximate the wider exterior. Minor interim border adjustments are unresolved.",
    "These regional selections omit overseas possessions, small islands and short-lived changes. Annual coverage ends in 1900.",
]
with zipfile.ZipFile(args.cliopatria) as archive:
    cli = json.loads(archive.read(next(n for n in archive.namelist() if n.endswith(".geojson"))))["features"]
eth = json.loads(args.cshapes.read_bytes())["features"]
britain = box(-12, 49.5, 2.2, 61.2)
ireland = box(-11, 51.2, -5.3, 55.5)
nordic = box(3, 53.2, 34, 72)
iceland = box(-25, 62.8, -12.8, 67.1)
faroes = box(-8, 61, -6, 63)
greenland_west = box(-53, 63.5, -49, 65.4)
rows = []


def polygons(g):
    if g.geom_type == "Polygon":
        yield g
    elif hasattr(g, "geoms"):
        for sub in g.geoms:
            yield from polygons(sub)


def components(raw, accept):
    g = shape(raw)
    return [p for p in polygons(g if g.is_valid else make_valid(g)) if accept(p)]


def rounded(value):
    if isinstance(value, (list, tuple)):
        return [rounded(item) for item in value]
    return round(value, 5)


def add(name, authority, start, end, parts, srcs, references, note, kind="nation"):
    if start > end:
        return
    display = []
    for p in parts:
        if p.area < 0.014:
            continue
        for q in polygons(p.simplify(0.055, preserve_topology=True)):
            display.append(orient(q, sign=-1))
    if not display:
        return
    display.sort(key=lambda g: g.area, reverse=True)
    g = display[0] if len(display) == 1 else MultiPolygon(display)
    xy = display[0].representative_point()
    coordinates = rounded(mapping(g)["coordinates"])
    citation = next(s["title"] + ". " + s["license"] for s in SOURCES if s["id"] == srcs[0])
    rows.append(dict(name=name, authority=authority, start=start, end=end, kind=kind, detail="broad",
                     geometry=dict(type=g.geom_type, coordinates=coordinates),
                     labelPoint=[round(xy.x, 5), round(xy.y, 5)], sourceIds=srcs, sourceRows=references, citation=citation,
                     precision="Historical regional reconstruction. Coastlines and borders are simplified at 0.055°; components below 0.014 square degrees are omitted. The lines carry no survey-level precision.",
                     note=note))


def rule(name, label, authority, lo, hi, accept, note, extra=(), kind="nation"):
    for i, f in enumerate(cli):
        p = f["properties"]
        if p["Name"] != name or p["Type"] != "POLITY":
            continue
        a, b = max(lo, p["FromYear"]), min(hi, p["ToYear"])
        if a <= b:
            add(label, authority, f"{a:04}-01-01", f"{b:04}-12-31", components(f["geometry"], accept),
                ["cliopatria", *extra], [f"Cliopatria {i}: {name}, {p['FromYear']}–{p['ToYear']}"], note, kind)


for name in ("Roman Empire", "Western Roman Empire"):
    for first, last in ((122,141),(154,159),(184,409)):
        rule(name, "Roman Britain · imperial territory", "imperial-territory", first, last, britain.covers,
             "The source reconstructs Rome’s changing British territory. Local authority varied across the frontier. Its outline is too coarse to trace Hadrian’s Wall or the Antonine Wall.", ["roman-frontier"], "territory")
for name in ("Kingdom of Wessex", "Kingdom of Mercia", "Kingdom of East Anglia", "Kingdom of Northumbria",
             "Kingdom of Gwynedd", "Strathclyde", "Kingdom of Alba", "Danelaw", "Kingdom of the Isles"):
    rule(name, name, "kingdom" if name != "Danelaw" else "regional-jurisdiction", 500, 1400, britain.covers,
         "Broad historical-atlas outline. Dated changes approximate the source’s reconstruction of shifting political authority." if name != "Danelaw" else
         "A broad region of Scandinavian law and political influence, with several centres of authority.", kind="territory" if name == "Danelaw" else "nation")
for name in ("Earldom of Ulster", "Irish Catholic Confederation"):
    rule(name, name, "crown-territory" if name.startswith("Earldom") else "confederation", 1100, 1648, ireland.covers,
         "Selected Irish territorial reconstruction. Political and military authority varied locally.", kind="territory")
main_britain = lambda g: britain.covers(g) and not ireland.covers(g)
for name in ("Kingdom of Scotland", "Kingdom of England", "Norman England"):
    rule(name, name, "kingdom", 930, 1602, main_britain,
         "The British components of the source kingdom are shown. Crown claims and local jurisdiction could differ.")
for name in ("Old Kingdom of Norway", "Kingdom of Sweden", "Kingdom of Denmark"):
    rule(name, name, "kingdom", 900, 1396, nordic.covers,
         "Selected northern components of the reconstructed kingdom. The crown outline gives no measure of local rule or Sámi territorial relationships.")
rule("Icelandic Commonwealth", "Icelandic Commonwealth", "autonomous-administration", 930, 1261, iceland.covers,
     "The Alþingi connected local assemblies. The source outline represents the island at regional scale. Coverage stops before acceptance of Norwegian royal authority.", ["althingi"], "territory")
rule("Old Kingdom of Norway", "Iceland under the Norwegian crown", "crown-territory", 1265, 1396, iceland.covers,
     "Iceland entered a relationship with the Norwegian crown in the 1260s. The island outline describes that jurisdiction.", ["althingi"], "territory")
rule("Norse Greenland", "Norse Greenland · Western Settlement district", "settlement-district", 1000, 1400, greenland_west.covers,
     "A generalized settlement district in the Nuuk fjord region. The outline indicates clustered Norse settlement. Inuit land use and movement extended beyond it.", ["greenland"], "territory")
rule("Kalmar Union", "Kalmar Union · crown territories", "shared-crown", 1397, 1522,
     lambda g: nordic.covers(g) or iceland.covers(g),
     "Separate kingdoms joined through the crown. Participation changed, particularly in Sweden. This outline follows the source’s footprint for each interval.", ["kalmar", "kalmar-end"])
rule("Denmark-Norway", "Denmark–Norway · composite monarchy", "shared-crown", 1524, 1813,
     lambda g: nordic.covers(g) or iceland.covers(g), "The outline groups northern territories under one monarch. Provincial law, royal rights and local authority differed.")
for name, low, high in [("Kingdom of Sweden", 1523, 1611), ("Swedish Empire", 1612, 1813)]:
    rule(name, "Swedish crown · northern territories", "kingdom", low, high, nordic.covers,
         "The Finnish provinces within this Swedish outline changed over time. In 1809 the crown ceded its remaining Finnish provinces to Russia.", ["finland"])
for n in ("Kingdom of England", "Kingdom of Scotland"):
    rule(n, n + " · shared monarch", "shared-crown", 1603, 1608, main_britain,
         "James VI and I held the crowns of England and Scotland. Separate laws and parliaments continued.", ["uk-crowns"])
for a,b in ((1609,1639),(1662,1706)):
    rule("Kingdom of England", "England and Scotland · shared crowns", "shared-crown", a,b, main_britain,
         "The source combines Britain’s territory. England and Scotland retained separate kingdoms and parliaments.", ["uk-crowns"])
for n in ("Kingdom of England", "Kingdom of Great Britain"):
    rule(n, "Kingdom of Great Britain", "state-union", 1707, 1800, main_britain,
         "England and Scotland entered parliamentary union on 1 May 1707. Ireland continued as a separate kingdom.", ["uk-unions"])
    rule(n, "Kingdom of Ireland", "kingdom", 1707, 1800, ireland.covers,
         "Ireland retained a separate kingdom and parliament under the shared monarch until the union of 1801.", ["uk-unions"])
rule("Kingdom of Great Britain", "United Kingdom of Great Britain and Ireland", "state-union", 1801, 1815, britain.covers,
     "Great Britain and Ireland entered parliamentary union on 1 January 1801.", ["uk-unions"])
for n,label in (("Kingdom of Norway","Norway · union with Sweden"),("Swedish Empire","Sweden · union with Norway")):
    rule(n,label,"shared-crown",1814,1814,nordic.covers,
         "The November settlement joined Norway and Sweden under one monarch. Norway retained its own constitution and parliament.", ["norway"])
rule("United Kingdoms of Sweden and Norway","Sweden and Norway · union of kingdoms","shared-crown",1815,1815,nordic.covers,
     "The kingdoms shared a monarch and maintained distinct institutions. Only their exterior is shown.", ["norway"])
rule("Denmark-Norway", "Danish monarchy · kingdom and duchies", "crown-territory", 1814, 1815, nordic.covers,
     "Northern components after Norway entered union with Sweden. The monarchy still held Schleswig and Holstein.", ["norway", "vienna"])
rule("Denmark-Norway", "Iceland under the Danish crown", "crown-territory", 1814, 1815, iceland.covers,
     "Iceland remained within the Danish monarchy after 1814.", ["althingi"], "territory")

for source_name, label, first, last, note in (
    ("Old Kingdom of Norway", "Faroe Islands under the Norwegian crown", 1200, 1379, "The Faroes maintained a distinct local jurisdiction under the Norwegian crown."),
    ("Kalmar Union", "Faroe Islands · Norwegian crown within the Kalmar Union", 1402, 1522, "The Faroes belonged to the Norwegian crown within the composite monarchy."),
    ("Denmark-Norway", "Faroe Islands · Danish–Norwegian monarchy", 1526, 1813, "Island jurisdiction and the Løgting continued under the dual monarchy."),
    ("Denmark-Norway", "Faroe Islands under the Danish crown", 1814, 1851, "The Faroes stayed under the Danish crown in 1814. The Løgting was abolished in 1816."),
    ("Denmark-Norway", "Faroe Islands · advisory Løgting", 1852, 1900, "The restored Løgting served as an advisory county council within the Danish monarchy.")):
    rule(source_name,label,"crown-territory",first,last,faroes.covers,note,["faroes"],"territory")

for i, feature in enumerate(eth):
    p = feature["properties"]
    source_name = p["Name"]
    if source_name not in ("Sweden", "Denmark", "United Kingdom", "Iceland") or p["From"] > 1900:
        continue
    start, end = f"{p['From']}-01-01", f"{min(p['To'],1900)}-12-31"
    refs = [f"CShapes-Europe {i}: {source_name}, {p['From']}–{p['To']}, holder {p['Holder']}"]
    if source_name == "Sweden":
        add("Sweden and Norway · union of kingdoms", "shared-crown", start, end, components(feature["geometry"], nordic.covers),
            ["cshapes","norway"], refs, "CShapes groups both kingdoms under Sweden. Their shared monarch and foreign policy coexisted with separate parliaments, laws and domestic government.")
    elif source_name == "United Kingdom":
        add("United Kingdom of Great Britain and Ireland", "state-union", start, end, components(feature["geometry"], britain.covers),
            ["cshapes","uk-unions"], refs, "The two islands are shown within the United Kingdom formed in 1801. Overseas territories are outside this selection.")
    elif source_name == "Denmark":
        if p["To"] == 1864:
            end = "1864-10-29"
        if p["From"] == 1865:
            start = "1864-10-30"
        prewar = end < "1864-10-30"
        add("Danish monarchy · kingdom and duchies" if prewar else "Danish kingdom after the Treaty of Vienna",
            "crown-territory" if prewar else "kingdom", start, end, components(feature["geometry"], nordic.covers),
            ["cshapes","vienna"], refs, "The duchies held by the monarch had distinct legal and political arrangements." if prewar else
            "The October 1864 treaty transferred the duchies. Its December map uses the postwar geometry that CShapes first labels 1865.")
    else:
        for lo, hi, label, note in ((1816,1873,"Iceland under the Danish crown", "Iceland remained within the Danish monarchy."),
                                   (1874,1900,"Iceland · constitution under the Danish crown", "The 1874 constitution granted Alþingi legislative and fiscal powers in domestic affairs. The crown retained a veto.")):
            a,b = max(lo,p["From"]), min(hi,p["To"])
            if a <= b:
                add(label,"crown-territory",f"{a}-01-01",f"{b}-12-31",components(feature["geometry"],iceland.covers),
                    ["cshapes","althingi"],refs,note,"territory")

# The regional transfer has distinct pre-/postwar polygons from the same historical
# atlas. Difference those versions, retaining the Finnish mainland and Åland components.
old_sweden = union_all(components(cli[10002]["geometry"], nordic.covers))
new_sweden = union_all(components(cli[10794]["geometry"], nordic.covers))
transfer = [p for p in polygons(old_sweden.difference(new_sweden)) if p.representative_point().x > 19 and p.bounds[1] > 59]
add("Grand Duchy of Finland · Swedish cessions", "autonomous-administration", "1809-09-17", "1811-12-31", transfer,
    ["cliopatria","finland"], ["Cliopatria 10002: Swedish Empire, 1763–1808", "Cliopatria 10794: Swedish Empire, 1809–1813"],
    "The lands ceded under the Treaty of Hamina formed an autonomous grand duchy of the Russian Empire. The footprint is estimated from the change between Swedish crown outlines. Old Finland remained outside it until 1812.", "territory")
# GeoPackage: WKB follows an 8-byte header and an envelope whose size is encoded in byte 3.
province_names = {"Vaasa","Abo-Björneborg","Häme","Kuopio","Mikkeli","Oulu","Uusimaa","Vyborg"}
provinces, references = [], []
with sqlite3.connect(args.ristat) as db:
    for fid, name, geom in db.execute("select fid,prov_ENG,geom from provinces_1897 order by fid"):
        if name.removesuffix(" governorate") in province_names:
            envelope = (geom[3] >> 1) & 7
            offset = 8 + {0:0,1:32,2:48,3:48,4:64}[envelope]
            provinces.append(make_valid(from_wkb(geom[offset:])))
            references.append(f"RISTAT 1897: {fid}, {name}")
assert len(provinces) == 8
add("Grand Duchy of Finland · Russian Empire", "autonomous-administration", "1812-01-01", "1900-12-31",
    polygons(union_all(provinces)), ["ristat","finland"], references,
    "The autonomous grand duchy included Old Finland from 1812. The regional outline is generalized from its eight governorates in 1897. It includes Vyborg and excludes Petsamo. Small islands, including Åland, and local border adjustments within the century are unresolved in this mainland reconstruction.", "territory")

# Mark externally supported constitutional dates where they fall inside atlas source intervals.
for row in rows:
    if row["name"] == "Kingdom of Great Britain" and row["start"] == "1707-01-01":
        row["start"] = "1707-05-01"
    if row["name"] == "England and Scotland · shared crowns" and row["end"] == "1706-12-31":
        row["end"] = "1707-04-30"
    if row["name"] in ("Norway · union with Sweden", "Sweden · union with Norway"):
        row["start"] = "1814-11-04"
    if row["name"] == "Swedish crown · northern territories" and row["end"] == "1808-12-31":
        row["end"] = "1809-09-16"
    if row["name"] == "Swedish crown · northern territories" and row["start"] == "1809-01-01":
        row["start"] = "1809-09-17"

# Collapse adjacent periods ONLY when geometry, label, authority and sources agree.
# Keep all original row references, including when source editions split for changes outside this region.
from datetime import date, timedelta
from itertools import groupby
rows.sort(key=lambda r:(r["name"],r["start"]))
merged = []
for name, group in groupby(rows, key=lambda r:r["name"]):
    previous = None
    for row in group:
        contiguous = previous and date.fromisoformat(previous["end"]) + timedelta(days=1) == date.fromisoformat(row["start"])
        if contiguous and all(previous[k] == row[k] for k in ("geometry","sourceIds","authority","note","kind")):
            previous["end"] = row["end"]
            previous["sourceRows"].extend(row["sourceRows"])
        else:
            previous = row
            merged.append(row)
for row in merged:
    identity = (row["name"] + row["start"] + row["sourceRows"][0]).encode()
    row["id"] = "europe-boundary-" + hashlib.sha256(identity).hexdigest()[:12]
merged.sort(key=lambda r:(r["start"],r["name"],r["id"]))
assert len({r["id"] for r in merged}) == len(merged)
args.output.parent.mkdir(parents=True, exist_ok=True)
bundle = dict(schemaVersion=1, boundaries=merged, sources=SOURCES, gaps=GAPS)
args.output.write_text(json.dumps(bundle, ensure_ascii=False, separators=(",",":")) + "\n", encoding="utf-8")
print(f"{len(merged)} dated polygons, {len(SOURCES)} sources, {len(GAPS)} coverage notes, {args.output.stat().st_size:,} bytes")
