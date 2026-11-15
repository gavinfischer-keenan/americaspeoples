"""Rebuild public geography. Requires pyshp and shapely; no downloads or production writes.
Usage: python scripts/prepare-historical-geography.py --source-dir PATH
Inputs are the explicitly named archives recorded in the output source manifest.
"""
import argparse, datetime, hashlib, io, json, zipfile
from pathlib import Path
import shapefile
from shapely.geometry import shape, mapping
from shapely.geometry.polygon import orient
from shapely.ops import transform

parser=argparse.ArgumentParser();parser.add_argument('--source-dir',type=Path,required=True);args=parser.parse_args()
root=Path(__file__).resolve().parents[1];source=args.source_dir.resolve()
def reader(name):
    z=zipfile.ZipFile(source/name);base=next(n[:-4] for n in z.namelist() if n.endswith('.shp'))
    return shapefile.Reader(shp=io.BytesIO(z.read(base+'.shp')),shx=io.BytesIO(z.read(base+'.shx')),dbf=io.BytesIO(z.read(base+'.dbf')),encoding='latin-1')
def rounded(o):
    if isinstance(o,(list,tuple)):return [rounded(x) for x in o]
    if isinstance(o,dict):return {k:rounded(v) for k,v in o.items()}
    return round(o,5) if isinstance(o,float) else o
def geo(g):
    # D3 spherical polygon winding uses clockwise exterior rings.
    if g.geom_type=='Polygon':g=orient(g,sign=-1)
    elif g.geom_type=='MultiPolygon':
        from shapely.geometry import MultiPolygon
        g=MultiPolygon([orient(p,sign=-1) for p in g.geoms])
    return rounded(mapping(g))

rows=[]
for feature in reader('newberry-state-territories.zip').iterShapeRecords():
    d=feature.record.as_dict()
    if d['START_DATE'].year>1934 or d['ID']=='ds_deseret':continue # Proposed state, not an enacted state/territory.
    g=shape(feature.shape.__geo_interface__)
    if not g.is_valid:g=g.buffer(0)
    assert not g.is_empty
    anchor=g.representative_point()
    kind='state' if d['TERR_TYPE']=='State' else 'acquisition' if d['ID']=='la_purchase' else 'territory'
    rows.append(dict(id=f"newberry-{d['ID']}-{d['VERSION']}",name=d['FULL_NAME'],kind=kind,start=d['START_DATE'].isoformat(),end=d['END_DATE'].isoformat(),geometry=geo(g),labelPoint=[round(anchor.x,4),round(anchor.y,4)],sourceIds=['newberry-states'],precision='Newberry historical polygon generalized at 0.01 degree tolerance; not a cadastral survey.',note=d['CHANGE']+' This administrative or claimed extent does not establish exclusive occupation, actual control, or the absence of Indigenous communities.',citation=d['CITATION']))
(root/'data/historical-boundaries.json').write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
features=[]
for feature in reader('ne_10m_land.zip').iterShapes():
    g=shape(feature.__geo_interface__)
    if not g.is_valid:g=g.buffer(0)
    g=g.simplify(.005,preserve_topology=True)
    features.append({'type':'Feature','properties':{},'geometry':geo(g)})
(root/'data/land-detailed.geojson').write_text(json.dumps({'type':'FeatureCollection','features':features},separators=(',',':'))+'\n',encoding='utf-8')
sources=[dict(id='newberry-states',title='Newberry Library — Atlas of Historical County Boundaries: U.S. Historical States and Territories',url='https://publications.newberry.org/ahcb/pages/United_States.html',license='Newberry current reuse terms: any lawful purpose, commercial or non-commercial; obsolete archive license superseded by current download-page notice.',note='Dated source versions beginning 1783; annual display uses December 31. Claims and treaty dates may precede effective possession. '+ 'Reuse statement: https://publications.newberry.org/ahcb/downloads/states.html',download='https://publications.newberry.org/ahcb/downloads/gis/US_AtlasHCB_StateTerr_Gen01.zip',sha256=hashlib.sha256((source/'newberry-state-territories.zip').read_bytes()).hexdigest()),dict(id='natural-earth-land',title='Natural Earth 1:10 million land, version 5.1.1',url='https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/',license='Public domain',note='Present-day reference coastline. Simplified at 0.005 degree tolerance with small-island topology retained; not a navigation map or ancient shoreline reconstruction.',download='https://naciscdn.org/naturalearth/10m/physical/ne_10m_land.zip',sha256=hashlib.sha256((source/'ne_10m_land.zip').read_bytes()).hexdigest())]
(root/'data/boundary-sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'boundaryVersions':len(rows),'coastlineBytes':(root/'data/land-detailed.geojson').stat().st_size,'boundaryBytes':(root/'data/historical-boundaries.json').stat().st_size}))
