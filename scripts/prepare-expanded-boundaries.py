"""Prepare HGIS and CShapes derivatives from locally archived official sources.

Requires pyshp, shapely. Both derivatives retain CC BY-NC-SA 4.0.
No network access; inputs and hashes remain explicit in the source manifest.
"""
import argparse,datetime,hashlib,io,json,zipfile
from pathlib import Path
import shapefile
from shapely.geometry import shape,mapping,MultiPolygon,box
from shapely.geometry.polygon import orient

p=argparse.ArgumentParser();p.add_argument('--source-dir',type=Path,required=True);a=p.parse_args()
source=a.source_dir.resolve();root=Path(__file__).resolve().parents[1]
def rounded(x):
 if isinstance(x,(list,tuple)):return [rounded(v) for v in x]
 if isinstance(x,dict):return {k:rounded(v) for k,v in x.items()}
 return round(x,4) if isinstance(x,float) else x
def geometry(g):
 if not g.is_valid:g=g.buffer(0)
 g=g.simplify(.015,preserve_topology=True)
 if g.geom_type=='Polygon':g=orient(g,sign=-1)
 elif g.geom_type=='MultiPolygon':g=MultiPolygon([orient(v,sign=-1) for v in g.geoms])
 else:raise ValueError(g.geom_type)
 return g,rounded(mapping(g))
def anchors(g):
 parts=[g] if g.geom_type=='Polygon' else sorted(g.geoms,key=lambda p:p.area,reverse=True)
 return [[round(p.representative_point().x,4),round(p.representative_point().y,4)] for p in parts[:5] if p.area>=.04] or [[round(g.representative_point().x,4),round(g.representative_point().y,4)]]
epoch=datetime.datetime(1970,1,1)
rows=[];sources=[]
service='https://services2.arcgis.com/fKO2K6qiLNlgkZ2U/arcgis/rest/services/00_INDIAS_base_territorios_WFL1/FeatureServer/'
for layer in [1,4,10]:
 filename=f'hgis-features-{layer}.json';data=json.loads((source/filename).read_text(encoding='utf-8'))
 for f in data['features']:
  d=f['properties'];start=(epoch+datetime.timedelta(milliseconds=d['START'])).year;end=(epoch+datetime.timedelta(milliseconds=d['END_'])).year
  # The feature service represents inclusive annual snapshots, not event days.
  # Restrict to the project's documented 1701–1808 core coverage.
  start=max(start,1701);end=min(end,1808)
  if start>end or not f['geometry']:continue
  g,geo=geometry(shape(f['geometry']));points=anchors(g)
  label=d['Label'] or d['Nombre'];name=(d['Tipo']+' · '+label) if layer!=10 else label+' · claims in the Americas'
  note=f"HGIS {d['Nivel']} annual reconstruction; {d['Tipo']}; source entity {d['Entidad_ID']}. Source year ranges are preserved as inclusive calendar-year snapshots, not exact dates of creation. The first/last dataset year is a coverage boundary, not foundation, abandonment, or independence. Claims and administration do not establish exclusive occupation or effective control."
  rows.append(dict(id=f"hgis-{layer}-{d['OBJECTID']}",name=name,kind='colony',start=f'{start:04d}-01-01',end=f'{end:04d}-12-31',geometry=geo,labelPoint=points[0],labelPoints=points,detail='regional' if layer==1 else 'broad',sourceIds=[f'hgis-{layer}'],precision='Historical scholarly reconstruction; simplified at 0.015 degree tolerance. Not surveyed, legally definitive, or a map of all Indigenous territories.',note=note,citation='Werner Stangl, HGIS de las Indias, '+d['Nivel']+' / '+str(d['OBJECTID'])+'; '+(d.get('Wikilink') or '')))
 sources.append(dict(id=f'hgis-{layer}',title='Werner Stangl — HGIS de las Indias: '+{1:'Provincias',4:'Divisiones principales',10:'Colonias extranjeras'}[layer],url='https://www.hgis-indias.net',license='CC BY-NC-SA 4.0; derivative distributed under the same license.',note='Official feature service linked by the HGIS/Yale/EHESS interactive map. Downloaded 2026-11-15; filtered to documented core coverage 1701–1808, simplified, rounded, reoriented for display. No endorsement implied. License: https://creativecommons.org/licenses/by-nc-sa/4.0/ ; service item: https://www.arcgis.com/home/item.html?id=c79002d305f74820b27be4233e2d0d76',download=service+str(layer),sha256=hashlib.sha256((source/filename).read_bytes()).hexdigest()))
(root/'data/colonial-boundaries.json').write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
z=zipfile.ZipFile(source/'CShapes-2.0.zip');name='CShapes-2.0';r=shapefile.Reader(shp=io.BytesIO(z.read(name+'.shp')),shx=io.BytesIO(z.read(name+'.shx')),dbf=io.BytesIO(z.read(name+'.dbf')),encoding='latin-1')
national=[]
aliases={'Belize': ('British Honduras (British colony)', 'https://history.state.gov/countries/belize'), 'Guyana': ('British Guiana (British colony)', 'https://nationalarchives.gov.gy/other-collections/'), 'Surinam': ('Suriname (Dutch colony)', 'https://www.nationaalarchief.nl/onderzoeken/zoekhulpen/koloniale-geschiedenis')}
# Clip whole-world dependencies to the study region; never add European/Asian cities.
study=box(-180,-60,-25,85).union(box(110,-60,180,30))
for i,f in enumerate(r.iterShapeRecords()):
 d=f.record.as_dict()
 if d['gwsyear']>1934 or d['gweyear']<1886:continue
 if not (2<=d['gwcode']<=165 or 900<=d['gwcode']<=960 or d['gwcode'] in [1201,9401]):continue
 original=shape(f.shape.__geo_interface__)
 if not original.is_valid:original=original.buffer(0)
 g=original.intersection(study)
 if g.is_empty or g.area<.01:continue
 if g.geom_type=='GeometryCollection':g=MultiPolygon([p for p in g.geoms if p.geom_type=='Polygon'])
 g,geo=geometry(g);points=anchors(g)
 national.append(dict(id=f'cshapes-{i}',name=aliases.get(d['cntry_name'],(d['cntry_name'],''))[0],sourceName=d['cntry_name'],labelSource=aliases.get(d['cntry_name'],('',''))[1],kind='nation',start=d['gwsdate'].isoformat(),end=d['gwedate'].isoformat(),geometry=geo,labelPoint=points[0],labelPoints=points,sourceIds=['cshapes-2'],precision='CShapes 2.0 historical national/dependency geometry, simplified at 0.015 degree tolerance and clipped to atlas study region. Not a cadastral survey.',note='Gleditsch–Ward coding of states and dependencies. First year 1886 is dataset coverage, not establishment. Source geographic names are retained in sourceName; documented historical display aliases identify British Honduras, British Guiana and Dutch Suriname; a dependency is not an independent country. National territory does not erase Indigenous land tenure or prove effective control. State/dependency versions follow source dates; disputed claims need separate evidence.',citation='Schvitz et al. (2022), Mapping the International System, 1886–2017: The CShapes 2.0 Dataset. Journal of Conflict Resolution 66(1):144–161.'))
(root/'data/national-boundaries.json').write_text(json.dumps(national,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
sources.append(dict(id='cshapes-2',title='Schvitz, Rüegger, Girardin, Cederman, Weidmann & Gleditsch — CShapes 2.0',url='https://icr.ethz.ch/data/cshapes/',license='CC BY-NC-SA 4.0; derivative distributed under the same license.',note='Official 2.0 archive, downloaded 2026-11-15. Filtered through1934, clipped to Americas/Australia/Pacific study region, simplified, rounded and reoriented. Gleditsch–Ward country coding. License https://creativecommons.org/licenses/by-nc-sa/4.0/ . No endorsement implied.',download='https://icr.ethz.ch/data/cshapes/CShapes-2.0.zip',sha256=hashlib.sha256((source/'CShapes-2.0.zip').read_bytes()).hexdigest()))
(root/'data/expanded-boundary-sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'colonialVersions':len(rows),'nationalVersions':len(national),'nationalNames':sorted({r['name'] for r in national})}))
