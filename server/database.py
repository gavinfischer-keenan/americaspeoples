"""Versioned, read-only serving database. Import is an offline editorial operation."""
from pathlib import Path
import argparse, json, os, sqlite3

def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))

def summary(record):
    r = dict(record)
    r['sources'] = []
    r['claims'] = [dict(c, support=[], explanation='') for c in r['claims']]
    r['review'] = {k: v for k, v in r['review'].items() if k in ('summary', 'limitations', 'reviewedAt', 'relatedIds')}
    r['review'].update(discussion='', provenance='', history=[])
    return r

def points(r):
    geometry = (r.get('overlay') or {}).get('geometry')
    if geometry:
        c = geometry.get('coordinates', [])
        return [c] if geometry['type'] == 'Point' else c
    return [[place['lon'],place['lat']] for place in [r.get('location'),r.get('destination')] if place]

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
            coordinates = points(r)
            if coordinates:
                xs, ys = zip(*coordinates)
                west,east=(min(xs),max(xs)) if max(xs)-min(xs)<=180 else (-180,180)
                db.execute('INSERT INTO record_bounds VALUES (?,?,?,?,?)',(n,west,east,min(ys),max(ys)))
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
