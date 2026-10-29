"""Reproducible individual review of 280 formerly timeline-unplaced records.
Original measurements stay in time.original and the review ledger. Period guides
are editorial orientation envelopes, never calibrated assays or occupation spans.
"""
from pathlib import Path
import json,copy,re,collections
root=Path.cwd(); pkgpath=root/'data/research-proposals.json';pkg=json.loads(pkgpath.read_text(encoding='utf-8'))
baseline=json.loads((root/'data/temporal-review-baseline.json').read_text(encoding='utf-8'))['records'];assert len(baseline)==280
byid={p['record']['id']:p['record'] for p in pkg['proposals']};plans={};splits=[]
def put(i,start,end,why,guide=None):
 plans[baseline[i]['id']]=(start,end,why,guide)
def bp(n):return 1950-n
# Closed numerical windows, century envelopes or rounded reference ages explicitly
# present in the reviewed record. Source wording is retained, not re-calibrated.
put(0,bp(37500),bp(34500),'Initial divergence estimate36±1.5ka only; later gene flow is a different event. Modelled ancestry, not American settlement.')
put(18,bp(35000),bp(30000),'Reported Ryukyu35–30ka migration context; directed-navigation interpretation, not exact boat route.')
put(20,bp(35000),bp(30000),'Reported35–30ka earliest maritime adaptation context; not the age of every fishhook or artifact.')
# A relative age without an explicit BP epoch remains contextual guidance.
put(26,-2430,-1930,'Context envelope of the three separately dated shell-ring models linked in this record, not continuous occupation of all rings.')
put(32,1200,1299,'Source only locates the termination of sampled intensive Keys occupations in the thirteenth century; century envelope dates that finding, not complete site occupation.')
put(37,bp(7800),bp(7400),'The specifically reported7800–7400calBP slowdown phase is shown; other sea-level phases remain in source wording.')
put(39,bp(17300),bp(16800),'First cave-use reference window only; subsequent non-use and renewed-use windows are separate records.')
put(42,bp(5000),bp(500),'Reported archaeological-comparison envelope, not continuous Boriken occupation or a new first-arrival date.')
put(44,bp(10300),bp(10300),'Oldest sampled10300calBP reference; comparative lineage findings include later samples and do not date a migration.')
put(48,bp(24500),bp(22000),'First modeled travel-opportunity window; later favorable window is a separate record. Environmental accessibility is not observed migration.')
put(51,bp(5200),bp(4900),'Envelope of two reported sampled-ancestry constraints5200/4900calBP, not a migration duration or route.')
put(57,1200,1399,'Conservative century envelope for late1200s/early1300s wording; not a confidence interval or full site lifespan.')
put(63,500,599,'Sixth-century climatic-event context from source wording; no village founding or occupation duration inferred.')
put(64,1100,1299,'Century envelope for late twelfth/thirteenth-century Bylas interpretation, not exact revised phase boundaries.')
put(67,bp(12900),bp(12200),'Source-defined apparent dated-record gap debated in historical studies; this is not confirmed depopulation.')
put(71,bp(5800),bp(2500),'First colonization-model cluster; the1800–500calBP cluster is separately represented.')
put(74,1400,1699,'Century envelope of late-fifteenth/early-seventeenth-century identity formation; not a universal ethnic distribution.')
put(77,1500,1699,'Early colonial centuries as a broad interaction context, not precise resistance events or all island occupation.')
put(80,1200,1519,'Explicit Aztec analytical cohort dates;200000 is a model input for the combined city, not a time-varying census.')
put(87,1500,1599,'Broad sixteenth-century colonial urban-development context; earlier origins and later persistence are not excluded.')
put(88,1400,1539,'Source1400–1530s comparison expanded to the full1530s decade; inventory period, not every site lifespan.')
put(93,800,899,'Ninth-century network context explicitly stated in source; no individual migration is dated.')
put(94,1000,1199,'Century envelope around later-eleventh/twelfth-century network phases; not uniform continuous ties.')
put(100,800,1299,'Conservative envelope of ninth-century building and use into the1200s; rebuilding/residence phases differ.')
put(102,1200,1299,'Thirteenth-century movement interpretation from turkey DNA; not a precisely dated human voyage.')
put(103,1200,1280,'Broad1200s envelope through modeled near-complete local departure around1280; not a census or literal zero population.')
put(119,1698,1724,'First disjoint calibrated probability window(12.9%); later1810–1905 window remains separate.')
put(126,bp(12500),bp(12500),'Rounded12500cal-year earliest-evidence reference, not exact-year certainty or occupation duration.')
put(130,bp(13000),bp(12000),'Source states13000–12000calendar-year oldest levels; no radiocarbon subtraction used.')
put(134,-999,-599,'State-plan1000–600BCE proposed flood episode; not a directly dated settlement absence.')
put(145,-349,630,'Combined assemblage study span350BCE–630CE; not separate chronology for every faunal site.')
put(153,650,850,'Legacy Redware chronology stated in the project; sparse dating and survey limits remain explicit.')
put(155,bp(870),bp(670),'First vegetation-transition window870–670calBP; subsequent grass-cover trend has no closed endpoint.')
put(158,1000,1299,'Conservative11th–13th-century evidence envelope; secure13th-century and earlier probable evidence remain distinguished in claims.')
put(164,bp(3090),bp(2258),'Modeled pottery-start boundary uncertainty, not duration of pottery use; earlier tentative association is already separate.')
put(170,1000,1934,'Last-millennium archaeological context, explicitly clipped to atlas end1934; does not date a single exchange or imply continuous transport.')
put(171,1000,1934,'Last-millennium artifact interaction context, clipped at1934; geographic source candidates remain uncertain.')
put(184,1000,1600,'Combined envelope of explicitly stated1000–1300/1300–1600 ritual-form models; regional variation and model nature retained.')
put(232,bp(11600),bp(9000),'Published11600–9000calBP regional LatePaleoindian classification; typological context, not directly dated individual lanceolates.')
put(236,1600,1649,'Early-seventeenth-century source description shown as conservative first-half-century envelope, not measured founding/abandonment dates.')
# Added orientation dates for named periods: deliberately broad and sourced.
ICS={'id':'chronology-guide','authors':'International Commission on Stratigraphy','title':'International Chronostratigraphic Chart,2026/06','year':2026,'venue':'IUGS International Commission on Stratigraphy','url':'https://stratigraphy.org/chart/','access':'Official chart inspected2026-10-29. Rounded historical-year orientation for named periods, not assay calibration; stage boundaries are before2000CE.','referenceType':'web-resource'}
PUEBLO={'id':'chronology-guide','authors':'Utah Division of State History','title':'The Ancestral Puebloan Period','year':None,'venue':'History to Go','url':'https://historytogo.utah.gov/post/anasazi/','access':'Official state-history regional Pecos classification inspected2026-10-29; period dates vary regionally and do not date individual features.','referenceType':'web-resource'}
MAINE={'id':'chronology-guide','authors':'Maine Historic Preservation Commission','title':'Prehistoric Archaeology','year':None,'venue':'State of Maine','url':'https://www.maine.gov/mhpc/index.php/programs/education/prehistoric-archaeology','access':'Official regional Paleoindian guide inspected2026-10-29. Rounded13000–11000calendar-year guide is typological context, not direct site dating.','referenceType':'web-resource'}
EAST={'id':'chronology-guide','authors':'National Park Service','title':'Deep History & Archeological Periods','year':None,'venue':'U.S. National Park Service','url':'https://www.nps.gov/articles/000/deep-history.htm','access':'Official Virginia regional framework inspected2026-10-29; broad period guide only, dates vary by region.','referenceType':'web-resource'}
# Named geological periods use2000CE reference and intentionally rounded bounds.
for i in [53]:put(i,-9700,-6200,'EarlyHolocene named-period envelope; archaeological feature remains undated within the period.',ICS)
for i in [73]:put(i,-9700,-2200,'Early/MiddleHolocene named-period context for environmental proxies; no direct first-arrival date.',ICS)
for i in [47]:put(i,-6200,1934,'Mid/LateHolocene study context clipped at atlas end; not continuous settlement or first arrival.',ICS)
for i in [78,133]:put(i,-2200,1934,'LateHolocene environmental context clipped at atlas end; not a dated settlement duration.',ICS)
for i in [129]:put(i,-6200,1934,'Middle/LateHolocene material-context envelope; no artifact-specific transfer date.',ICS)
for i in [264]:put(i,-9700,-2200,'Early/MiddleHolocene forest-island archaeological context; individual island dates remain unresolved.',ICS)
for i in [95]:put(i,900,1300,'PuebloII–III regional context; not individual house dates or proof of full-period occupation.',PUEBLO)
for i in [104]:put(i,750,900,'PuebloI regional context for ElkRidge inventories; no direct site chronology inferred.',PUEBLO)
for i in [58]:put(i,-299,500,'EarlyBasketmaker regional orientation for RockCanyon; rounded2000-years statement is not recalibrated.',PUEBLO)
NORTHEAST={'id':'chronology-guide','authors':'Lothrop, Lowery, Spiess and Ellis; Chapdelaine','title':'Early Human Settlement of Northeastern North America; Late Pleistocene-Early Holocene Shoulderless Stemmed Points: A Far Northeast Perspective','year':2024,'venue':'PaleoAmerica, regional reviews(2016 and2024)','url':'https://doi.org/10.1080/20555563.2024.2403888','access':'Regional literature previously inspected in full and preserved in these records; explicit11600–9000calBP LatePaleoindian envelope also retained in northeast-late-paleoindian chronology. Combined13000–9000calBP is an intentionally broad editorial regional typological orientation, not a measured individual site age or confidence interval. Maine guide provides narrower13000–11000calendar-year early context; regional dates vary.','referenceType':'web-resource'}
for i in [220,221,222,223,224,225,226,227,228,229,233,234,235]:put(i,bp(13000),bp(9000),'Broad northeastern Paleoindian typological envelope combining early and later regional classifications; not direct dating of finds or every component.',NORTHEAST)
for i in [251]:put(i,1500,1700,'Colonial-era Kiskiak village context; regional period guide, not founding or abandonment.',EAST)
# Split disjoint windows rather than implying support in their gaps.
splits=[(48,'-later',bp(16400),bp(14800),'Later modeled coastal-travel window'),(71,'-later',bp(1800),bp(500),'Later Caribbean colonization-model cluster'),(119,'-later',1810,1905,'Later calibrated individual-date window(87.1%)'),(39,'-nonuse',bp(12400),bp(4780),'Reported cave non-use interval; absence is site-use evidence, not island depopulation'),(39,'-renewed',bp(4780),bp(4490),'Renewed Panaeati cave-use window')]
items=[]
for old in baseline:
 r=byid[old['id']];original=copy.deepcopy(old['time']);r['revision']=old['revision']+1
 if r['id'] in plans:
  a,b,reason,guide=plans[r['id']]
  method=('Editorial period guide; approximate context only' if guide else 'Reviewed approximate source chronology; occurrence/context envelope, not continuous occupation')
  r['time']={'kind':'occurrence','start':a,'end':b,'approximate':True,'original':original['original'],'method':method,'interpretation':reason+' Range edges are conservative display bounds, not a new statistical confidence interval. Original dating wording is retained.'}
  if guide:
   r['sources']=[s for s in r['sources'] if s['id']!='chronology-guide']+[copy.deepcopy(guide)]
   c={'id':'chronology-context','text':'The named period provides only a broad chronological orientation for this finding, not direct dating of the individual site, material or process.','status':'under discussion','explanation':reason,'support':[{'sourceId':guide['id'],'stance':'context','locator':'Regional period framework / official chart','note':'Period boundaries are display orientation only; they do not establish human presence throughout the whole envelope.'},{'sourceId':r['sources'][0]['id'],'stance':'supports','locator':'Existing reviewed source classification; see original claims and access notes','note':'Supports the stated named-period/context attribution; no new calibrated assay is asserted.'}]}
   r['claims']=[c0 for c0 in r['claims'] if c0['id']!='chronology-context']+[c]
  disposition='period-guidance' if guide else 'approximate-source-window'
 else:
  text=(original['original']+' '+original['method']+' '+r['review']['limitations']).lower()
  if 'radiocarbon' in text or 'uncorrected' in text or 'calibration not' in text:
   disposition='calibration-or-context-needed';reason='The reported measurement or its archaeological association is not an established calendar range. Retain the original age and show mapped contextual evidence; recover/calibrate the original sample before chronology assignment.'
  elif any(w in text for w in ['contemporary','present-day','modern sampled','modern uniparental']):
   disposition='modern-comparison';reason='Modern sampled populations or recent observations are not a dated ancient settlement. Show their retrospective/genetic context separately from the animated evidence.'
  elif r.get('overlay',{}).get('kind')=='language':
   disposition='linguistic-context';reason='A language relationship or contact hypothesis has no independently supported distribution-date interval here. Keep its geographic/relationship context without projecting modern languages onto ancient years.'
  elif any(w in text for w in ['after ','before ','prior to','older than','>6','>8','until','at least']):
   disposition='open-or-relative-constraint';reason='A one-sided or relative temporal constraint is meaningful but does not establish a closed event interval. Preserve the constraint prominently; show separate regional context rather than fabricate the missing edge.'
  elif any(w in text for w in ['absence','gap','no known','hypothesis','reassess']):
   disposition='interpretation-or-record-gap';reason='This is an interpretation, non-discovery or reassessment rather than an independently dated human presence. Keep its source scope and date guidance accessible as context.'
  elif any(w in text for w in ['period','holocene','pleistocene','archaic','formative','woodland','dorset','clovis','horizon','precolonial','prehistoric']):
   disposition='period-detail-needed';reason='Some period or relative guidance exists, but the reviewed finding spans different phases or lacks a defensible local period mapping. Retain that guidance visibly as context; obtain the local phase/sample chronology rather than import a universal period date.'
  else:
   disposition='general-or-multiple-contexts';reason='This comparative, methodological or multi-event finding has no one event date. Display its original chronological guidance and geographic context, without interpreting it as a contemporaneous settlement.'
  r['time']={**original,'kind':'unplaced','start':None,'end':None}
  r['time']['interpretation']=reason+' Source guidance: '+original['original']
 r['review']['reviewedAt']='2026-10-29';r['review']['history']=[s for s in r['review']['history'] if '280-record chronology review' not in s]+['2026-10-29:280-record chronology review: '+disposition+'. '+reason]
 items.append({'id':r['id'],'title':r['title'],'originalTime':original,'time':copy.deepcopy(r['time']),'disposition':disposition,'reason':reason,'mappedContext':bool(r.get('location') or r.get('overlay',{}).get('geometry')),'sourceIds':[s['id'] for s in r['sources']]})
for i,suffix,a,b,label in splits:
 original=byid[baseline[i]['id']];rid=original['id']+suffix
 r=copy.deepcopy(original);r['id']=rid;r['revision']=1;r['title']=original['title']+' — '+label;r['time']={**r['time'],'kind':'occurrence','start':a,'end':b,'approximate':True,'interpretation':label+'. This is a separate supported window; no temporal support is inferred in the intervening gap.'};r['review']['relatedIds']=list(set(r['review']['relatedIds']+[original['id']]))
 if rid not in byid:pkg['proposals'].append({'id':'author-'+rid,'version':1,'kind':'new','targetId':None,'baseRevision':None,'baseRecord':None,'record':r,'rationale':'Preserve a disjoint reviewed chronological window without filling its gap.','state':'ready','createdAt':'2026-10-29T21:30:00Z','updatedAt':'2026-10-29T21:30:00Z'})
 if rid not in original['review']['relatedIds']:original['review']['relatedIds'].append(rid)
ledger={'reviewedAt':'2026-10-29','baselineCount':280,'items':items,'summary':dict(collections.Counter(x['disposition'] for x in items)),'splitRecords':[baseline[i]['id']+s for i,s,*_ in splits],'method':'Individual review of all280 prior time descriptions and claims. Source wording, units and distinction between dated presence and contextual guidance retained. No automatic14C-to-calendar subtraction.'}
(root/'data/temporal-review-2026-10-29.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');pkgpath.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(ledger['summary']));print('Recovered',len(plans),'previously unplaced records; separate windows',len(splits))
