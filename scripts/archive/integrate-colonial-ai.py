"""Publish author-authorized AI facts, visibly attributed; quarantine conflicts.
Run after integrate-round8.py. Raw upload stays in private archive.
"""
from pathlib import Path
import json,re,html,hashlib
root=Path.cwd();archive=root.parent/'intake-2026-10-29-round8';raw=archive/'colonial-registry-gemini-argon.txt'
rows=[x.split('\t')[:17] for x in raw.read_text(encoding='utf-8-sig').splitlines() if 'http' in x]
assert len(rows)==49 and all(len(r)==17 for r in rows)
points=[[-70,19],[-66.1,18.4],[-77,18],[-79,22],[-99,20],[-40,-13],[-66,10],[-76,-12],[-74,5],[-71,-33],[-58,-34],[-81.3,29.9],[-106,35.7],[-53,47],[-64,45],[-76.8,37.2],[-71,47],[-64.8,32.3],[-74,41],[-58,6],[-70.7,42],[-71.5,43],[-62.7,17.3],[-59.5,13.2],[-71,42.3],[-35,-8],[-76.6,39],[-69,12.2],[-61,15],[-72.7,41.6],[-71.4,41.8],[-75.5,39.7],[-52.3,4.9],[-55.2,5.8],[-77,18],[-72.3,19],[-78,35],[-80,33],[-74.5,40],[-90,57],[-64.8,18.2],[-75.2,40],[-98,30],[-77.7,8.9],[-90,30],[-51,64],[-81.1,32.1],[-119,35],[-153,57.7]]
# End of this named colonial regime/registry phase, not disappearance of people.
ends={3:1655,19:1664,21:1691,26:1654,32:1655,44:1700}
us={16,22,25,27,30,31,37,38,39,42,47}
for i in us:ends[i]=1783
notes={
 1:'1492 refers to La Navidad;1496 to Santo Domingo. Western Saint-Domingue is a separate entry.1795 treaty cession is not immediate uniform French administration.',
 5:'1519–1521 conquest and1535 viceroyalty creation are distinct milestones. Claimed jurisdiction changed and did not mean effective control over all Indigenous territories.',
 6:'1500 claim,1532 Sao Vicente settlement and1549 governor-general are different. Hereditary captaincies were instituted in1534, not1532; this ancillary claim is corrected.',
 8:'1532 conquest,1535 Lima founding and1542 viceroyalty creation differ. Regional population estimates across shifting boundaries cannot be compared directly.',
 9:'1538 settlement and1717/1739 administrative milestones differ; they are not three equivalent colony-foundings.',
 11:'1536 and1580 Buenos Aires foundations are separate from the1776 viceroyalty. The earlier Buenos Aires settlement did not persist continuously.',
 12:'British control intervened1763–1783; Spanish return implemented1783–1784. Supplied Spain-only power field is corrected to include Britain.',
 14:'1583 is a claim;1610 a settlement milestone. These are not proof of permanent resident occupation across the whole island from1583.',
 15:'French and British control differed by locality and period;1713 treaty is not uniform transfer of all areas in modern Acadia. Population series conflates Acadian and later provincial scopes.',
 16:'Jamestown1607 is separate from earlier Roanoke attempts1585/1587 in territory then called Virginia.350 belongs to1610, not1600. British claims and revolutionary independence overlapped1776–1783.',
 17:'Quebec founding1608 differs from earlier French settlements; British conquest1760 and treaty1763 are separate. Population scope varies between Canada and all New France.',
 19:'Dutch colonial development1614/1624/1625; English seizure1664, Dutch recovery1673 and English restoration1674. Later New York population is not Dutch New Netherland population.',
 20:'Three different Guiana colonies and milestones are grouped. British occupations and Dutch treaty sovereignty differ; a single continuous Dutch-owner label is insufficient.',
 21:'Plymouth founded1620 and merged1691; merger values shown in earlier population columns are chronological conflicts.',
 23:'Saint Kitts English1623/French1625 dates do not date Nevis settlement; Nevis English settlement was1628. Shared islands are not one uniform jurisdiction.',
 26:'Dutch conquest1630 and Portuguese recovery1654 precede formal treaty recognition1661; no continuous Dutch regime after1654 is asserted.',
 28:'Grouped islands have different acquisition dates and occupations; supplied1634/1636 must not be applied equally to all islands.',
 29:'Martinique and Guadeloupe were distinct colonies with different British occupations. A combined French tradition does not imply uninterrupted French control.',
 32:'New Sweden1638–1655; Dutch conquest1655 and English seizure1664. Later Delaware figures must not be read as New Sweden population.',
 34:'English settlement1650 and Dutch conquest1667 differ; British occupation1799–1802 is distinguished from Dutch status after1802.',
 36:'French recognition1697 differs from earlier settlement. Withdrawal1803 and Haitian independence1804 are distinct. The label does not assert voluntary or peaceful transfer.',
 39:'1664 proprietary grant is distinct from earlier European settlements;1660 is not accepted as the formal English colony founding.',
 40:'1670 charter concerns a trading-company claim, not total settlement or uncontested control of the Hudson Bay drainage.',
 41:'St Thomas1672,St John1718 and St Croix1733 are separate milestones, not one date for all three.',
 43:'1690 missions and1716–1718 renewed settlement/presidio phases differ; not a continuous boundary or uniform occupation.',
 44:'1698–1700 attempted trading colony failed. Mortality percentage and claim that it caused Union are not admitted without a directly scoped source.',
 45:'1682 claim,1699 Biloxi and1718 New Orleans differ.1762 Spanish cession,1800 retrocession and actual1803 handovers are distinct; not one uninterrupted French regime.',
 46:'1721 marks renewed Dano-Norwegian colonial/mission activity, not first human settlement or first European presence.',
 47:'1732 charter and1733 Savannah settlement differ; debtor-haven intention is not a claim all actual colonists were imprisoned debtors.',
 48:'1769 mission/presidio expansion is not first human habitation. Familiar hide/tallow export economy often describes later phases; no constant commodity rate is inferred.',
 49:'1784 Kodiak settlement differs from1799 company charter; neither is the first Russian voyage or contact. Indigenous labor coercion is not reduced to a voluntary fur market.',
}
sources=[{'id':'ai-colonies','authors':'Gemini Argon; supplied and authorized by the atlas author','title':'New World Colonies1492–1803 — AI generated facts, author-provided registry','year':2026,'venue':'AI-generated author submission; not a scholarly publication','url':'https://americaspeoples.11mosswood.us/docs/colonial-ai-registry.html','access':'AI generated facts. Published at author request with known conflicts flagged. Supplied reference links are leads, not proof those pages were accessed or support every field.','referenceType':'report'}]
sources[0]['identifier']='author-colonial-registry-2026-10-29-'+hashlib.sha256(raw.read_bytes()).hexdigest()[:12]
references=[
 {'id':'nps-virginia','authors':'National Park Service','title':'Chronology of Jamestown Events','year':None,'venue':'Historic Jamestowne','url':'https://www.nps.gov/jame/learn/historyculture/chronology-of-jamestown-events.htm','access':'Checked2026-10-29: Roanoke1585 and Jamestown1607 chronology.','referenceType':'web-resource'},
 {'id':'loc-florida','authors':'Library of Congress','title':'Competition for Empire — English Florida','year':None,'venue':'Exploring the Early Americas','url':'https://www.loc.gov/exhibits/exploring-the-early-americas/competition-for-empire.html','access':'Checked2026-10-29: British control1763–1783 and Spanish return.','referenceType':'web-resource'},
 {'id':'census-history','authors':'United States Census Bureau','title':'December2023: The1773 Boston Tea Party','year':2023,'venue':'Census history','url':'https://www.census.gov/about/history/stories/monthly/2023/december-2023.html','access':'Checked2026-10-29: earliest350colonial inhabitants referenced to1610, not1600.','referenceType':'web-resource'},
]
pkgpath=root/'data/research-proposals.json';pkg=json.loads(pkgpath.read_text(encoding='utf-8'));entries=[];records=[]
for i,(row,point) in enumerate(zip(rows,points),1):
 name,power,dates,region,motivation,goods=row[:6];rid='ai-colony-'+str(i).zfill(2)
 years=[int(x) for x in re.findall(r'\b(?:14|15|16|17|18)\d{2}\b',dates)];start=min(years);end=ends.get(i,1803)
 if i==39:start=1664
 if i==12:power='Spain; Great Britain1763–1783; Spain again'
 note=notes.get(i,'Charter, first settlement and later administration can differ. Listed powers describe colonial associations over time, not uncontested ownership at every date.')
 if i in us and i!=16:note+=' Revolutionary independence declared1776 and British treaty recognition1783 are separate; this display ends the colonial-claim envelope in1783.'
 if i==44:goods='No sustained export economy established; intended inter-oceanic transit trade.'
 status=row[15]
 rejected={}
 if i==39:
  rejected['foundingMilestones']={'original':dates,'reason':'1660 is not accepted as formal English colony founding.'}
  dates='1664 proprietary grant; earlier settlements are a separate history'
 if i==44:
  rejected['statusBy1803']={'original':status,'reason':'Claim of causation of the1707Union is not admitted without a directly scoped source.'}
  status='Attempted colony abandoned in1700; no sole causal claim about the1707Union is admitted.'
 if i==21:status='Merged into the Province of Massachusetts Bay in1691.'
 # Supplied population columns conflict both internally and with the ancillary text.
 pop={'status':'excluded-conflicting-series','reason':'Date-column shifts and inconsistent geographic/counting scope. No supplied population estimate is used as a fact or map-marker size. Original values retained only for transparent correction review.','originalColumnLabels':['c1500','c1550','c1600','c1630','c1650','c1700','c1750','c1780','c1800–1803'],'originalUnverifiedValues':row[6:15]}
 entry={'id':rid,'label':'AI generated facts','name':name,'associatedPowers':power,'foundingMilestones':dates,'displayWindow':{'start':start,'end':end,'approximate':True},'region':region,'foundingMotivations':motivation,'goodsAcrossTheColonialEra':goods,'statusBy1803':status,'suppliedReference':row[16],'editorialNote':note,'populationReview':pop,'rejectedOriginalValues':rejected}
 entries.append(entry)
 claims=[]
 for key,text in [('milestones','AI generated facts — Founding/development milestones: '+dates+'. Associated colonial powers across this history: '+power+'.'),('motivation','AI generated facts — Founding motivations: '+motivation+'.'),('goods','AI generated facts — Goods associated with different phases: '+goods+'.'),('status','AI generated facts — Status by1803, with recognized conflicts removed: '+status+'.')]:
  claims.append({'id':key,'text':text,'status':'under discussion','explanation':note+' These are visibly attributed AI-generated statements, not independently verified scholarly findings. Different goods can belong to different centuries.','support':[{'sourceId':'ai-colonies','locator':'Registry row'+str(i)+'; corresponding named fields','stance':'supports','note':'User explicitly authorized visible inclusion as AI generated facts unless a conflict is found. Conflicting population series excluded.'}]})
 claims[0]['support'].append({'sourceId':'supplied-link','locator':'Reference supplied with registry row'+str(i),'stance':'context','note':'Unverified reference lead, not independent substantiation of the AI assertions.'})
 for ref in ([references[0],references[2]] if i==16 else [references[1]] if i==12 else []):
  claims[0]['support'].append({'sourceId':ref['id'],'locator':'Official chronology/context described in source access note','stance':'context','note':ref['access']+' This narrow correction does not verify every other AI field.'})
 r={'id':rid,'revision':1,'type':'event','title':'AI generated facts · '+name,'culture':{'id':'colonial-ai-registry','name':'Colonial registry — AI generated facts','kind':'culture','color':'#d0a6ec'},'location':None,'destination':None,'routeKind':'schematic','overlay':{'kind':'regional-evidence','basis':'schematic','geometry':{'type':'Point','coordinates':point},'precision':'Broad editorial region anchor; not a settlement census, surveyed border or territorial ownership polygon.','provenance':'Author-supplied AI registry names the region. Coordinates are approximate editorial orientation.'},'time':{'kind':'interval','start':start,'end':end,'approximate':True,'original':dates+' founding/development milestones; display context ends'+str(end),'method':'Author-authorized AI chronology; separate claim, charter, settlement, conquest and administrative milestones. Rounded regional context envelope, not one event duration.','interpretation':'Visible colonial-history context only. Associated powers/status describe the whole history, not the current ruler at every selected year. Colonization dates never imply first human presence or absence of Indigenous sovereignty.'},'claims':claims,'sources':[dict(x) for x in sources]+[{'id':'supplied-link','authors':'Reference supplied with AI registry','title':'Author-supplied historical reference lead','year':None,'venue':'Unverified supplied web reference','url':row[16],'access':'Supplied by Gemini Argon; not independently checked for support of every claim.','referenceType':'web-resource'}]+([references[0],references[2]] if i==16 else [references[1]] if i==12 else []),'review':{'summary':motivation+' Goods: '+goods+'.','limitations':note+' Population series excluded after chronology/scope conflicts. Colonial claim is not legal ownership of Indigenous land or people; the broad anchor does not establish control of the whole region.','discussion':'AI generated facts — not independently source-verified, displayed by explicit author choice. Founding motives can be retrospective; goods span different phases and are not annual export measurements. Associated powers are not a fully reconstructed year-by-year control layer.','provenance':'Gemini Argon AI-generated registry supplied2026-10-29;49rows; byte-preserved original archived privately; known conflicts documented.','reviewedAt':'2026-10-29','history':['2026-10-29: Published by explicit author instruction with visible AI attribution; conflicting population series excluded.'],'relatedIds':[]}}
 records.append(r)
known={p['record']['id']:p for p in pkg['proposals']}
for r in records:
 if r['id'] in known:known[r['id']]['record']=r
 else:pkg['proposals'].append({'id':'author-'+r['id'],'version':1,'kind':'new','targetId':None,'baseRevision':None,'baseRecord':None,'record':r,'rationale':'Explicit author request: show these as AI generated facts unless a conflict is identified.','state':'ready','createdAt':'2026-10-29T23:00:00Z','updatedAt':'2026-10-29T23:00:00Z'})
pkgpath.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
data={'title':'AI generated facts — colonial registry','source':'Gemini Argon, supplied by author2026-10-29','entryCount':49,'rawSourceSha256':hashlib.sha256(raw.read_bytes()).hexdigest(),'status':'Visible by author authorization; conflicts flagged; not independently verified research.','populationPolicy':'Supplied numerical series excluded from facts and marker sizing because date/scope conflicts were found.','ancillaryReview':{'status':'Reconciled with registry, not counted as independent corroboration.','conflicts':['Havana city versus island-wide Cuba population scope','Brazil captaincy creation1534 differs from Sao Vicente1532 settlement','Virginia350 belongs to1610; later population years shifted in table','Mainland population figures in ancillary prose and table differ at same labelled years','New Spain/Peru and New Granada series mix historical boundaries and counting scopes','Darien failure does not alone establish a quantified mortality percentage or sole causation of1707Union'],'nonConflictContext':['Plantation exports depended heavily on enslaved African labor; forced Indigenous labor and dispossession remain explicit.','Bullion extraction, religious projects, strategic outposts and merchant economies vary across regions and time.']},'references':references,'entries':entries}
(root/'data/colonial-ai-registry.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
body='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI generated facts — colonial registry</title><style>body{font:16px/1.6 system-ui;background:#10242e;color:#eff6f7;max-width:1100px;margin:30px auto;padding:20px}a{color:#8be3dd}details{border:1px solid #647881;padding:12px;margin:12px 0}summary{cursor:pointer}</style><a href="../index.html#map">← Atlas</a><h1>AI generated facts — colonial registry</h1><p>49 author-supplied Gemini Argon entries, included visibly at the author’s request. They are not independently verified scholarly findings. Founding, claim, charter and administrative dates are distinguished; powers listed across a history are not a complete year-by-year control map. Colonial claims do not erase Indigenous habitation or sovereignty.</p><p>Conflicting population columns are excluded from the atlas and marker sizes. Original unverified cells remain in the structured correction record for audit. Motives and goods describe phases across a history, not constant annual production.</p><p><a href="../colonial-ai-registry.json">Structured registry and conflict log</a> · <a href="round8-synthesis.html">Research-batch decisions</a></p>'
for e in entries:
 body+='<details><summary>'+html.escape(e['name'])+'</summary><p><strong>AI generated facts</strong></p><p>Milestones: '+html.escape(e['foundingMilestones'])+'. Powers associated across this history: '+html.escape(e['associatedPowers'])+'</p><p>'+html.escape(e['foundingMotivations'])+'</p><p>Goods: '+html.escape(e['goodsAcrossTheColonialEra'])+'</p><p>'+html.escape(e['editorialNote'])+'</p><p>Population: conflicting series excluded.</p><a href="../index.html#review/'+e['id']+'">Atlas entry</a></details>'
(root/'docs/colonial-ai-registry.html').write_text(body+'</html>',encoding='utf-8')
print('Published49 visibly AI-labelled colonial context entries; conflicting population series excluded.')
