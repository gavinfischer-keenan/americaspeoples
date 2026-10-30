import copy, json, math, sqlite3, tempfile, threading, unittest, urllib.request, urllib.error, urllib.parse
from pathlib import Path
from contextlib import closing
from app import AtlasServer
from database import create_database, record_bounds

ROOT=Path(__file__).resolve().parent.parent

class APIIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory()
        cls.path=Path(cls.temp.name)/'atlas.sqlite3'
        hazards=json.loads((ROOT/'data/hazard-events.json').read_text(encoding='utf8'))
        literal=copy.deepcopy(hazards['events'][0])
        literal.update(id='test-literal-search',title='Literal 100% underscore_marker slash\\marker')
        hazards['events'].append(literal)
        hazard_path=Path(cls.temp.name)/'hazards.json'
        hazard_path.write_text(json.dumps(hazards),encoding='utf8')
        create_database(ROOT/'dist/dataset.json',hazard_path,ROOT/'data/ice-snapshots.json',cls.path)
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
        except urllib.error.HTTPError as error:
            with error:return error.code
    def test_full_sources_not_in_catalog_and_full_export_is_exact(self):
        source=json.loads((ROOT/'dist/dataset.json').read_text(encoding='utf8'))
        full=self.get('/api/export')
        self.assertEqual(source,full)
        part=self.get('/api/catalog?limit=7')
        self.assertEqual(len(part['records']),7);self.assertEqual(part['nextOffset'],7)
        brief=part['records'][0]
        self.assertNotIn('sources',brief)
        self.assertEqual(brief['detailLevel'],'catalog')
        self.assertEqual(set(brief['review']),{'summary','limitations','reviewedAt','relatedIds'})
        for claim in brief['claims']:
            self.assertEqual(set(claim),{'id','text','status'})
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
    def test_bbox_includes_shorter_arc_interior_beyond_endpoint_latitudes(self):
        # The displayed Alaska--Greenland arc reaches ~78.7188 N; neither
        # endpoint (71.3 N and 76.5 N) is inside this query's latitude band.
        matches=self.get('/api/records?bbox=-140,78.7,-80,78.8')['records']
        self.assertIn('thule-eastward-chronology-model',[r['id'] for r in matches])
    def test_bbox_includes_cultural_and_language_circle_edges_without_center(self):
        for record_id in ['reach-chaco-communities','amazon-northwest-linguistic-exogamy']:
            with self.subTest(record_id=record_id):
                full=self.get('/api/records/'+record_id)
                lon,lat=full['overlay']['geometry']['coordinates']
                # An interior band near the northern circle edge excludes the
                # anchor itself. Radius is a display convention, not territory.
                edge=lat+math.degrees(full['overlay']['radiusKm']/6371)*0.95
                matches=self.get(f'/api/records?bbox={lon-.01},{edge-.01},{lon+.01},{edge+.01}')['records']
                self.assertIn(record_id,[r['id'] for r in matches])
                self.assertEqual(self.get('/api/records/'+record_id),full)
    def test_spherical_circle_bounds_overbound_poles_and_dateline(self):
        for kind,center,radius,point in [
            ('cultural-reach',[20,88],500,[-160,89]),
            ('language',[-40,-88],500,[140,-89]),
            ('cultural-reach',[179,10],550,[-179,10]),
            ('language',[0,60],1000,[18,61]),
        ]:
            with self.subTest(kind=kind,center=center):
                bounds=record_bounds({'type':'event','overlay':{'kind':kind,'radiusKm':radius,'geometry':{'type':'Point','coordinates':center}}})
                self.assertLessEqual(bounds[0],point[0]);self.assertGreaterEqual(bounds[1],point[0])
                self.assertLessEqual(bounds[2],point[1]);self.assertGreaterEqual(bounds[3],point[1])
    def test_search_returns_only_ids_with_paging_and_record_filter_parity(self):
        first=self.get('/api/search?q=Roanoke&limit=1')
        records=self.get('/api/records?q=Roanoke&limit=1')
        self.assertEqual(set(first),{'ids','total','nextOffset','version'})
        self.assertEqual(first['ids'],[r['id'] for r in records['records']])
        self.assertEqual(first['total'],records['total'])
        self.assertEqual(first['version'],records['version'])
        for suffix in ['from=1585&to=1585&bbox=-76,35,-75,37','layer=event','limit=1&offset=1']:
            ids=self.get('/api/search?q=Roanoke&'+suffix)
            records=self.get('/api/records?q=Roanoke&'+suffix)
            self.assertEqual(ids['ids'],[r['id'] for r in records['records']])
            self.assertEqual(ids['total'],records['total'])
            self.assertEqual(ids['nextOffset'],records['nextOffset'])
        empty=self.get('/api/search?q=%22%27')
        self.assertEqual(empty['ids'],[])
        self.assertEqual(empty['total'],0)
        self.assertEqual(self.status('/api/search?limit=1001'),400)
    def test_hazard_search_treats_percent_underscore_and_backslash_literally(self):
        for query in ['100%','underscore_','slash\\marker','%','_','\\','LITERAL 100%']:
            with self.subTest(query=query):
                matches=self.get('/api/hazards/index?'+urllib.parse.urlencode({'q':query}))['records']
                self.assertEqual([r['id'] for r in matches],['test-literal-search'])
    def test_line_bounds_include_northern_southern_polar_and_dateline_arcs(self):
        source=json.loads((ROOT/'dist/dataset.json').read_text(encoding='utf8'))
        cases=[
            ('north',[[-45,60],[45,60]],(-1,67.7,1,67.9)),
            ('south',[[-45,-60],[45,-60]],(-1,-67.9,1,-67.7)),
            ('dateline',[[170,60],[-170,60]],(179,60.3,180,60.5)),
            ('pole',[[-90,80],[90,80]],(-1,89.9,1,90)),
            # Antipodal endpoints do not determine a unique shorter arc.
            ('antipodal',[[0,0],[180,0]],(-1,89.9,1,90)),
            ('polyline',[[-60,60],[0,60],[60,60]],(-31,63.4,-29,63.5)),
        ]
        source['records']=[]
        for name,coordinates,_ in cases:
            record=copy.deepcopy(self.get('/api/records/thule-eastward-chronology-model'))
            record.update(id=name,overlay={'kind':'trade','geometry':{'type':'LineString','coordinates':coordinates}})
            source['records'].append(record)
        root=Path(self.temp.name)
        dataset_path=root/'bounds-dataset.json';dataset_path.write_text(json.dumps(source),encoding='utf8')
        target=root/'bounds.sqlite3'
        create_database(dataset_path,ROOT/'data/hazard-events.json',ROOT/'data/ice-snapshots.json',target)
        with closing(sqlite3.connect(target)) as con:
            for name,_,(west,south,east,north) in cases:
                with self.subTest(name=name):
                    matches=con.execute('SELECT id FROM records r JOIN record_bounds b ON b.n=r.n WHERE b.east>=? AND b.west<=? AND b.north>=? AND b.south<=?',(west,east,south,north)).fetchall()
                    self.assertIn((name,),matches)
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
