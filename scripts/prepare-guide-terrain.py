"""Build self-hosted modern topographic reference images for place guides.

Input: work/guide-terrain-requests.json, generated from the guide map module.
Mapzen/Tilezen Terrarium elevation tiles on AWS; underlying provider terms and
requests are recorded in data/guide-terrain/sources.json. No live visitor calls.
"""
from pathlib import Path
import concurrent.futures,datetime,hashlib,io,json,math,time,urllib.request
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter,map_coordinates

ROOT=Path.cwd();CACHE=ROOT/'work/guide-terrain';OUT=ROOT/'data/guide-terrain'
CACHE.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
requests=json.loads((ROOT/'work/guide-terrain-requests.json').read_text(encoding='utf-8'))
size=(1200,600);manifest=[]
existing=json.loads((OUT/'sources.json').read_text(encoding='utf8')) if (OUT/'sources.json').exists() else {'maps':[]}
by_id={m['id']:m for m in existing['maps']}
def merc_y(lat):return (1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2
def fetch(tile):
 z,x,y=tile;n=2**z;x=x%n
 url=f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
 p=CACHE/f'{z}-{x}-{y}.png'
 if not p.exists():
  for attempt in range(3):
   try:
    req=urllib.request.Request(url,headers={'User-Agent':'AmericasPeoples educational atlas terrain preparation'})
    with urllib.request.urlopen(req,timeout=40) as response:raw=response.read()
    im=Image.open(io.BytesIO(raw));assert im.size==(256,256)
    p.write_bytes(raw);break
   except Exception:
    if attempt==2:raise
    time.sleep(1+attempt)
 arr=np.asarray(Image.open(p).convert('RGB'),dtype=np.float64)
 return arr[:,:,0]*256+arr[:,:,1]+arr[:,:,2]/256-32768,{'url':url,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}

for req in requests:
 size=tuple(req.get('outputPixels',req.get('pixels',[1200,600])));assert 1200<=size[0]<=4800 and 600<=size[1]<=4800
 ident=req['id'];assert ident and all(c.isalnum() or c=='-' for c in ident)
 prior=by_id.get(ident)
 if prior and prior['bounds']==req['bounds'] and prior['pixels']==list(size) and (OUT/prior['file']).exists():
  manifest.append(prior);print(ident,'cached',flush=True);continue
 w,s,e,n=req['bounds'];assert e>w and n>s and -85<s<n<85
 # Choose the closest coarser source grid: ceiling can request four times
 # as many tiles without adding native survey detail to the output.
 z=max(2,min(15,math.floor(math.log2(360/(e-w)*size[0]/256))))
 scale=2**z
 x0=(w+180)/360*scale;x1=(e+180)/360*scale;y0=merc_y(n)*scale;y1=merc_y(s)*scale
 tx0,tx1=math.floor(x0),math.ceil(x1)-1;ty0,ty1=math.floor(y0),math.ceil(y1)-1
 tiles=[(z,x,y) for y in range(ty0,ty1+1) for x in range(tx0,tx1+1)]
 assert len(tiles)<=625,(ident,len(tiles))
 mosaic=np.empty(((ty1-ty0+1)*256,(tx1-tx0+1)*256));sources=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
  for (zz,x,y),(arr,source) in zip(tiles,pool.map(fetch,tiles)):
   mosaic[(y-ty0)*256:(y-ty0+1)*256,(x-tx0)*256:(x-tx0+1)*256]=arr;sources.append(source)
 # Pixel centers in the same Web Mercator rectangle used by SVG marker placement.
 xs=((x0-tx0)+(np.arange(size[0])+.5)/size[0]*(x1-x0))*256-.5
 ys=((y0-ty0)+(np.arange(size[1])+.5)/size[1]*(y1-y0))*256-.5
 xx,yy=np.meshgrid(xs,ys);height=map_coordinates(mosaic,[yy,xx],order=1,mode='nearest')
 smooth=gaussian_filter(height,.65)
 meters_x=40075016.686*(e-w)/360*math.cos(math.radians((s+n)/2))/size[0]
 meters_y=40075016.686*(y1-y0)/scale*math.cos(math.radians((s+n)/2))/size[1]
 dy,dx=np.gradient(smooth,meters_y,meters_x)
 slope=np.arctan(np.hypot(dx,dy));aspect=np.arctan2(-dx,dy)
 shade=np.sin(math.pi/4)*np.cos(slope)+np.cos(math.pi/4)*np.sin(slope)*np.cos(math.radians(315)-aspect)
 shade=np.clip(shade,.15,1);light=.70+.38*shade
 stops=np.array([-100,0,200,600,1200,2000,3500,5500]);colors=np.array([[181,206,206],[216,228,204],[207,223,190],[222,224,194],[224,213,184],[226,211,187],[219,218,210],[244,244,241]])
 rgb=np.stack([np.interp(height,stops,colors[:,c]) for c in range(3)],axis=-1)*light[:,:,None]
 span=float(np.percentile(height,99)-np.percentile(height,1));desired=max(5,span/12)
 interval=next((a for a in [5,10,20,25,50,100,200,250,500,1000] if a>=desired),1000)
 # Contours represent elevation in metres, not archaeological walls or water edges.
 bins=np.floor(smooth/interval)
 contour=np.zeros(height.shape,dtype=bool);contour[1:,:]|=bins[1:,:]!=bins[:-1,:];contour[:,1:]|=bins[:,1:]!=bins[:,:-1]
 rgb[contour]=rgb[contour]*.68+np.array([96,103,84])*.32
 image=Image.fromarray(np.uint8(np.clip(rgb,0,255)))
 file=OUT/(ident+'.webp');image.save(file,quality=91,method=6)
 manifest.append({'id':ident,'bounds':req['bounds'],'projection':'Web Mercator','pixels':list(size),'file':ident+'.webp','tileZoom':z,'sampleSpacingMeters':round(40075016.686*math.cos(math.radians((s+n)/2))/(256*scale),1),'contourIntervalMeters':interval,'elevationRangeMeters':[round(float(height.min()),1),round(float(height.max()),1)],'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'tiles':sources})
 print(ident,len(tiles),'tiles',interval,'m contours',file.stat().st_size,'bytes',flush=True)
data={'retrieved':datetime.datetime.now(datetime.timezone.utc).date().isoformat(),'source':'Mapzen/Tilezen Terrain Tiles on AWS Open Data','dataset':'https://registry.opendata.aws/terrain-tiles/','attribution':'https://github.com/tilezen/joerd/blob/master/docs/attribution.md','format':'https://github.com/tilezen/joerd/blob/master/docs/formats.md','processing':'Terrarium RGB decoded to elevations in metres; bilinear sampling into each registered Web Mercator rectangle; lightly smoothed shaded relief and contours. No vertical exaggeration. Modern terrain, not an ancient landform or surveyed archaeological plan. Output pixels do not imply elevation-source accuracy.','maps':manifest}
(OUT/'sources.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Prepared',len(manifest),'guide terrain maps',flush=True)
