"""Prepare a scoped Cliopatria derivative; never infer missing historical polygons.

Input: official pinned archive and metadata retained outside the repository.
Output: broad annual reconstructions; source license remains CC BY 4.0.
Requires shapely (local --python-libs can be supplied). No network access.
"""
import argparse, hashlib, json, re, sys, unicodedata, zipfile
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument("--source-dir",type=Path,required=True)
parser.add_argument("--python-libs",type=Path)
args=parser.parse_args()
if args.python_libs:sys.path.insert(0,str(args.python_libs.resolve()))
from shapely.geometry import shape,mapping,MultiPolygon,box
from shapely.geometry.polygon import orient
from shapely.validation import make_valid

ROOT=Path(__file__).resolve().parents[1]
SOURCE=args.source_dir.resolve()
COMMIT="5f433377139a6eeaeacbdc894b70f8805b72c8b5"
HASH="e10a4e429fca708788ff9e7572a95fce801fae55852d217cffabc1c59cd4eed4"
ARCHIVE=SOURCE/"cliopatria.geojson.zip"
assert hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()==HASH,"Unexpected archive; review the changed source before rebuilding"
assert "Creative Commons Attribution 4.0" in (SOURCE/"LICENSE.md").read_text(encoding="utf-8"),"Dataset reuse terms missing"
with zipfile.ZipFile(ARCHIVE) as z:
    members=[n for n in z.namelist() if n.endswith(".geojson")]
    assert len(members)==1
    member=members[0]
    source=json.loads(z.read(member))

# These are selection envelopes, NOT clipping polygons. Only complete source
# components wholly in the Americas are retained. No modern national borders
# or invented straight crop edges enter a historical reconstruction.
AMERICAS=box(-170,-57,-30,85)
LATIN=box(-125,-57,-30,34)
CUBA=box(-85.5,19.5,-73.8,24.2)
PUERTO_RICO=box(-67.5,17.6,-65.1,18.7)

NAMES={
 "Argentine Confederation":"Argentina",
 "Bolivia":"Bolivia",
 "Centralist Mexico":"Mexico — centralist polity",
 "Dominican Republic":"Dominican Republic",
 "Empire of Brazil":"Empire of Brazil",
 "Empire of Haiti":"Haiti",
 "Federated Republic of Mexico":"Mexico — federal republican territories",
 "First Mexican Empire":"First Mexican Empire",
 "Gran Colombia":"Gran Colombia",
 "Granadine Confederation":"Granadine Confederation",
 "Guatemala":"Guatemala",
 "Honduras":"Honduras",
 "Mexicans":"Mexican insurgent territories",
 "Mexico":"Mexico",
 "Mosquito Kingdom":"Miskitu kingdom",
 "Oriental Republic of Uruguay":"Uruguay",
 "Paraguay":"Paraguay",
 "Peru-Bolivian Confederation":"Peru–Bolivian Confederation",
 "Republic of Chile":"Chile",
 "Republic of Colombia":"United States of Colombia",
 "Republic of Costa Rica":"Costa Rica",
 "Republic of Ecuador":"Ecuador",
 "Republic of El Salvador":"El Salvador",
 "Republic of New Granada":"Republic of New Granada",
 "Republic of Nicaragua":"Nicaragua",
 "Republic of Peru":"Peru",
 "Republic of Venezuela":"Venezuelan republican territories",
 "Riograndense Republic":"Riograndense Republic",
 "Río de la Plata":"Río de la Plata polities",
 "Second Mexican Empire":"Second Mexican Empire",
 "State of Buenos Aires":"State of Buenos Aires",
 "United Provinces of Central America":"Central American Federation",
 "United States of Colombia":"United States of Colombia",
 "Venezuela":"Venezuela"
}
COLONIAL={
 "(Spanish Empire)":"Spanish American colonial possessions",
 "First Spanish Republic":"Spanish American colonial possessions",
 "(British Empire)":"British American colonial possessions",
 "(Portuguese Empire)":"Portuguese American colonial possessions",
 "(Bourbon Kingdom of France)":"French American colonial possessions",
 "(French Second Republic)":"French American colonial possessions",
 "(Second French Empire)":"French American colonial possessions",
 "(French Third Republic)":"French American colonial possessions",
 "Netherlands Antilles":"Dutch American colonial possessions"
}
EARLY={
 "Crown of Castile":"Castilian American colonial claims",
 "(Spanish Empire)":"Spanish American colonial claims",
 "(Portuguese Empire)":"Portuguese American colonial claims"
}
AUDIT=[]
def parts(g):
    if g.geom_type=="Polygon":return [g]
    if hasattr(g,"geoms"):return [p for child in g.geoms for p in parts(child)]
    return []
def rounded(value):
    if isinstance(value,(tuple,list)):return [rounded(v) for v in value]
    if isinstance(value,dict):return {k:rounded(v) for k,v in value.items()}
    return round(value,5) if isinstance(value,float) else value
def slug(value):
    value=unicodedata.normalize("NFKD",value).encode("ascii","ignore").decode()
    return re.sub("[^a-z0-9]+","-",value.lower()).strip("-")
def src(id,title,url,note,license="Source linked for chronology/label checking; no source text or geometry reproduced."):
    return dict(id=id,title=title,url=url,license=license,note=note)

sources=[
 src("cliopatria-data","Bennett et al. / Seshat Global History Databank — Cliopatria",
     f"https://github.com/Seshat-Global-History-Databank/cliopatria/tree/{COMMIT}",
     "Official data LICENSE.md explicitly permits reuse under CC BY 4.0. This derivative selects source rows and whole American polygon components, omits contradictory periods, simplifies at 0.02 degrees, rounds to five decimals and reverses rings for D3. No endorsement implied. The CC BY source geometry is not made exclusively noncommercial by the atlas's separate licensing.",
     "CC BY 4.0; source geometry and this prepared geometry derivative retain CC BY 4.0. https://creativecommons.org/licenses/by/4.0/"),
 src("cliopatria-methods","Bennett et al. (2025), Cliopatria — a geospatial database of world-wide political entities, Scientific Data 12:247",
     "https://doi.org/10.1038/s41597-025-04516-9",
     "Digitized historical-atlas reconstruction at irregular temporal resolution; approximate boundaries and territorial disputes are not encoded. Selection is not a map of every polity or Indigenous territory.","CC BY 4.0 (article); data reuse verified separately in repository LICENSE.md."),
 src("gran-colombia-chronology","Banco de la República — El proyecto grancolombiano",
     "https://enciclopedia.banrepcultural.org/El_proyecto_grancolombiano",
     "Gran Colombia dissolution is placed in 1831. The source dataset's 1830–1833 polygon is omitted rather than stretched over the breakup."),
 src("central-america-chronology","U.S. Department of State, Office of the Historian — Central American Federation",
     "https://history.state.gov/countries/central-american-federation",
     "Formation in 1823 and dissolution process during 1838–1840. Only source phases through 1837 are retained; no complete federation is shown after secessions begin."),
 src("peru-bolivia-chronology","Congreso de la República del Perú — Archivo Digital de la Legislación del Perú",
     "https://leyes.congreso.gob.pe/constituciones.aspx",
     "Confederation established 28 October 1836; separate 1839 Peruvian constitution. The transition year 1839 is omitted because the annual source cannot show the collapse precisely."),
 src("argentina-label","Museo Histórico Sarmiento — Disolución de la Confederación Argentina",
     "https://museosarmiento.cultura.gob.ar/noticia/disolucion-de-la-confederacion-argentina/",
     "Confederation dissolved in December 1861. Generic Argentina labels avoid carrying the source's Confederation name through 1885."),
 src("colombia-label","Banco de la República — Constituciones de Colombia",
     "https://enciclopedia.banrepcultural.org/index.php/Constituciones_de_Colombia",
     "Constitutional titles distinguish Estados Unidos de Colombia (1863) from República de Colombia (1886). The dataset's generic Republic of Colombia label for 1866–1885 is corrected without changing its polygon."),
 src("brazil-chronology","Arquivo Nacional, Brasil — Período Imperial (1822 a 1889)",
     "https://mapa.an.gov.br/index.php/assuntos/79-producao/80-cronologia/509-periodo-imperial-1822-a-1889",
     "Brazil's independence was proclaimed in 1822. The source Portuguese 1820–1823 phase is restricted to 1820–1821 to avoid extending the undifferentiated colonial polygon over the new empire."),
 src("hispaniola-chronology","U.S. Department of State, Office of the Historian — Dominican Republic",
     "https://history.state.gov/countries/dominican-republic",
     "Dominican independence in 1844 and Spanish rule 1861–1865. Omit source Haiti coverage in 1844–1845 and withhold Dominican colonial components rather than extend an undifferentiated Spanish source phase."),
 src("haiti-label","Library of Congress, Federal Research Division — Country Profile: Haiti",
     "https://tile.loc.gov/storage-services/master/frd/copr/Haiti.pdf",
     "The republic was suspended during the 1849–1859 empire. Generic Haiti labels avoid the source's Empire of Haiti label across incompatible regimes."),
 src("dutch-label","Nationaal Archief — Koloniale geschiedenis",
     "https://www.nationaalarchief.nl/onderzoeken/zoekhulpen/koloniale-geschiedenis",
     "Historical West Indies coverage includes Suriname and the Antilles. Generic Dutch American possessions avoids applying the source's Netherlands Antilles label to mainland Suriname.")
]
sources += [
 src("spanish-caribbean-scope","Ministerio de Cultura, España — The Last Territories",
     "https://www.cultura.gob.es/en/cultura/archivos/difusion/mc-difusion/bicentenarios/contexto-historico/las-ultimas-posesiones.html",
     "Cuba and Puerto Rico remained Spanish after continental independence. From 1824 onward retain only their whole source components; reject stale Lima, La Paz, Chiloé, Río Negro and Falkland components. Dominican annexation is not reconstructed here."),
 src("mexico-first-empire-end","Palacio Nacional, México — Abdicación de Agustín de Iturbide",
     "https://www.gob.mx/palacionacional/articulos/129906",
     "Abdication in March 1823; omit the source's 1823 imperial year rather than show the empire in the December 31 snapshot."),
 src("mexico-second-empire-end","Archivo General de la Nación, México — La toma de Querétaro",
     "https://www.gob.mx/agn/articulos/agnrecuerda-el-15-de-mayo-la-toma-de-queretaro?idiom=es",
     "Collapse and execution of Maximilian in 1867; omit the terminal 1867 imperial source year."),
 src("mexico-centralism","INEHRM — Centralismo",
     "https://www.inehrm.gob.mx/es/Constitucion1917/Centralismo",
     "Centralist bases promulgated in December 1835 and regime lasted eleven years. Omit the 1835 federal transition and 1846–1847 centralist overrun; federalist source areas during centralism are labeled as territories rather than the national constitution."),
 src("riograndense-end","Memorial do Rio Grande do Sul — A Paz dos Caramurus",
     "https://memorial.rs.gov.br/wp-content/uploads/tainacan-items/88/689/CAD018_-A-Paz-dos-Caramurus.pdf",
     "Peace ended the conflict in 1845. Omit the 1845 terminal republican source year rather than assert continued year-end independence."),
 src("chile-reconquest","Biblioteca Nacional de Chile, Memoria Chilena — La reconquista española (1814–1817)",
     "https://www.memoriachilena.gob.cl/602/w3-article-3671.html",
     "Royalist victory at Rancagua in October 1814 began the reconquest. Omit the terminal 1814 independent Chile source snapshot.")
]
sources[0].update(download=f"https://raw.githubusercontent.com/Seshat-Global-History-Databank/cliopatria/{COMMIT}/cliopatria.geojson.zip",sha256=HASH,commit=COMMIT,archiveMember=member,downloadedAt="2026-11-15",
 licenseURL=f"https://github.com/Seshat-Global-History-Databank/cliopatria/blob/{COMMIT}/LICENSE.md")
rows=[]
for index,feature in enumerate(source["features"]):
    p=feature["properties"];name=p["Name"]
    if p["Type"]!="POLITY":continue
    original_start=int(p["FromYear"]);original_end=int(p["ToYear"])
    windows=[]
    if name in EARLY and original_start<=1700 and original_end>=1492:
        windows.append((max(original_start,1492),min(original_end,1700),EARLY[name],"colony"))
    if name in NAMES or name in COLONIAL:
        if original_start<=1885 and original_end>=1809:
            windows.append((max(original_start,1809),min(original_end,1885),(NAMES|COLONIAL)[name],"colony" if name in COLONIAL else "territory" if name in ["Mexicans","Republic of Venezuela"] else "nation"))
    for start,end,label,kind in windows:
        notes=[];ids=["cliopatria-data","cliopatria-methods"]
        if name=="Gran Colombia":
            end=min(end,1829);notes.append("The 1830–1833 breakup reconstruction is not published.");ids.append("gran-colombia-chronology")
        if name=="United Provinces of Central America":
            end=min(end,1837);notes.append("Coverage stops before the 1838–1840 dissolution process; this is not a claim that the federation legally ended in 1837.");ids.append("central-america-chronology")
        if name=="Peru-Bolivian Confederation":
            end=min(end,1838);notes.append("The 1839 transition year is omitted, not backdated as a legal dissolution in 1838.");ids.append("peru-bolivia-chronology")
        if name=="Argentine Confederation":ids.append("argentina-label");notes.append("Generic Argentina label replaces the source's persistent Confederation label.")
        if name=="Republic of Colombia":ids.append("colombia-label");notes.append("Historical constitutional name corrected for 1866–1885; original source label retained below.")
        if name=="Empire of Haiti":
            ids+=["haiti-label","hispaniola-chronology"]
            if original_start<1822:start=end+1;notes.append("Early divided Haitian polities are not represented adequately by this source row.")
            if original_start==1822:end=min(end,1843);notes.append("The 1844–1845 source overrun past Dominican independence is omitted.")
            notes.append("Generic Haiti label avoids implying one imperial regime throughout the source period.")
        if name in ["(Spanish Empire)","First Spanish Republic"] and start>=1824:
            label="Spanish Caribbean possessions (Cuba/Puerto Rico)"
            ids.append("spanish-caribbean-scope")
            notes.append("Only whole Cuba and Puerto Rico source components retained. Anachronistic mainland/southern enclaves and Dominican components are withheld; this is not a claim to the remainder of Spanish America.")
        if name=="First Mexican Empire":
            end=min(end,1822);ids.append("mexico-first-empire-end");notes.append("Terminal 1823 transition year omitted for the December 31 display.")
        if name=="Second Mexican Empire":
            end=min(end,1866);ids.append("mexico-second-empire-end");notes.append("Terminal 1867 transition year omitted for the December 31 display.")
        if name=="Centralist Mexico":
            end=min(end,1845);ids.append("mexico-centralism");notes.append("Centralist source overrun in 1846–1847 omitted.")
        if name=="Federated Republic of Mexico" and original_start==1834:
            end=min(end,1834);ids.append("mexico-centralism");notes.append("The 1835 constitutional transition year is omitted.")
        if name=="Federated Republic of Mexico" and 1836<=original_start<1846:
            label="Mexican federalist territories";kind="territory";ids.append("mexico-centralism");notes.append("Source depicts federalist areas during the centralist period, not an uninterrupted national federal constitution.")
        if name=="Riograndense Republic":
            end=min(end,1844);ids.append("riograndense-end");notes.append("Terminal 1845 transition year omitted for the December 31 display.")
        if name=="Republic of Chile" and original_start==1812:
            end=min(end,1813);ids.append("chile-reconquest");notes.append("The 1814 reconquest transition year is omitted.")
        if name=="Republic of Venezuela" and original_start==1814:
            start=end+1;notes.append("Single-year independence-war reconstruction omitted pending transition review.")
        if name=="(Portuguese Empire)" and start>=1809:
            ids.append("brazil-chronology");end=min(end,1821)
            if original_start==1815:start=end+1;notes.append("1815–1819 phase omitted: coarse Portuguese/French Guiana attribution overlaps the restoration period.")
        if name=="(Bourbon Kingdom of France)" and original_start==1848:start=end+1
        if name=="Netherlands Antilles":
            ids.append("dutch-label");start=max(start,1820);notes.append("Generic Dutch American possessions includes the source's Suriname and island components; no Netherlands Antilles constitutional entity is projected back.")
        if start>end:
            AUDIT.append(dict(sourceIndex=index,name=name,sourceStart=original_start,sourceEnd=original_end,disposition="omitted period",note=" ".join(notes)));continue
        raw=shape(feature["geometry"])
        repaired=not raw.is_valid
        if repaired:raw=make_valid(raw)
        components=parts(raw)
        selected=[]
        for component in components:
            if not AMERICAS.covers(component) or not component.intersects(LATIN):continue
            if name in ["(Spanish Empire)","First Spanish Republic"] and start>=1824:
                if not (CUBA.covers(component) or PUERTO_RICO.covers(component)):continue
            # Portuguese rows contain suspect unrelated Caribbean components.
            # Keep only the South American mainland component, without clipping.
            if name=="(Portuguese Empire)" and not (component.bounds[1]<0 and component.bounds[0]<-40):continue
            selected.append(component)
        if not selected:continue
        display=[]
        for component in selected:
            simplified=component.simplify(.02,preserve_topology=True)
            for part in parts(simplified):
                if not part.is_empty and part.area>0:display.append(orient(part,sign=-1))
        display.sort(key=lambda g:g.area,reverse=True)
        if not display:continue
        geometry=display[0] if len(display)==1 else MultiPolygon(display)
        points=[[round(g.representative_point().x,5),round(g.representative_point().y,5)] for g in display[:5]]
        note=(f"Broad Cliopatria reconstruction; original source row {index}: {name}, {original_start}–{original_end} inclusive. "
              "Whole American components selected; no European or Asian mainland and no modern-country backcasting. "
              "Annual January/December dates encode source-year coverage, not exact foundation, conquest or abolition days. "
              "The final displayed year is a coverage limit, not political abolition. Colonial claims and state outlines do not establish exclusive occupation or effective control; Indigenous territories and disputes are incompletely represented. "
              +" ".join(notes))
        rows.append(dict(id=f"cliopatria-{index}-{start}-{end}",name=label,kind=kind,start=f"{start:04d}-01-01",end=f"{end:04d}-12-31",
                         geometry=rounded(mapping(geometry)),labelPoint=points[0],labelPoints=points,detail="broad",sourceIds=list(dict.fromkeys(ids)),
                         precision="Coarse historical-atlas reconstruction with unquantified boundary uncertainty; simplified at 0.02 degrees. Not a survey, legal boundary, exhaustive polity map or population map.",
                         note=note,citation=f"Bennett et al. (2025), Scientific Data 12:247, doi:10.1038/s41597-025-04516-9; Cliopatria commit {COMMIT}, feature index {index}; CC BY 4.0.",
                         sourceRow=dict(index=index,name=name,start=original_start,end=original_end,type=p["Type"],wikipedia=p.get("Wikipedia"),wikidata=p.get("Wikidata"),seshatId=p.get("SeshatID"),
                                        geometrySha256=hashlib.sha256(json.dumps(feature["geometry"],sort_keys=True,separators=(",",":")).encode()).hexdigest(),
                                        originalComponents=len(components),retainedComponents=len(selected),invalidGeometryRepaired=repaired)))
rows.sort(key=lambda r:(r["start"],r["name"],r["id"]))
assert len({r["id"] for r in rows})==len(rows)
(ROOT/"data/early-national-boundaries.json").write_text(json.dumps(rows,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
(ROOT/"data/early-national-boundary-sources.json").write_text(json.dumps(sources,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(SOURCE/"selection-audit.json").write_text(json.dumps(AUDIT,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(dict(versions=len(rows),earlyVersions=sum(r["start"]<"1701" for r in rows),gapVersions=sum(r["start"]>="1809" for r in rows),labels=sorted({r["name"] for r in rows}),bytes=(ROOT/"data/early-national-boundaries.json").stat().st_size),ensure_ascii=True))
