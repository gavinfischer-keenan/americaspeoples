"""Normalize public loss inventories without interpreting survey years as sinkings.

Run from the repo root. Inputs are the preserved publisher downloads. Every
included and rejected row has a source identity in the audit; source attributes
remain separately inspectable. These markers describe historical reported losses,
not the continued physical existence of wreckage.
"""
import argparse,collections,csv,datetime,hashlib,io,json,math,re,zipfile,unicodedata
from pathlib import Path

def loss_date(value):
    value=str(value).strip()
    if not value.isdigit() or len(value) not in (4,6,8):return None
    year=int(value[:4])
    if not 1<=year<=1934:return None
    try:
        if len(value)>=6:datetime.date(year,int(value[4:6]),1)
        if len(value)==8:
            day=datetime.date(year,int(value[4:6]),int(value[6:8]))
            return year,day.isoformat()
    except ValueError:return None
    return year,None

def irish_loss_date(raw,year):
    """The convenience year column is often the END of a date range."""
    raw=str(raw).strip();approximate=bool(re.search(r'\bcirca\b|\bc\.|\bca\.|\?',raw,re.I))
    clean=re.sub(r'^(?:circa\.?|ca\.?|c\.)\s*','',raw,flags=re.I)
    span=re.fullmatch(r'Between\s+(?:\d{1,2}/\d{1,2}/)?(\d{4})\s+and\s+(?:\d{1,2}/\d{1,2}/)?(\d{4})',clean,re.I)
    if not span:span=re.fullmatch(r'(\d{4})\s*[-–—/]\s*(\d{4})',clean)
    if span:
        start,end=map(int,span.groups())
        if not 1<=start<=end<=1934:return None,None,False
        return (start,None),end,approximate or start!=end
    day=re.fullmatch(r'(\d{2})/(\d{2})/(\d{4})',raw)
    date=loss_date(''.join([day[3],day[2],day[1]]) if day else year)
    return date,date[0] if date else None,approximate

def wam_loss_date(raw):
    """Accept the publisher's two explicit date orders without guessing serials."""
    raw=str(raw).strip()
    day_first=re.fullmatch(r'(\d{2})/(\d{2})/(\d{4})',raw)
    if day_first:return loss_date(day_first[3]+day_first[2]+day_first[1])
    if re.fullmatch(r'\d{4}/00/00',raw):return loss_date(raw[:4])
    return loss_date(raw.replace('/','').replace('-',''))

def coordinate(value,axis):
    match=re.fullmatch(r'\s*(\d{1,3})\s+(\d+(?:\.\d+)?)\s*([NSEW])\s*',value)
    if not match:raise ValueError('Unsupported coordinate: '+value)
    degree,minute,hemisphere=match.groups();degree=float(degree);minute=float(minute)
    if minute>=60 or hemisphere not in ('NS' if axis=='latitude' else 'EW'):raise ValueError('Invalid coordinate hemisphere or minutes')
    result=(degree+minute/60)*(-1 if hemisphere in 'SW' else 1)
    if abs(result)>(90 if axis=='latitude' else 180):raise ValueError('Out-of-range coordinate')
    return result

def is_ship(row):
    kind=row.get('type','').strip().lower()
    if re.search(r'aircraft|aeroplane|airplane|helicopter|airship|flying boat|pontoon bridge|pipeline|wellhead|oil rig',kind):return False
    return bool(row.get('wreck_category') or kind and not re.search(r'^obstruction$|rock|buoy|container|anchor|cable',kind))

UKHO_SOURCE={
 'id':'shipcatalog-ukho-202610','authors':'United Kingdom Hydrographic Office',
 'title':'Global Wrecks and Obstructions: October 2026 text export','year':2026,
 'venue':'ADMIRALTY Marine Data Portal','url':'https://www.admiralty.co.uk/access-data/marine-data',
 'access':'Public text export, Open Government Licence v3.0. Retrieved 18 November 2026. Source file and field definitions retained; historical loss dates are separate from survey dates.',
 'referenceType':'dataset','identifier':'ADMIRALTY item 60c0908526b844a68494c038a457e1a7',
 'edition':'October 2026','publisher':'United Kingdom Hydrographic Office'
}
CULTURE={'id':'historic-maritime-losses','name':'Maritime losses; see vessel and source attribution','kind':'unknown','color':'#c4b8ed'}

def evidence(row,source,source_key,year,exact,lat,lon,name,vessel_type,status,raw_date,place=None,end=None,approximate=False):
    rid='wreck-'+source_key
    uncertain=bool(re.search(r'dead|doubtful|possibly|probabl|unverified',status+' '+name,re.I))
    condition=''
    if 'dead' in status.lower():condition='The hydrographic catalogue no longer confirms wreckage at this reported position.'
    elif 'lifted' in status.lower():condition='The catalogue reports that the wreck was removed or salvaged.'
    elif status:condition='Catalogue status: '+status+'.'
    label=name or 'Unnamed vessel ('+source_key+')'
    end=year if end is None else end
    date_phrase=f'between {year} and {end}' if end!=year else f'around {year}' if approximate else f'in {year}'
    description=f"{label}, a {vessel_type or 'vessel'}, is catalogued as lost {date_phrase}."
    if row.get('cargo'):description+=' Recorded cargo: '+row['cargo'].strip().rstrip('.')+'.'
    if condition:description+=' '+condition
    time={'kind':'occurrence','start':year,'end':end,'original':'Publisher loss-date field: '+raw_date,
          'method':'Publisher loss field only; survey, discovery, designation and amendment dates are excluded.',
          'interpretation':'A catalogued historical loss. Marker persistence shows the loss history, not surviving remains.'}
    if approximate:
        time['approximate']=True
        time['method']+=' Publisher range or circa qualification preserved; no exact loss day inferred.'
        time['interpretation']='One loss whose date is uncertain within the stated bounds; not an activity continuing throughout the date range. Marker persistence shows loss history, not surviving remains.'
        exact=None
    if exact:time['eventDate']=exact
    history={'kind':'wreck','claimId':'loss','group':'Historical loss inventory'}
    if exact:history['eventDate']=exact
    precision='Rounded public catalogue position (0.001 degrees); not a vessel outline or a verified position at the instant of sinking.'
    if uncertain:precision+=' Identification or continued existence at this position is uncertain.'
    date_label=f'{year}–{end}' if end!=year else ('c. ' if approximate else '')+str(year)
    return {'id':rid,'revision':1,'type':'event','title':label+' — '+date_label+' loss','culture':CULTURE,
      'location':{'id':rid+'-place','name':place or 'Reported loss position of '+label,'lat':round(lat,3),'lon':round(lon,3),'precision':precision,'provenance':source['title']+'; source identity '+source_key+'. Original coordinates retained in the source catalogue extract.'},
      'destination':None,'routeKind':'schematic','time':time,'history':history,
      'claims':[{'id':'loss','text':description,'status':'under discussion' if uncertain else 'well-supported',
        'explanation':'This claim reports the inventory entry, not an independent archaeological identification. '+precision,
        'support':[{'sourceId':source['id'],'locator':source_key+'; loss-date, vessel, position and status fields','stance':'supports','note':'Loss date is '+raw_date+'. Catalogue status is '+(status or 'found/reported; no additional status supplied')+'.'}]}],
      'sources':[source],
      'review':{'summary':description,'limitations':precision+' Historical losses include salvaged vessels; uncertain or unconfirmed records remain qualified.',
        'discussion':'Inventories can disagree about names, dates and positions. The source identity and original fields allow revision without confusing a modern survey with an earlier loss.',
        'provenance':'Structured public inventory import. Source fields, licence and normalization decisions retained. No inferred voyage or invented casualty count.',
        'reviewedAt':'2026-11-18','history':['18 November 2026: imported publisher loss field and qualified public position.'],'relatedIds':[]}}

def ukho(input_dir):
    path=input_dir/'ukho-global-text.zip'
    with zipfile.ZipFile(path) as archive:
        text=archive.read('Wrecks.txt').decode('utf-8-sig').replace('\r\r\n','\n')
    rows=list(csv.DictReader(io.StringIO(text),delimiter='\t'))
    records=[];details={};excluded=[];seen={}
    for row in rows:
        key='ukho-'+row['wreck_id'];date=loss_date(row['date_sunk'])
        reason=None
        if not date:reason='loss date unknown, invalid, or outside 1–1934 CE'
        elif not is_ship(row):reason='not an identified vessel or wreck feature'
        if reason:excluded.append({'id':key,'reason':reason});continue
        try:lat=coordinate(row['latitude'],'latitude');lon=coordinate(row['longitude'],'longitude')
        except ValueError:excluded.append({'id':key,'reason':'unusable public position'});continue
        if lat==0 and lon==0:excluded.append({'id':key,'reason':'null island placeholder'});continue
        year,exact=date
        if key in seen:
            # The export can carry a point and an area representation of one
            # official wreck ID. They are not two lost ships. Preserve both.
            geographic={'position','latitude','longitude','limits','sonar_length','sonar_width','shadow_height','orientation'}
            assert all(row[k]==seen[key][k] for k in row if k not in geographic), 'Conflicting identities for publisher ID '+key
            details['wreck-'+key].setdefault('alternateGeometryRows',[]).append(row)
            excluded.append({'id':key,'reason':'same publisher wreck ID; alternate point/area representation retained with one marker'});continue
        seen[key]=row
        record=evidence(row,UKHO_SOURCE,key,year,exact,lat,lon,row['name'].strip(),row['type'],row['status'],row['date_sunk'])
        records.append(record);details[record['id']]=row
    audit={'sourceId':UKHO_SOURCE['id'],'downloadUrl':'https://datahub.admiralty.co.uk/portal/sharing/rest/content/items/60c0908526b844a68494c038a457e1a7/data',
      'license':'Open Government Licence v3.0','licenseUrl':'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
      'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'sourceRows':len(rows),'included':len(records),'excluded':excluded}
    return records,details,audit

def source(key,author,title,url,license):
    return {'id':'shipcatalog-'+key,'authors':author,'title':title,'year':2026,'venue':author,'url':url,
      'access':'Public inventory accessed 18 November 2026. '+license,'referenceType':'dataset','identifier':url,'edition':'Snapshot retrieved 18 November 2026','publisher':author}

REGIONAL={
 'ireland':source('ireland','National Monuments Service, Government of Ireland','Wreck Inventory of Ireland',
   'https://www.archaeology.ie/advice-and-support/locate-a-monument-or-wreck/wreck-viewer/','CC BY 4.0; attribution to National Monuments Service, Government of Ireland.'),
 'wam':source('wam','Western Australian Museum','Shipwrecks (WAM-002): public spatial subset',
   'https://catalogue.data.wa.gov.au/dataset/shipwrecks','CC BY 4.0. This spatial subset is smaller than the full museum inventory.'),
 'michigan':source('michigan','Michigan Underwater Preserves Council / Michigan shipwreck map','Michigan shipwrecks: MUPC inventory',
   'https://www.michiganpreserves.org/divers-guide/','Only factual vessel, loss-year and location fields are reproduced; photographs and descriptive prose are excluded.'),
 'farallones':source('farallones','NOAA Greater Farallones National Marine Sanctuary','Shipwrecks within Greater Farallones National Marine Sanctuary',
   'https://www.arcgis.com/home/item.html?id=83fb39636e48428f915237ec403e859a','US federal government factual inventory; underlying photographs retain their individual credits and are not included.'),
 'wisconsin':source('wisconsin','Wisconsin Historical Society / Wisconsin Department of Natural Resources','Lake Michigan Water Trail shipwreck inventory',
   'https://dnr.wisconsin.gov/topic/parks/watertrails','Only factual vessel, loss-year and location fields are reproduced; photographs and descriptive prose are excluded.')}

PHAETON_SOURCE={'id':'wam-phaeton-inspection-2005','authors':'M. McCarthy','title':'Phaeton (1889): Wreck Inspection Report','year':2005,'venue':'Western Australian Museum, Department of Maritime Archaeology Report 194','url':'https://museum.wa.gov.au/maritime-archaeology-db/sites/default/files/no._194_phaeton_cocos.pdf','access':'Primary museum inspection report, p. 2: WGS84 GPS from inspection on 2 November 2004. Used to correct the public spatial inventory longitude; raw inventory geometry retained. No report photographs reproduced.','referenceType':'report','publisher':'Western Australian Museum','identifier':'Report 194','pages':'2'}

def regional(input_dir,provider):
    filenames={'ireland':'ireland-wiid-all.csv','wam':'wam002-all-raw.json','michigan':'michigan-official-all.json','wisconsin':'wisconsin-dnr-all-raw.json','farallones':'farallones-all.json'}
    path=input_dir/filenames[provider]
    if provider=='ireland':
        with path.open(encoding='utf-8-sig') as stream:rows=list(csv.DictReader(stream))
    else:rows=[{**f['attributes'],'publicGeometry':f.get('geometry')} for f in json.loads(path.read_text(encoding='utf-8'))['features']]
    records=[];details={};excluded=[]
    for row in rows:
        end=None;approximate=False
        if provider=='ireland':
            key='ireland-'+row['Wreck No'];raw=row['Date of Loss'];year=row['Date_of_Loss_Year_Only'];name=row['Wreck Name'];kind=row['Classification'];lat=row['DD_Lat'];lon=row['DD_Long'];place=row['Place of Loss'];status=''
            date,end,approximate=irish_loss_date(raw,year)
        elif provider=='wam':
            key='wam-'+str(int(row['unique_num']));raw=row['when_lost'];name=row['name'];kind=row['type_of_si']+' '+row['rig'];lat=row['lat'];lon=row['long'];place=row['where_lost'];status=row['position_i']
            date=wam_loss_date(raw)
        elif provider=='michigan':
            key='michigan-'+str(row['F__OBJECTID']);raw=row['LostYR'];name=row['Vessel'];kind=row['VesselType'];lat=row['LatitudeDecimalDegrees'];lon=row['LongitudeDecimalDegrees'];place=', '.join(str(row[k]) for k in ['Location','Lake'] if row[k]);status='unverified position' if row['Verified']=='No' else ''
            # Year is the reliable common field; keep source month/day in audit.
            date=loss_date(raw)
            row={k:v for k,v in row.items() if k not in ['Description','Photo1','ShipwreckPhoto']}
        elif provider=='farallones':
            key='farallones-'+str(row['objectid']);raw=str(row['ShipwreckYear']);name=row['name'];kind='vessel';lat=lon=0;place=name;status=''
            date=loss_date(raw)
            row={k:v for k,v in row.items() if k not in ['description','pic_url','thumb_url','Attribution']}
        else:
            key='wisconsin-'+str(row['SITE_ID']);raw=row['YEAR_SANK'];name=row['SITE_NAME'];kind='vessel';lat=row['Y_COORD'];lon=row['X_COORD'];place=name;status=''
            date=loss_date(raw)
        # Published spatial geometry is authoritative for positions. Two WI
        # attribute rows have reversed X/Y fields; keep those raw attributes
        # in the audit without moving Wisconsin losses to Antarctica.
        if row.get('publicGeometry'):
            lat=row['publicGeometry']['y'];lon=row['publicGeometry']['x']
        if provider=='wam' and key=='wam-977':
            # The publisher's own inspection report resolves the spatial
            # export's longitude error. Keep original geometry in details.
            lat=-(12+5.673/60);lon=96+51.336/60
        reason=None
        if not date:reason='loss date unknown, invalid, or outside 1–1934 CE'
        elif re.search(r'aircraft|aeroplane|flying boat|airplane',kind,re.I):reason='aircraft, not a shipwreck'
        try:lat=float(lat);lon=float(lon)
        except (ValueError,TypeError):lat=lon=0
        if reason is None and (not math.isfinite(lat+lon) or not -90<=lat<=90 or not -180<=lon<=180 or (lat==0 and lon==0)):reason='no usable public position'
        # Ireland's inventory also covers documented losses far offshore in
        # the western approaches and Bay of Biscay; it is not a land boundary.
        regional_bounds={'ireland':(-30,43,0,62),'wam':(100,-45,140,-5),'michigan':(-93,40,-75,50),'wisconsin':(-93,40,-75,50),'farallones':(-125,36,-121,40)}
        if reason is None:
            w,s,e,n=regional_bounds[provider]
            inside=w<=lon<=e and s<=lat<=n
            # WAM also publishes losses in the Cocos (Keeling) Islands.
            if provider=='wam':inside=inside or (96.7<=lon<=97.1 and -12.4<=lat<=-11.6)
            if not inside:reason='public position outside inventory region; requires manual review'
        if reason:excluded.append({'id':key,'reason':reason});continue
        year,exact=date
        record=evidence({},REGIONAL[provider],key,year,exact,lat,lon,name,kind.strip(),status,raw or str(year),place,end,approximate)
        if provider=='wam' and key=='wam-977':
            correction='Position corrected from McCarthy, Phaeton inspection report 194 (2005), p. 2, WGS84 GPS: 12 degrees 05.673 minutes S, 96 degrees 51.336 minutes E. Public spatial-export geometry retained in the catalogue details.'
            record['sources'].append(PHAETON_SOURCE)
            record['location']['provenance']+=' '+correction
            record['review']['limitations']+=' '+correction
            record['claims'][0]['support'].append({'sourceId':PHAETON_SOURCE['id'],'locator':'p. 2, Technical Data, Approximate Location and GPS','stance':'supports','note':correction})
            row['coordinateCorrection']={'sourceId':PHAETON_SOURCE['id'],'lat':lat,'lon':lon,'reason':'Publisher inspection report corrects spatial export longitude.'}
        records.append(record);details[record['id']]=row
    return records,details,{'sourceId':REGIONAL[provider]['id'],'sourceUrl':REGIONAL[provider]['url'],'rights':REGIONAL[provider]['access'],
      'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'sourceRows':len(rows),'included':len(records),'excluded':excluded}

def identity(name):
    name=name.split(' — ')[0]
    name=unicodedata.normalize('NFKD',name).encode('ascii','ignore').decode().upper()
    # Remove only status/fragment qualifiers, not disambiguators such as (I),
    # (II), vessel numbers or an otherwise meaningful parenthesized name.
    qualifier=r'\s*(?:(?:POSSIBLY|PROBABLY|POSSIBLE|PROBABLE|PART|OF|BOW|STERN|FORWARD|FORE|AFT|MIDSHIP|MAIN|SECTION|SECTIONS|PORTION|WRECK)\s*)+'
    name=re.sub(r'\('+qualifier+r'\)',' ',name)
    name=re.sub(r'\b(HMS|HMAV|RMS|SS|HMT|SMS|USS|MV)\b',' ',name)
    name=re.sub(r'[^A-Z0-9]','',name)
    return name if len(name)>=4 and not re.search(r'UNKNOWN|UNNAMED|UNIDENTIFIED|LOGBOAT',name) else None

def distance_km(a,b):
    lat1,lat2=map(math.radians,[a['lat'],b['lat']]);dl=math.radians(a['lon']-b['lon'])
    x=math.sin((lat1-lat2)/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin(dl/2)**2
    return 12742*math.asin(min(1,math.sqrt(x)))

def reconcile(records,details,curated):
    """Merge only matching named losses, same year and nearby public positions.

    Preserve disagreement and all alternate identities in the audit. Never merge
    unnamed wrecks just because they share a coordinate or year.
    """
    index=collections.defaultdict(list);kept=[];aliases=[]
    def eligible(r):
        return r['time']['kind']=='occurrence' and not r['time'].get('approximate')
    for r in curated:
        if r.get('location') and identity(r['title']) and eligible(r):index[(identity(r['title']),r['time']['start'])].append(r)
    for r in records:
        key=(identity(r['title']),r['time']['start']);matches=[]
        for prior in index[key] if key[0] and eligible(r) else []:
            a,b=prior['time'].get('eventDate'),r['time'].get('eventDate')
            if a and b and a!=b:continue
            # Same-year similar names at different sites remain separate.
            distance=distance_km(r['location'],prior['location'])
            if distance<=5:matches.append((distance,prior))
        if len(matches)==1:
            distance,prior=matches[0];aliases.append({'id':r['id'],'canonicalId':prior['id'],'distanceKm':round(distance,3),'reason':'same normalized vessel name, loss year and position within 5 km; alternate source retained'})
            if prior in kept:
                known={s['id'] for s in prior['sources']}
                prior['sources'].extend(s for s in r['sources'] if s['id'] not in known)
                prior['claims'][0]['support'].extend(r['claims'][0]['support'])
                if not prior['time'].get('eventDate') and r['time'].get('eventDate'):
                    exact=r['time']['eventDate']
                    prior['time']['eventDate']=prior['history']['eventDate']=exact
                    prior['time']['method']+=' Exact loss day supplied by matching alternate inventory '+r['id']+'.'
            continue
        kept.append(r)
        if key[0] and eligible(r):index[key].append(r)
    return kept,aliases

def date_corrections(records):
    for r in records:
        if r['id']=='wreck-ukho-19160':
            r['time']['eventDate']=r['history']['eventDate']='1545-07-19'
            r['time']['method']+=' Mary Rose Trust eyewitness chronology corrects the catalogue’s 20 July to 19 July 1545; historical Julian calendar date, without conversion.'
            r['sources'].append({'id':'mary-rose-loss-chronology','authors':'Mary Rose Trust','title':'Why did the Mary Rose sink?','year':2026,'venue':'Mary Rose Museum','url':'https://maryrose.org/discover/history/why-did-the-mary-rose-sink/','access':'Institutional account quoting the contemporary ambassador’s report; accessed 18 November 2026.','referenceType':'web-resource','publisher':'Mary Rose Trust'})
            r['claims'][0]['support'].append({'sourceId':'mary-rose-loss-chronology','locator':'What happened on that fateful day, 19 July 1545?','stance':'supports','note':'Museum chronology supplies the corrected historical day; raw UKHO date retained.'})

def apply_catalog_enrichment(records,audit_path=Path('data/graveyard-catalog-audit.json')):
    """Reapply curated NOAA cross-references after every raw inventory import."""
    if not audit_path.exists():return {'applied':0,'missingCanonicalIds':[]}
    audited=json.loads(audit_path.read_text(encoding='utf-8'))
    by_id={r['id']:r for r in records};missing=[];applied=0
    for alias in audited.get('aliases',[]):
        record=by_id.get(alias['canonicalId'])
        if record is None:
            missing.append(alias['canonicalId']);continue
        sid=alias['sourceId'];name=record['title'].split(' — ')[0]
        source={'id':sid,'authors':'NOAA Thunder Bay National Marine Sanctuary','title':name+' — sanctuary wreck record','year':None,'venue':'NOAA Thunder Bay National Marine Sanctuary','url':alias['sourceUrl'],'access':'Individual wreck page, Wrecked and GPS Location fields. Compared with the regional inventory; source differences retained.','referenceType':'web-resource'}
        record['sources']=[s for s in record['sources'] if s['id']!=sid]+[source]
        support={'sourceId':sid,'locator':'Wrecked and GPS Location fields','stance':'supports','note':'Published loss field: '+alias['lossField']+'. Public location: '+alias['publishedPosition']+'.'}
        record['claims'][0]['support']=[s for s in record['claims'][0]['support'] if s['sourceId']!=sid]+[support]
        if alias.get('yearConflict'):
            source_years=[int(y) for y in re.findall(r'\b\d{4}\b',alias['lossField'])]
            if source_years:
                regional_year=record['time']['start'];years=[regional_year,record['time']['end'],*source_years]
                start,end=min(years),max(years)
                record['time'].update(kind='occurrence',start=start,end=end,approximate=True,original=f'Regional inventory: {regional_year}; NOAA sanctuary record: '+alias['lossField'],interpretation='Conflicting loss-year entries retained as an uncertainty window for one occurrence, not two sinkings.')
                record['time'].pop('eventDate',None);record['history'].pop('eventDate',None)
                record['title']=f'{name} — conflicting {start}/{end} loss dates'
                record['claims'][0].update(text=f'The public inventories identify {name} but disagree on its loss: the regional inventory gives {regional_year}, NOAA '+alias['lossField']+'.',status='under discussion')
                record['review']['summary']=record['claims'][0]['text']
                limitation=' Loss year remains unresolved between the linked inventories.'
                if limitation not in record['review']['limitations']:record['review']['limitations']+=limitation
        applied+=1
    return {'applied':applied,'missingCanonicalIds':sorted(set(missing))}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--input',type=Path,default=Path('work/voyage-depth/shipwreck-raw'));args=parser.parse_args()
    records,details,audit=ukho(args.input);audits=[audit]
    for provider in REGIONAL:
        additions,originals,provider_audit=regional(args.input,provider)
        records.extend(additions);details.update(originals);audits.append(provider_audit)
    date_corrections(records)
    curated=[]
    for path in Path('data').glob('*records.json'):
        if path.name.startswith('shipwreck-'):continue
        for r in json.loads(path.read_text(encoding='utf-8')).get('records',[]):
            if r.get('history',{}).get('kind')=='wreck':curated.append(r)
    records,aliases=reconcile(records,details,curated)
    enrichment=apply_catalog_enrichment(records)
    assert len({r['id'] for r in records})==len(records)
    Path('data/shipwreck-expansion-records.json').write_text(json.dumps({'records':records},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    Path('data/shipwreck-catalog-details.json').write_text(json.dumps(details,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    Path('data/shipwreck-coverage-audit.json').write_text(json.dumps({'throughYear':1934,'sources':audits,'aliases':aliases,'mappedRecords':len(records),'catalogEnrichment':enrichment},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print({'records':len(records),'aliases':len(aliases),'sources':[{k:a[k] for k in ['sourceId','sourceRows','included']} for a in audits],'catalogEnrichment':enrichment})

if __name__=='__main__':main()
