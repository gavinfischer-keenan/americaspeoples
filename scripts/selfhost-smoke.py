"""Exercise the shipped bundle, not the source checkout's database or server."""
from pathlib import Path
import json,subprocess,sys,urllib.request,uuid,zipfile
root=Path(__file__).resolve().parent.parent
version=json.loads((root/'package.json').read_text())['version']
# Keep the extracted bundle below Windows' legacy path-length limit.
out=root.parent/('verify-'+uuid.uuid4().hex[:8])
out.mkdir(parents=True)
assert out.resolve().is_relative_to(root.parent.resolve())
with zipfile.ZipFile(root/f'release/americas-peoples-v{version}-selfhost.zip') as z:
 for name in z.namelist():assert (out/name).resolve().is_relative_to(out.resolve())
 z.extractall(out)
app=out/'americas-peoples'
child=subprocess.Popen([sys.executable,str(app/'server/app.py'),'--db',str(app/'data/atlas.sqlite3'),'--root',str(app/'web'),'--port','0'],stdout=subprocess.PIPE,text=True)
try:
 status=json.loads(child.stdout.readline())
 origin='http://127.0.0.1:'+str(status['port'])
 for path in ['/api/health','/api/records/r8v-checua-burial-early','/api/ice/optimal/20000']:
  with urllib.request.urlopen(origin+path,timeout=10) as response:
   data=json.load(response)
   assert response.status==200
 with urllib.request.urlopen(origin,timeout=10) as response:assert b'app.js' in response.read()
 print('PASS: extracted self-host bundle starts independently; frontend, full record and dated ice requests work.')
finally:
 child.terminate();child.wait(timeout=10)
