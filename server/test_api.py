import json, tempfile, threading, unittest, urllib.request, urllib.error
from pathlib import Path
from app import AtlasServer
from database import create_database

ROOT=Path(__file__).resolve().parent.parent

class APIIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory()
        cls.path=Path(cls.temp.name)/'atlas.sqlite3'
        create_database(ROOT/'dist/dataset.json',ROOT/'data/hazard-events.json',ROOT/'data/ice-snapshots.json',cls.path)
        cls.server=AtlasServer(('127.0.0.1',0),cls.path,ROOT/'dist')
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
        cls.origin='http://127.0.0.1:'+str(cls.server.server_address[1])
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown();cls.server.server_close();cls.thread.join();cls.temp.cleanup()
    def get(self,path):
        with urllib.request.urlopen(self.origin+path,timeout=10) as r:return json.load(r)
    def status(self,path,method='GET'):
        try:
            with urllib.request.urlopen(urllib.request.Request(self.origin+path,method=method),timeout=10) as r:return r.status
        except urllib.error.HTTPError as error:return error.code
    def test_full_sources_not_in_catalog_and_full_export_is_exact(self):
        source=json.loads((ROOT/'dist/dataset.json').read_text(encoding='utf8'))
        full=self.get('/api/export')
        self.assertEqual(source,full)
        part=self.get('/api/catalog?limit=7')
        self.assertEqual(len(part['records']),7);self.assertEqual(part['nextOffset'],7)
        self.assertEqual(part['records'][0]['sources'],[])
        self.assertEqual(self.get('/api/records/'+source['records'][0]['id']),source['records'][0])
    def test_time_bbox_search_and_dateline_are_parameterized(self):
        result=self.get('/api/records?from=1585&to=1585&q=Roanoke')
        self.assertIn('r8v-roanoke-1585',[r['id'] for r in result['records']])
        nearby=self.get('/api/records?bbox=-76,35,-75,37&from=1585&to=1585')
        self.assertIn('r8v-roanoke-1585',[r['id'] for r in nearby['records']])
        self.assertEqual(self.status('/api/records?bbox=170,-30,-170,30'),200)
        self.assertEqual(self.status('/api/records?q=%22%27%3BDROP%20TABLE%20records'),200)
        self.assertGreater(self.get('/api/health')['records'],600)
        matches=self.get('/api/records?q=Athabaskan')['records']
        self.assertTrue(any(any('Athabaskan' in l.get('family','') for l in r.get('linguistics',{}).get('languages',[])) for r in matches))
        records=json.loads((ROOT/'dist/dataset.json').read_text(encoding='utf8'))['records']
        movement=next(r for r in records if r.get('destination') and not r.get('overlay'))
        lon,lat=movement['destination']['lon'],movement['destination']['lat']
        matches=self.get(f'/api/records?bbox={lon-.01},{lat-.01},{lon+.01},{lat+.01}')['records']
        self.assertIn(movement['id'],[r['id'] for r in matches])
    def test_invalid_queries_private_paths_and_writes(self):
        for path in ['/api/records?limit=1001','/api/records?limit=1.5','/api/records?offset=-1','/api/records?from=500&to=0','/api/records?from=nan','/api/records?bbox=1,2,3','/api/records?bbox=0,0,181,10']:
            self.assertEqual(self.status(path),400,path)
        for path in ['/api/no-such-route','/api/records/missing','/atlas.sqlite3','/server/app.py','/%2e%2e/package.json']:
            self.assertEqual(self.status(path),404,path)
        self.assertEqual(self.status('/api/records','POST'),405)
        self.assertEqual(self.status('/','HEAD'),200)
    def test_physical_index_and_lazy_source_geometry(self):
        index=self.get('/api/hazards/index?limit=2')
        for brief in index['records']:
            full=self.get('/api/hazards/'+brief['id'])
            self.assertEqual(brief['start'],full['start']);self.assertEqual(brief['coordinates'],full['coordinates'])
            self.assertEqual(brief['detail'],{k:v for k,v in full['detail'].items() if k in brief['detail']})
        snapshot=self.get('/api/ice/optimal/20000')
        self.assertEqual(snapshot['ageCalBP'],20000)
        self.assertEqual(snapshot['scenario'],'optimal')
        self.assertTrue(snapshot['geometry'])
        self.assertEqual(self.status('/api/ice/optimal/999999'),404)

if __name__=='__main__':unittest.main(verbosity=2)
