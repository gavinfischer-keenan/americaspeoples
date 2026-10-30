"""Geographic/time coverage inventory, not a census or an absence inference."""
from pathlib import Path
import json,html,collections,argparse
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument("--root",type=Path,default=Path.cwd());args=parser.parse_args()
root=args.root;base=json.loads((root/'data/evidence.json').read_text(encoding='utf-8'));research=json.loads((root/'data/research-proposals.json').read_text(encoding='utf-8'));records=list({r['id']:r for r in base['records']+[p['record'] for p in research['proposals']]}.values())
# Editorial rectangles are audit bins, not cultural/political boundaries.
regions=[('Alaska / Beringia',-180,-130,54,85),('Northern Canada / Arctic',-130,-50,58,85),('Pacific Northwest',-135,-115,42,58),('California / Great Basin',-125,-110,32,42),('Southwest / Four Corners',-113,-102,29,42),('Plains / prairie',-115,-95,36,58),('Great Lakes',-95,-74,40,52),('Northeast / Atlantic Canada',-78,-50,40,59),('Lower Ohio / Midwest',-96,-79,34,42),('Southeast / Tidewater',-88,-74,29,38),('Florida / Gulf coast',-99,-79,24,32),('Northern Mexico / Baja',-117,-97,23,33),('Central / Southern Mexico',-106,-87,14,24),('Guatemala / Belize',-93,-87,13,19),('Honduras / El Salvador / Nicaragua',-91,-82,10,17),('Costa Rica / Panama',-86,-77,7,11),('Cuba / Bahamas',-85,-72,20,28),('Hispaniola / Puerto Rico / Jamaica',-79,-65,17,20),('Northern Lesser Antilles',-65,-59,15,19),('Southern Lesser Antilles',-63,-59,10,15),('ABC islands',-71,-68,11,13),('Colombia',-79,-67,-4,13),('Venezuela',-73,-60,0,12),('Guianas',-62,-51,0,9),('Ecuador',-82,-75,-5,2),('Peru / Western Andes',-82,-68,-19,0),('Bolivia / Central Andes',-70,-57,-24,-8),('Amazonia / inland Brazil',-74,-45,-18,5),('Eastern Brazil',-48,-34,-25,-1),('Paraguay / Southern Brazil',-63,-47,-34,-18),('Chile / Argentina midlatitudes',-76,-52,-44,-22),('Patagonia / Tierra del Fuego',-77,-53,-57,-40),('Falkland / southern islands',-62,-25,-60,-48),('Japan / Ryukyus',120,146,23,46),('Philippines / Island Southeast Asia',120,142,-10,23),('New Guinea / Bismarcks',130,156,-12,1),('Solomons / Vanuatu / New Caledonia',150,172,-24,-3),('Marianas / Palau / Carolines',130,163,0,24),('Marshall Islands / Kiribati',163,180,-5,18),('Fiji / Tonga',175,180,-25,-10),('Fiji / Tonga / Samoa east of dateline',-180,-165,-25,-10),('Societies / Cooks / Marquesas',-165,-130,-24,0),('Hawaii',-161,-154,17,24),('Rapa Nui',-112,-108,-29,-25),('Galapagos',-93,-88,-3,3)]
bins=[('Before25,000BCE',-1000000,-25000),('25,000–15,000BCE',-24999,-15000),('15,000–10,000BCE',-14999,-9999),('10,000–6,000BCE',-9998,-5999),('6,000–3,000BCE',-5998,-2999),('3,000–1,000BCE',-2998,-999),('1,000–1BCE',-998,0),('1–500CE',1,500),('501–1000CE',501,1000),('1001–1500CE',1001,1500),('1501–1700CE',1501,1700),('1701–1934CE',1701,1934)]
# Supplemental overlapping audit boxes, not state boundaries.
subregions=[('Montana — western mountains',-116,-111,44.3,49),('Montana — central / eastern plains',-111,-104,44.3,49),('Nevada — northwestern basins',-120,-116,38,42),('Nevada — central / eastern basins',-116,-114,38,42),('Nevada — southern desert',-117,-114,35,38),('Louisiana — northern / inland',-94,-91,31,33.2),('Louisiana — lower Mississippi valley',-91.5,-89.5,29,33.2),('Louisiana — western coastal plain',-94,-91,28.8,31)]
remote={'Falkland / southern islands','Societies / Cooks / Marquesas','Hawaii','Rapa Nui','Galapagos'}
subregions += [
 ('Idaho — northern river corridors',-117.3,-114,45,49),
 ('Idaho — southern / central',-117.3,-111,42,45),
 ('Wyoming — western mountains',-111.1,-107,41,45.1),
 ('Wyoming — eastern plains',-107,-104,41,45.1),
 # Separate rectangles avoid a dateline-spanning box selecting most of Earth.
 ('Aleutians — west of dateline',170,180,50,55),
 ('Aleutians — east of dateline',-180,-162,50,55),
 ('Kiribati — Gilbert Islands',172,177,-3,5),
 ('Kiribati — Phoenix Islands',-175,-169,-6,0),
 ('Kiribati — Line Islands',-162,-150,-12,8),
]

def coord(r):
 o=r.get('overlay');g=o.get('geometry') if o else None
 if g:return g['coordinates'] if g['type']=='Point' else None
 p=r.get('location');return [p['lon'],p['lat']] if p else None

def local(r):
 # Named-site events are local evidence, not necessarily habitation.
 return bool(not r.get('overlay') and r.get('location') and r['type'] in ['occupation','occurrence','event'])

def overlaps(t,a,b):return t.get('start') is not None and t.get('end') is not None and t['start']<=b and t['end']>=a

def sites(rs):return sorted({r['location']['id'] for r in rs if local(r)})

def population(r,a,b):
 sources={s['id'] for s in r.get('sources',[])}
 claims={c['id'] for c in r.get('claims',[]) if any(s.get('stance')=='supports' and s.get('sourceId') in sources for s in c.get('support',[]))}
 return any(overlaps(p,a,b) and p.get('min') is not None and p.get('max') is not None and p.get('claimId') in claims for p in r.get('population',[]))

def languages(rs):
 out=set()
 for r in rs:
  lang=r.get('linguistics')
  if not lang:continue
  sources={s['id'] for s in r.get('sources',[])}
  for c in r.get('claims',[]):
   if c['id']==lang.get('claimId'):out.update(s['sourceId'] for s in c.get('support',[]) if s.get('stance')=='supports' and s['sourceId'] in sources)
 return sorted(out)

def read(name,default):
 p=root/name
 return json.loads(p.read_text(encoding='utf8')) if p.exists() else default

def pending():
 for name in ['round11-synthesis.json','round10-synthesis.json','round9-synthesis.json','round8-synthesis.json']:
  value=read('data/'+name,None)
  if value is None:continue
  items=[]
  for x in value.get('decisions',[])+value.get('held',[]):
   status=x.get('disposition',x.get('status','held-source-check'))
   if not any(w in status.lower() for w in ['held','pending','await','untested']):continue
   items.append({'id':x.get('candidateId',x.get('id',x.get('topic','source-check-lead'))),'title':x.get('candidateFinding',x.get('title',x.get('topic','Untested lead'))),'status':status,'reason':x.get('reason','Original-source verification required.')})
  return {'source':name,'batch':value.get('batch',name.split('-')[0]),'items':items}
 value=read('data/intake-queue-round7.json',{'items':[]})
 return {'source':'intake-queue-round7.json','batch':'round7','items':[{k:v for k,v in x.items() if k in ['id','status','reviewFlags']} for x in value['items']]}

def link(r):return '<a href="../index.html#review/'+html.escape(r['id'])+'">'+html.escape(r['title'])+'</a>'

rows=[];matrix=[];gaps=[]
for name,w,e,s,n in regions+subregions:
 geo=[r for r in records if (p:=coord(r)) and w<=p[0]<=e and s<=p[1]<=n]
 unresolved=[r for r in geo if r['time']['kind']=='unplaced'];cells=[];out=[]
 for label,a,b in bins:
  rs=[r for r in geo if overlaps(r['time'],a,b)];l=[r for r in rs if local(r)];c=[r for r in rs if not local(r)];ps=[r for r in l if population(r,a,b)];ls=languages(rs);ids=sites(l)
  cell={'period':label,'start':a,'end':b,'localRecordIds':[r['id'] for r in l],'contextRecordIds':[r['id'] for r in c],'localityIds':ids,'localityCount':len(ids),'localRecordCount':len(l),'contextRecordCount':len(c),'populationKnownRecordIds':[r['id'] for r in ps],'populationKnownLocalityCount':len(sites(ps)),'languageSourceIds':ls,'languageSourceCount':len(ls)};out.append(cell)
  if len(ids)<=2:
   screened=b<=-15000 or (name in remote and b<=0)
   score=(100 if not ids else 65 if len(ids)==1 else 35)+(20 if c else 0)+(5 if unresolved else 0)+(5 if name in {r[0] for r in subregions} else 0)
   query=f'Which named archaeological sites in {name} have original published occupation or activity dates within {label}? Give individual site phases, calibrated versus uncalibrated ages, uncertainty, public geographic precision and original sources. Distinguish repeated phases from separate places and rooms from people.'
   gaps.append({**cell,'region':name,'classification':['no-included-dated-localities','one-included-dated-locality','two-included-dated-localities'][len(ids)],'undatedRegionalRecordCount':len(unresolved),'rankScore':0 if screened else score,'priorityEligible':not screened,'priorityCaveat':'Early peopling / habitability assessment required first; not an automatic collection-filling priority.' if screened else 'Collection coverage only; low counts do not measure survey completeness or past population.','missingDimensions':(['No explicit numeric locality population estimate; a historical count may be unknowable.'] if not ps else [])+(['No explicit source-linked linguistic finding; artifacts do not establish ancient speech.'] if not ls else []),'suggestedConsensusQuery':query})
  cells.append('<td class="'+('local' if ids else 'context' if c else 'gap')+'"><details><summary>'+str(len(ids))+' / '+str(len(c))+'</summary><p>'+str(len(l))+' local records; '+str(len(sites(ps)))+' localities with numeric population; '+str(len(ls))+' language-support sources.</p>'+('<ul>'+''.join('<li>'+link(r)+'</li>' for r in rs)+'</ul>' if rs else 'No included dated point record in this bin; not evidence of absence.')+'</details></td>')
 matrix.append({'region':name,'scope':'audit-subregion' if name in {r[0] for r in subregions} else 'broad-region','bounds':[w,e,s,n],'periods':out,'unresolvedIds':[r['id'] for r in unresolved],'unresolvedLocalityIds':sites(unresolved),'unresolvedContextRecordIds':[r['id'] for r in unresolved if not local(r)]})
 rows.append('<tr><th>'+html.escape(name)+'<br><small>'+str(len(unresolved))+' undated records; '+str(len(sites(unresolved)))+' undated localities</small></th>'+''.join(cells)+'</tr>')
gaps.sort(key=lambda x:(-x['rankScore'],x['region'],x['start']))
for rank,g in enumerate(gaps,1):g['rank']=rank
priorities=[];counts=collections.Counter()
for g in gaps:
 geography=g['region'].split(' — ')[0]
 if g['priorityEligible'] and counts[geography]<2:priorities.append(g);counts[geography]+=1
 if len(priorities)==16:break
ledger=read('data/temporal-review-2026-10-29.json',{'items':[],'splitRecords':[]});original=[x for x in ledger['items'] if x.get('originalTime',{}).get('kind')=='unplaced'];intake=pending()
recommendations=[(g['region']+' · '+g['period'],f"{g['localityCount']} distinct dated localities; {g['localRecordCount']} local records; {g['contextRecordCount']} regional/model context records. "+g['suggestedConsensusQuery']) for g in priorities]
summary={'reviewedAt':max((r.get('review',{}).get('reviewedAt','') for r in records),default=ledger.get('reviewedAt','')),'recordCount':len(records),'formerlyUnplaced':len(original),'recoveredWindows':sum(x['time']['kind']!='unplaced' for x in original),'splitWindows':len(ledger.get('splitRecords',[])),'remainingUnplaced':sum(r['time']['kind']=='unplaced' for r in records),'method':'Current base and research records deduplicated by record ID. Point-anchor membership in overlapping editorial rectangles; line routes excluded. Local means named non-overlay occupation, occurrence or site event, not a verified habitation census. Distinct location IDs, not repeated phases, drive sparse coverage ranking. Unknown dates are separate and cannot fill dated cells. Broad windows may overlap many cells without continuous presence. Population-known requires numeric population bounds and an associated sourced claim. Language coverage requires an explicit linguistics claim with supporting source. Rows and periods overlap and are not additive. Zero never implies human absence. Early peopling/habitability screen is editorial, not a new arrival chronology. Pending intake not counted as integrated.','regionCount':len(matrix),'broadRegionCount':len(regions),'periodCount':len(bins),'recommendations':recommendations,'matrix':matrix,'gapCells':gaps,'nextRoundPriorities':priorities,'pendingIntake':intake,'intakeItems':intake['items'],'unallocatedRecordIds':[r['id'] for r in records if coord(r) is None]}
incoming=read('data/intake-queue-round11.json',read('data/intake-queue-round10.json',{'batch':None,'items':[]}))
summary['incomingResearch']=incoming
(root/'data/coverage-audit.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
body="""<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Atlas coverage audit</title><style>body{font:15px/1.6 system-ui;background:#10242e;color:#e8eff1;padding:22px;margin:auto;max-width:1600px}a{color:#8be3dd}h1,h2{line-height:1.2}.scroll{overflow:auto;max-height:75vh}table{border-collapse:collapse;font-size:12px}td,th{padding:9px;border:1px solid #52636a;min-width:115px;vertical-align:top}thead th{position:sticky;top:0;background:#192f39}tbody th{min-width:190px;background:#192f39;text-align:left}.local{background:#1d4b4d}.context{background:#39424f}.gap{background:#142933}summary{cursor:pointer}li{margin:7px 0}small{color:#d4dee2}section{margin:25px 0}</style><a href="../index.html#map">← Atlas</a><h1>Where the collected evidence is thin</h1>"""
body+=f'<p>{len(records)} current archaeological, historical and interpretive records; {summary["remainingUnplaced"]} remain undated or contextual. Historical chronology review: {summary["formerlyUnplaced"]} originally unplaced records reviewed; {summary["recoveredWindows"]} source/period windows recovered and {summary["splitWindows"]} disjoint windows separated. Historical totals are separate from current coverage. Natural-hazard catalogs are separate.</p>'
body+='<p><strong>A zero is a collection gap, not evidence that no people lived there.</strong> Matrix values are distinct dated localities / regional or other context records. Expanded cells list local records, which may repeat phases at one locality. A local event does not necessarily show habitation. Undated records are reported separately. Broad date windows do not prove continuous habitation. Boxes and periods overlap deliberately; counts cannot be summed. Routes and records without point anchors are not allocated to a region.</p>'
body+=f'<p><a href="../coverage-audit.json">Structured audit and ranked gap cells</a> · <a href="../temporal-review.json">All{summary["formerlyUnplaced"]} chronology decisions</a> · <a href="round8-synthesis.html">Round8 source decisions</a>'
if (root/'docs/round9-synthesis.html').exists():body+=' · <a href="round9-synthesis.html">Round9 source decisions</a>'
if (root/'docs/round10-synthesis.html').exists():body+=' · <a href="round10-synthesis.html">Round10 source decisions</a>'
body+=' · <a href="../index.html#physical">Climate sources and limits</a> · <a href="colonial-ai-registry.html">AI generated colonial facts</a></p><h2>Next-round priorities</h2><p>Ranked from current included evidence: sparse means zero, one or two distinct dated locality IDs. Regional/model context and undated findings cannot fill dated site gaps. Earliest peopling and habitability questions, including remote-island periods preceding supported settlement, require separate assessment and are not automatic collection-filling priorities. The screen is editorial, not evidence of human absence or a new first-arrival chronology.</p><ol>'
for g in priorities:
 body+='<li><strong>'+html.escape(g['region']+' · '+g['period'])+'</strong>: '+str(g['localityCount'])+' dated localities; '+str(g['localRecordCount'])+' local phase/activity records; '+str(g['contextRecordCount'])+' context records; '+str(g['undatedRegionalRecordCount'])+' undated records in the region (not assigned to this period). '+str(g['populationKnownLocalityCount'])+' localities with numeric population; '+str(g['languageSourceCount'])+' language-support sources.<details><summary>Suggested Consensus query and limits</summary><p>'+html.escape(g['suggestedConsensusQuery'])+'</p><p>'+html.escape(' '.join(g['missingDimensions']))+'</p></details></li>'
body+='</ol><h2>Untested intake leads</h2><p>'+html.escape(str(intake['batch']))+': '+str(len(intake['items']))+' held or pending entries from '+html.escape(intake['source'])+'. These are untested leads, separate from actual gaps in included dated sites. Repeated intake entries are not additional sites. Check originals before admitting claims.</p>'
body+='<h2>Geography × time</h2><p>Expand a cell for source-linked records and independent population/language metrics. Additional Montana, Nevada, Louisiana, Idaho, Wyoming, Aleutian and Kiribati rectangles refine the broad audit; they overlap and are not state boundaries.</p><div class="scroll"><table><thead><tr><th>Region</th>'+''.join('<th>'+html.escape(x[0])+'</th>' for x in bins)+'</tr></thead><tbody>'+''.join(rows)+'</tbody></table></div><h2>All remaining unresolved chronology</h2><p>Current records without a supported calendar window, including later additions; dates are not inferred from a search question.</p>'
if (root/'docs/round11-synthesis.html').exists():body+=' · <a href="round11-synthesis.html">Round11 source decisions</a>'
if incoming.get('items'):
 title='Research receipt and release accounting' if incoming.get('status')=='release-screened' else 'Research received for the next deploy'
 body+='<section><h2>'+title+'</h2><p>'+html.escape(str(incoming['batch']))+': '+('screened for this release; see source decisions for admitted findings and unresolved leads. Reports themselves never count as sites.' if incoming.get('status')=='release-screened' else 'queued for original-source checking. These reports do not change the integrated locality counts or close gaps yet.')+'</p><ul>'
 for item in incoming['items']:
  body+='<li><strong>'+html.escape(item['title'])+'</strong>: '+html.escape(item['coverageAssessment'])+'</li>'
 body+='</ul></section>'
historical={x['id']:x for x in ledger['items']}
for r in records:
 if r['time']['kind']!='unplaced':continue
 old=historical.get(r['id'],{});original=old.get('originalTime',r['time']).get('original','');reason=old.get('reason',r.get('review',{}).get('limitations','Original date boundaries require verification.'))
 body+='<details><summary>'+html.escape(r['title'])+'</summary><p>'+html.escape(original)+'</p><p>'+html.escape(reason)+'</p>'+link(r)+'</details>'
(root/'docs/coverage-audit.html').write_text(body+'</html>',encoding='utf8')
print(json.dumps({k:summary[k] for k in ['recordCount','recoveredWindows','remainingUnplaced','regionCount']}))
