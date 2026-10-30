"""Versioned, read-only serving database. Import is an offline editorial operation."""
from pathlib import Path
import argparse, json, math, os, sqlite3

def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))

def summary(record):
    r = dict(record)
    # Explicitly incomplete: only full-record/export responses can be used for
    # source review or correction bases. Never synthesize empty bibliography.
    r['detailLevel'] = 'catalog'
    r.pop('sources', None)
    r['claims'] = [{k:c[k] for k in ('id','text','status')} for c in r['claims']]
    r['review'] = {k: v for k, v in r['review'].items() if k in ('summary', 'limitations', 'reviewedAt', 'relatedIds')}
    return r

def points(r):
    geometry = (r.get('overlay') or {}).get('geometry')
    if geometry:
        c = geometry.get('coordinates', [])
        return [c] if geometry['type'] == 'Point' else c
    return [[place['lon'],place['lat']] for place in [r.get('location'),r.get('destination')] if place]

def record_bounds(record):
    """Conservative query candidates for spherical display arcs and circles.

    These bounds describe display geometry, not a surveyed historical route or
    geographic uncertainty. Dateline crossings/poles deliberately overbound
    longitude; ambiguous antipodal arcs overbound the globe. No source changes.
    """
    coordinates = points(record)
    if not coordinates:
        return None
    xs, ys = zip(*coordinates)
    west, east, south, north = min(xs), max(xs), min(ys), max(ys)
    geometry = (record.get('overlay') or {}).get('geometry')
    radius = (record.get('overlay') or {}).get('radiusKm')
    if geometry and geometry['type'] == 'Point' and radius:
        # Match geoCircle's angular radius. This encloses the entire spherical
        # cap (and therefore its sampled boundary), not just its display anchor.
        # The editorial radius remains illustrative; no source geometry changes.
        lon, lat = coordinates[0]
        angle = radius/6371
        if angle >= math.pi:
            return (-180,180,-90,90)
        latitude_radius = math.degrees(angle)
        south, north = max(-90,lat-latitude_radius), min(90,lat+latitude_radius)
        if south <= -89.999999 or north >= 89.999999:
            # Every longitude is possible in a cap containing a pole.
            west, east = -180,180
            if south <= -89.999999:south = -90
            if north >= 89.999999:north = 90
        else:
            # A meridian tangent to the cap has sin(delta_lon)=sin(angle)/cos(lat).
            longitude_radius = math.degrees(math.asin(min(1,math.sin(angle)/math.cos(math.radians(lat)))))
            west, east = lon-longitude_radius, lon+longitude_radius
            if west <= -180 or east >= 180:
                west, east = -180,180  # One RTree interval cannot wrap longitude.
    connected = geometry and geometry['type'] == 'LineString' or not geometry and record['type'] == 'movement'
    if connected:
        def vector(point):
            lon, lat = map(math.radians, point)
            return (math.cos(lat)*math.cos(lon), math.cos(lat)*math.sin(lon), math.sin(lat))
        for first, last in zip(coordinates, coordinates[1:]):
            a, b = vector(first), vector(last)
            dot = max(-1.0, min(1.0, sum(x*y for x,y in zip(a,b))))
            cross = (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
            length = math.sqrt(sum(x*x for x in cross))
            if dot < 0 and length < 1e-6:
                return (-180,180,-90,90)  # Near-antipodal arithmetic is ill-conditioned.
            if length < 1e-10:
                continue  # Coincident endpoints; endpoint bounds suffice.
            angle = math.atan2(length, dot)
            normal = tuple(x/length for x in cross)
            # Along the shorter arc p(t)=a*cos(t)+tangent*sin(t), 0<=t<=angle.
            # Latitude extrema occur exactly where z'(t)=0, at phase+k*pi.
            tangent_z = normal[0]*a[1]-normal[1]*a[0]
            phase = math.atan2(tangent_z, a[2])
            for k in (-1,0,1,2):
                t = phase+k*math.pi
                if 0 <= t <= angle:
                    z = a[2]*math.cos(t)+tangent_z*math.sin(t)
                    lat = math.degrees(math.asin(max(-1.0,min(1.0,z))))
                    south, north = min(south,lat), max(north,lat)
            if south <= -89.999999:
                south = -90
            if north >= 89.999999:
                north = 90
            if abs(first[0]-last[0]) >= 180 or south == -90 or north == 90:
                west, east = -180,180
    if east-west > 180:
        west, east = -180,180
    # Outward numerical padding protects boundary inclusion; it is not a claim
    # of coordinate precision. SQLite RTree also rounds its float bounds outward.
    epsilon = 1e-7
    return (max(-180,west-epsilon),min(180,east+epsilon),max(-90,south-epsilon),min(90,north+epsilon))

def create_database(dataset_path, hazard_path, ice_path, target):
    target = Path(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix('.building')
    if temporary.exists():
        temporary.unlink()
    data = json.loads(Path(dataset_path).read_text(encoding='utf8'))
    hazards = json.loads(Path(hazard_path).read_text(encoding='utf8'))
    ice = json.loads(Path(ice_path).read_text(encoding='utf8'))
    with sqlite3.connect(temporary) as db:
        db.executescript('''
        CREATE TABLE metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE records(n INTEGER PRIMARY KEY,id TEXT UNIQUE NOT NULL,start REAL,end REAL,layer TEXT NOT NULL,culture TEXT NOT NULL,full TEXT NOT NULL,summary TEXT NOT NULL);
        CREATE INDEX record_time ON records(start,end);
        CREATE INDEX record_layer ON records(layer);
        CREATE VIRTUAL TABLE record_bounds USING rtree(n,west,east,south,north);
        CREATE VIRTUAL TABLE record_search USING fts5(text,tokenize='unicode61');
        CREATE TABLE hazards(n INTEGER PRIMARY KEY,id TEXT UNIQUE NOT NULL,start REAL,end REAL,kind TEXT NOT NULL,full TEXT NOT NULL,summary TEXT NOT NULL);
        CREATE INDEX hazard_time ON hazards(start,end,kind);
        CREATE TABLE ice(scenario TEXT,age REAL,full TEXT NOT NULL,PRIMARY KEY(scenario,age));
        ''')
        meta = {k: v for k, v in data.items() if k != 'records'}
        meta.update(apiVersion=1, recordCount=len(data['records']), hazardCount=len(hazards['events']),
                    iceIndex=[{'scenario':s['scenario'],'ageCalBP':s['ageCalBP']} for s in ice['snapshots']])
        db.execute('INSERT INTO metadata VALUES (?,?)', ('manifest', compact(meta)))
        for n, r in enumerate(data['records'], 1):
            db.execute('INSERT INTO records VALUES (?,?,?,?,?,?,?,?)', (n,r['id'],r['time']['start'],r['time']['end'],(r.get('overlay') or {}).get('kind',r['type']),r['culture']['id'],compact(r),compact(summary(r))))
            bounds = record_bounds(r)
            if bounds:
                db.execute('INSERT INTO record_bounds VALUES (?,?,?,?,?)',(n,*bounds))
            language=r.get('linguistics') or {}
            metadata=[(r.get('location') or {}).get('name',''),(language.get('relationship') or {}).get('kind','')]
            metadata += [item.get('name','')+' '+item.get('family','') for item in language.get('languages',[])]
            text = ' '.join([r['title'],r['culture']['name'],r['review']['summary']]+metadata+[c['text'] for c in r['claims']]+[s['title']+' '+s['authors'] for s in r['sources']])
            db.execute('INSERT INTO record_search(rowid,text) VALUES (?,?)',(n,text))
        date_fields = {'StartDateYear','StartDateYearModifier','EndDateYearModifier','StartDateYearUncertainty','EndDateYearUncertainty'}
        for n, event in enumerate(hazards['events'],1):
            brief = dict(event)
            brief['detail'] = {k:v for k,v in event['detail'].items() if k in date_fields}
            # Repeated source limitations remain in the full review, not every index row.
            brief['limitations'] = 'Open the source-linked review for catalog methods and limitations.'
            db.execute('INSERT INTO hazards VALUES (?,?,?,?,?,?,?)',(n,event['id'],event['start'],event['end'],event['kind'],compact(event),compact(brief)))
        for s in ice['snapshots']:
            db.execute('INSERT INTO ice VALUES (?,?,?)',(s['scenario'],s['ageCalBP'],compact(s)))
        db.execute('ANALYZE')
        assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
    db.close()
    os.replace(temporary,target)
    return meta

if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    for name in ('dataset','hazards','ice','target'):parser.add_argument('--'+name,required=True)
    args=parser.parse_args()
    result=create_database(args.dataset,args.hazards,args.ice,args.target)
    print(compact({'version':result['version'],'records':result['recordCount'],'hazards':result['hazardCount'],'database':str(args.target)}))
