"""Freeze attributed scientific data, retaining raw downloads and selection rules.
Run explicitly to refresh; the hosted app never silently changes its evidence.
"""
from pathlib import Path
import requests,json,hashlib,zipfile,io,re,shapefile
from shapely.geometry import shape,mapping
from shapely.geometry.polygon import orient
from shapely import orient_polygons
root=Path.cwd(); archive=root/'data/physical-sources';archive.mkdir(exist_ok=True)
manifest=[]
def fetch(name,url,params=None):
 p=archive/name
 if not p.exists():
  r=requests.get(url,params=params,timeout=180);r.raise_for_status();p.write_bytes(r.content)
 manifest.append({'file':name,'url':url,'parameters':params,'retrieved':'2026-10-29','sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size})
 return p.read_bytes()
def scope(lon,lat):
 # Americas, Caribbean and northern/central tropical Pacific/Island Asia;
 # excludes mainland Africa/Europe, Australia and New Zealand.
 return (-170<=lon<=-30 and -60<=lat<=85) or ((lon>=120 or lon<=-140) and -25<=lat<=70) or (95<=lon<120 and -12<=lat<=25)
events=[]
ts=json.loads(fetch('noaa-tsunamis.json','https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1/tsunamis/events'))
print('tsunami envelope',list(ts),flush=True)
allts=list(ts['items'])
for page in range(2,ts['totalPages']+1):
 d=json.loads(fetch(f'noaa-tsunamis-page{page}.json','https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1/tsunamis/events',{'page':page}))
 assert d['page']==page
 allts.extend(d['items'])
assert len({r['id'] for r in allts})==ts['totalItems']
for r in allts:
 y=r.get('year');lon=r.get('longitude');lat=r.get('latitude')
 if y is None or y>1934 or lon is None or lat is None or not scope(lon,lat):continue
 validity={-1:'Erroneous entry',0:'Erroneous entry',1:'Very doubtful',2:'Questionable',3:'Probable',4:'Definite'}.get(r.get('eventValidity'),'Unspecified')
 events.append({'id':'noaa-tsunami-'+str(r['id']),'kind':'tsunami','title':r.get('locationName','Tsunami source'),'start':y+1 if y<0 else y,'end':y+1 if y<0 else y,'coordinates':[lon,lat],'sourceId':'noaa-tsunami','status':validity,'detail':{**r,'yearAsReported':y},'limitations':'Source-event location only, not an inundation area or a wave-propagation model. Maximum water height belongs to the catalog event, not necessarily this point. Historical completeness and event identification vary. No effect on a settlement is inferred.','url':'https://www.ngdc.noaa.gov/hazel/view/hazards/tsunami/event-more-info/'+str(r['id'])})
print('selected tsunamis',len(events),flush=True)
url='https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows'
vs=json.loads(fetch('gvp-eruptions.json',url,{'service':'WFS','version':'1.0.0','request':'GetFeature','typeName':'GVP-VOTW:Smithsonian_VOTW_Holocene_Eruptions','outputFormat':'application/json'}))
print('volcano count',len(vs.get('features',[])),'sample',str(vs.get('features',[])[:1])[:2500],flush=True)
for f in vs['features']:
 r=f['properties'];g=f.get('geometry');y=r.get('StartDateYear');end=r.get('EndDateYear') or y
 if not g or y is None or y>1934:continue
 lon,lat=g['coordinates'][:2]
 if not scope(lon,lat):continue
 uncertainty=r.get('StartDateYearUncertainty') or 0
 events.append({'id':'gvp-eruption-'+str(r['Eruption_Number']),'kind':'volcano','title':r['Volcano_Name'],'start':int(y+1 if y<0 else y)-int(uncertainty),'end':min(1934,int(end+1 if end<0 else end)+int(r.get('EndDateYearUncertainty') or uncertainty)),'coordinates':[lon,lat],'sourceId':'gvp','status':r.get('Activity_Type','Unspecified'),'detail':r,'limitations':'Volcano location, not ashfall extent or affected population. Start/end uncertainties and modifiers retained. An eruption can be uncertain or discredited; such catalog entries are distinguished. VEI is not a damage or death estimate. No settlement impact is inferred.','url':'https://volcano.si.edu/volcano.cfm?vn='+str(r['Volcano_Number'])})
enso=fetch('gergis2009enso.txt','https://www.ncei.noaa.gov/pub/data/paleo/contributions_by_author/gergis2009/gergis2009enso.txt').decode('cp1252')
sections=re.split(r'\n2\. Gergis and Fowler',enso)
for section,kind in zip(sections,['el-nino','la-nina']):
 for line in section.splitlines():
  m=re.match(r'^(\d{4})\s+(\d+/\d+),\s+([\d.]+)\s+([\d.;]+)\s+(E|VS|S|M|W)\s*$',line)
  if not m or int(m[1])>1934:continue
  y=int(m[1]);events.append({'id':f'gergis-{kind}-{y}','kind':kind,'title':('El Niño' if kind=='el-nino' else 'La Niña')+' reconstruction','start':y,'end':y,'coordinates':[-140,0],'sourceId':'gergis2009','status':'Multiproxy reconstruction','detail':{'proxyRatio':m[2],'meanSkill':m[3],'qualityAdjustedMagnitude':m[4],'magnitudeClass':m[5],'originalRow':line.strip()},'limitations':'Annual classification from this specific multiproxy reconstruction, not a universal ENSO chronology. Class depends on replication and is not a modern ONI strength category. The Pacific anchor is schematic; no local drought, storm, voyage or social collapse is inferred. Absence from this reconstruction does not establish neutral ENSO conditions.','url':'https://doi.org/10.25921/ebpz-a913'})
(root/'data/hazard-events.json').write_text(json.dumps({'retrieved':'2026-10-29','scope':'Americas(-170..-30longitude,-60..85latitude) plus northern/tropical Pacific(>=120 or <=-140longitude,-25..70latitude), and western Island Asia(95..120longitude,-12..25latitude), through1934CE. Geography filter is an editorial bounding envelope; no claim of exhaustive historical detection.','events':events},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
manifest.append({'file':'Original NADI-1 shapefiles ZIP (archived outside repository)','url':'https://doi.org/10.5281/zenodo.8161764','retrieved':'2026-10-29','sha256':hashlib.sha256((root.parent/'nadi-1.zip').read_bytes()).hexdigest(),'bytes':(root.parent/'nadi-1.zip').stat().st_size,'license':'CC BY4.0','doi':'10.1016/j.quascirev.2023.108345'})
(archive/'fetch-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
# GIS is WGS84 polygon data; preserve all three author uncertainty scenarios.
z=zipfile.ZipFile(root.parent/'nadi-1.zip'); snaps=[]
for n in z.namelist():
 m=re.search(r'/([\d.]+)ka_cal_(MIN|MAX|OPTIMAL)_',n)
 if not m or not n.endswith('.shp'):continue
 r=shapefile.Reader(shp=io.BytesIO(z.read(n)),shx=io.BytesIO(z.read(n[:-4]+'.shx')),dbf=io.BytesIO(z.read(n[:-4]+'.dbf')))
 geometries=[]
 for s in r.shapes():
  g=shape(s.__geo_interface__).simplify(.12,preserve_topology=True)
  if not g.is_empty:geometries.append(mapping(orient_polygons(g,exterior_cw=True)))
 snaps.append({'ageCalBP':float(m[1])*1000,'scenario':m[2].lower(),'geometry':{'type':'GeometryCollection','geometries':geometries}})
(root/'data/ice-snapshots.json').write_text(json.dumps({'sourceId':'nadi1','method':'WGS84 author polygons; topology-preserving simplification tolerance0.12degrees; MIN/MAX/OPTIMAL kept separately. Select nearest dated snapshot without inventing interpolated boundaries. Calendar BP epoch1950.','snapshots':snaps},separators=(',',':')))
print('ice snapshots',len(snaps),flush=True)
