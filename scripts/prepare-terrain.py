"""Reproduce self-hosted public-domain shaded relief. Requires Pillow.

Run from the repository root. Source downloads are cached under work/terrain.
All published imagery stays on the atlas host; visitors contact no tile provider.
"""
import hashlib, io, json, urllib.parse, urllib.request, zipfile
from pathlib import Path
from PIL import Image

cache=Path('work/terrain');cache.mkdir(parents=True,exist_ok=True)
output=Path('data/terrain');output.mkdir(parents=True,exist_ok=True)
source='https://naciscdn.org/naturalearth/50m/raster/NE2_50M_SR.zip'
archive=cache/'NE2_50M_SR.zip'
if not archive.exists():urllib.request.urlretrieve(source,archive)
manifest={'retrieved':'2026-11-15','license':'Public domain; original Natural Earth and USGS material remains public domain.','global':{'url':source,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'terms':'https://www.naturalearthdata.com/about/terms-of-use/','bounds':[-180,-90,180,90]},'local':[]}
with zipfile.ZipFile(archive) as z:
    with z.open(next(n for n in z.namelist() if n.endswith('.tif'))) as f:
        im=Image.open(f);manifest['global']['pixels']=list(im.size)
        im.save(output/'natural-earth-relief.webp',quality=88,method=6)
endpoint='https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage'
for name,bounds,width,height in [
 ('hawaiian-islands',[-160.5,18.8,-154.7,22.4],1024,636),
 ('oahu',[-158.35,21.18,-157.62,21.75],1024,800),
 ('maui',[-156.75,20.5,-155.95,21.08],1024,742),
 ('north-hawaii',[-156.05,19.9,-155.4,20.28],1024,599),
 ('four-corners',[-110.5,35,-106.5,38.5],1024,896),
 ('chaco',[-108.03,36,-107.88,36.12],1024,819),
 ('mesa-verde',[-108.6,37.1,-108.35,37.4],853,1024),
 ('hovenweep',[-109.2,37.3,-108.65,37.7],1024,745),
]:
    params={'f':'json','bbox':','.join(map(str,bounds)),'bboxSR':4326,'imageSR':4326,'size':f'{width},{height}','format':'png','adjustAspectRatio':'false','interpolation':'RSP_BilinearInterpolation','renderingRule':json.dumps({'rasterFunction':'Hillshade Gray'})}
    url=endpoint+'?'+urllib.parse.urlencode(params)
    job=cache/f'{name}-export.json'
    if job.exists():result=json.loads(job.read_text())
    else:
        result=json.load(urllib.request.urlopen(url,timeout=60));job.write_text(json.dumps(result))
    if 'href' not in result:raise RuntimeError(result)
    actual=[result['extent'][key] for key in ['xmin','ymin','xmax','ymax']]
    if any(abs(a-b)>1e-7 for a,b in zip(actual,bounds)):raise RuntimeError(('Unexpected raster extent',actual,bounds))
    if not (output/f'{name}.webp').exists():
        try:raw=urllib.request.urlopen(result['href'],timeout=30).read()
        except Exception:
            direct={**params,'f':'image'}
            raw=urllib.request.urlopen(endpoint+'?'+urllib.parse.urlencode(direct),timeout=60).read()
        Image.open(io.BytesIO(raw)).convert('RGB').save(output/f'{name}.webp',quality=90,method=6)
    manifest['local'].append({'id':name,'bounds':actual,'pixels':[result['width'],result['height']],'request':url,'source':'USGS National Map 3DEP Bare Earth DEM; modern reference, not historical terrain.','rendering':'Hillshade Gray','sha256':hashlib.sha256((output/f'{name}.webp').read_bytes()).hexdigest()})
    print(name,(output/f'{name}.webp').stat().st_size,flush=True)
(output/'sources.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
