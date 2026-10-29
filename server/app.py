"""Atlas read API. Bind to loopback behind Caddy; public writes are prohibited."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, parse_qs, unquote
import argparse, json, math, re, sqlite3, threading
from contextlib import closing

from database import compact

HEADERS = {
 'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store, max-age=0',
 'X-Frame-Options':'DENY',
}

def number(params,key,default=None):
    value=params.get(key,[default])[0]
    if value is None:return None
    value=float(value)
    if not math.isfinite(value) or abs(value)>1_000_000:raise ValueError('Invalid '+key)
    return value

class AtlasServer(ThreadingHTTPServer):
    daemon_threads=True
    allow_reuse_address=True
    def __init__(self,address,db,root):
        self.database=Path(db).resolve(strict=True)
        self.webroot=Path(root).resolve(strict=True)
        self.slots=threading.BoundedSemaphore(8)
        with closing(self.connect()) as con:
            self.manifest=json.loads(con.execute("SELECT value FROM metadata WHERE key='manifest'").fetchone()[0])
        super().__init__(address,AtlasHandler)
    def connect(self):
        con=sqlite3.connect(self.database.as_uri()+'?mode=ro&immutable=1',uri=True,timeout=5)
        con.execute('PRAGMA query_only=ON')
        con.execute('PRAGMA cache_size=-4096')
        return con
    def process_request(self,request,address):
        if not self.slots.acquire(blocking=False):
            try:request.sendall(b'HTTP/1.0 503 Service Unavailable\r\nRetry-After: 1\r\nContent-Length: 0\r\n\r\n')
            finally:self.shutdown_request(request)
            return
        try:super().process_request(request,address)
        except BaseException:
            self.slots.release()
            raise
    def process_request_thread(self,request,address):
        try:super().process_request_thread(request,address)
        finally:self.slots.release()

class AtlasHandler(SimpleHTTPRequestHandler):
    server_version='AtlasAPI/1'
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(args[2].webroot),**kwargs)
    def setup(self):
        super().setup()
        self.connection.settimeout(15)
    def end_headers(self):
        for key,value in HEADERS.items():self.send_header(key,value)
        self.send_header('X-Atlas-Version',self.server.manifest['version'])
        super().end_headers()
    def list_directory(self,path):
        self.send_error(404)
        return None
    def log_message(self,fmt,*args):
        # Caddy owns public access logs; no query strings duplicated in app logs.
        pass
    def do_POST(self):self.send_error(405,'Read-only API')
    do_PUT=do_DELETE=do_PATCH=do_OPTIONS=do_POST
    def do_HEAD(self):self.do_GET()
    def send_json(self,value,status=200):
        body=compact(value).encode('utf8')
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(body)))
        self.end_headers()
        if self.command!='HEAD':self.wfile.write(body)
    def do_GET(self):
        try:
            parsed=urlsplit(self.path)
            path=unquote(parsed.path)
            if len(self.path)>4000:raise ValueError('Request too long')
            if path.startswith('/api/'):
                params=parse_qs(parsed.query,keep_blank_values=True,max_num_fields=12)
                with closing(self.server.connect()) as con:return self.api(con,path,params)
            # Serve only public files; never directory listings, databases or code.
            pieces=Path(path).parts
            if any(x in ('.','..') or x.startswith('.') for x in pieces[1:]) or '\\' in path or '\0' in path:
                return self.send_error(404)
            if Path(path).suffix.lower() in ('.sqlite3','.sqlite','.db','.py','.pyc','.bak','.building'):
                return self.send_error(404)
            if not (self.server.webroot/path.lstrip('/')).resolve().is_relative_to(self.server.webroot):
                return self.send_error(404)
            super().do_HEAD() if self.command=='HEAD' else super().do_GET()
        except (ValueError,TypeError,OverflowError):self.send_json({'error':'Invalid query parameters'},400)
        except (BrokenPipeError,ConnectionResetError):pass
        except sqlite3.Error:self.send_json({'error':'Atlas database unavailable'},503)
    def api(self,con,path,params):
        if path=='/api/health':return self.send_json({'status':'ok','version':self.server.manifest['version'],'records':self.server.manifest['recordCount']})
        if path=='/api/manifest':return self.send_json(self.server.manifest)
        if path=='/api/export':
            data={k:v for k,v in self.server.manifest.items() if k not in ('apiVersion','recordCount','hazardCount','iceIndex')}
            data['records']=[json.loads(r[0]) for r in con.execute('SELECT full FROM records ORDER BY n')]
            return self.send_json(data)
        if path in ('/api/catalog','/api/records','/api/hazards/index'):
            return self.query(con,path,params)
        match=re.fullmatch(r'/api/(records|hazards)/([A-Za-z0-9._-]{1,150})',path)
        if match:
            table='records' if match[1]=='records' else 'hazards'
            row=con.execute('SELECT full FROM '+table+' WHERE id=?',(match[2],)).fetchone()
            return self.send_json(json.loads(row[0])) if row else self.send_json({'error':'Record not found'},404)
        match=re.fullmatch(r'/api/ice/(optimal|min|max)/([0-9.]+)',path)
        if match:
            age=float(match[2])
            row=con.execute('SELECT full FROM ice WHERE scenario=? AND age=?',(match[1],age)).fetchone()
            return self.send_json(json.loads(row[0])) if row else self.send_json({'error':'Snapshot not found'},404)
        return self.send_json({'error':'API route not found'},404)
    def query(self,con,path,params):
        limit=number(params,'limit',500)
        offset=number(params,'offset',0)
        if limit!=int(limit) or offset!=int(offset) or not 1<=limit<=1000 or offset<0:raise ValueError('Pagination')
        limit,offset=int(limit),int(offset)
        hazard=path=='/api/hazards/index'
        table='hazards' if hazard else 'records'
        joins='';where=[];values=[]
        start,end=number(params,'from'),number(params,'to')
        if start is not None and end is not None and start>end:raise ValueError('Time range')
        if start is not None:where.append('r.end>=?');values.append(start)
        if end is not None:where.append('r.start<=?');values.append(end)
        layer=params.get('layer',[''])[0]
        if layer:where.append('r.'+('kind' if hazard else 'layer')+'=?');values.append(layer)
        if 'bbox' in params:
            if hazard:raise ValueError('Unsupported bbox')
            coords=[float(x) for x in params['bbox'][0].split(',')]
            if len(coords)!=4 or not all(math.isfinite(x) for x in coords):raise ValueError('Bounding box')
            west,south,east,north=coords
            if not(-180<=west<=180 and -180<=east<=180 and -90<=south<=north<=90):raise ValueError('Bounding box')
            joins+=' JOIN record_bounds b ON b.n=r.n '
            where.append('b.north>=? AND b.south<=?');values.extend([south,north])
            where.append('(b.east>=? AND b.west<=?)' if west<=east else '(b.east>=? OR b.west<=?)');values.extend([west,east])
        q=params.get('q',[''])[0]
        if q:
            if len(q)>200:raise ValueError('Search length')
            if hazard:where.append('r.summary LIKE ?');values.append('%'+q.replace('%','\\%').replace('_','\\_')+'%')
            else:
                tokens=re.findall(r'[^\W_]+',q,flags=re.UNICODE)[:12]
                if not tokens:return self.send_json({'records':[],'total':0,'nextOffset':None,'version':self.server.manifest['version']})
                joins+=' JOIN record_search s ON s.rowid=r.n '
                where.append('record_search MATCH ?');values.append(' AND '.join('"'+t+'"*' for t in tokens))
        sql=' FROM '+table+' r '+joins+(' WHERE '+' AND '.join(where) if where else '')
        total=con.execute('SELECT count(*)'+sql,values).fetchone()[0]
        rows=[json.loads(row[0]) for row in con.execute('SELECT r.summary'+sql+' ORDER BY r.n LIMIT ? OFFSET ?',values+[limit,offset])]
        return self.send_json({'records':rows,'total':total,'nextOffset':offset+limit if offset+limit<total else None,'version':self.server.manifest['version']})

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--db',required=True);parser.add_argument('--root',required=True)
    parser.add_argument('--host',default='127.0.0.1');parser.add_argument('--port',type=int,default=8105)
    args=parser.parse_args()
    server=AtlasServer((args.host,args.port),args.db,args.root)
    print(compact({'port':server.server_address[1],'status':'ready','version':server.manifest['version']}),flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
