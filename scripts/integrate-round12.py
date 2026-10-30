"""Integrate explicit source-checked findings and versioned corrections locally."""
from pathlib import Path
import json,hashlib,html
root=Path.cwd();read=lambda p:json.loads(p.read_text(encoding='utf-8'))
incoming=read(root/'data/round12-reviewed.json');new=incoming['records'];updates=incoming['proposedUpdates'];ids={r['id'] for r in new};updated={u['targetId'] for u in updates}
basepath=root/'data/evidence.json';researchpath=root/'data/research-proposals.json';base=read(basepath);research=read(researchpath)
research['proposals']=[p for p in research['proposals'] if not p['record']['id'].startswith('r12v-') or p['record']['id'] in ids]
records={r['id']:r for r in base['records']};records.update({p['record']['id']:p['record'] for p in research['proposals']})
for u in updates:
 assert records[u['targetId']] in [u['beforeRecord'],u['record']],'Conflicting intervening change'
 found=False
 for r in base['records']:
  if r['id']==u['targetId']:r.clear();r.update(u['record']);found=True;break
 if not found:
  p=next(p for p in research['proposals'] if p['record']['id']==u['targetId']);p['record']=u['record'];p['updatedAt']='2026-10-30T04:00:00Z'
existing={p['record']['id']:p for p in research['proposals']}
for r in new:
 if r['id'] in existing:existing[r['id']]['record']=r
 else:research['proposals'].append(dict(id='author-'+r['id'],version=1,kind='new',targetId=None,baseRevision=None,baseRecord=None,record=r,rationale='Sequential DEEP coverage research followed by explicit original-source checks and duplicate reconciliation.',state='ready',createdAt='2026-10-30T04:00:00Z',updatedAt='2026-10-30T04:00:00Z'))
allrecords={r['id']:r for r in base['records']+[p['record'] for p in research['proposals']]}
digest=lambda r:hashlib.sha256(json.dumps(r,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
for rid,expected in incoming['precedingRecordDigests'].items():
 if rid not in updated:assert digest(allrecords[rid])==expected,rid
assert len(allrecords)==894+len(ids)
def save(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
save(basepath,base);save(researchpath,research)
report={k:v for k,v in incoming.items() if k not in ['records','proposedUpdates','precedingRecordDigests']}
report.update(release='0.4.6',recordIds=sorted(ids),approvedUpdates=[{k:v for k,v in u.items() if k not in ['record','beforeRecord']}|dict(beforeRevision=u['beforeRecord']['revision'],afterRevision=u['record']['revision']) for u in updates],newSourceCheckedRecords=len(new),publishedRecordCount=len(allrecords),localEvidenceRecords=sum(bool(r.get('location') and not r.get('overlay')) for r in new),datedRecords=sum(r['time']['kind']!='unplaced' for r in new))
save(root/'data/round12-synthesis.json',report)
esc=lambda v:html.escape(str(v))
style='body{font:16px/1.6 system-ui;background:#10242e;color:#eff6f7;max-width:1100px;margin:30px auto;padding:20px}a{color:#8be3dd}details{border:1px solid #647881;padding:12px;margin:12px 0}summary{cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere}'
body=f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Round twelve source decisions</title><style>{style}</style><a href="../index.html#map">← Atlas</a><h1>Round twelve: sequential coverage research</h1><p>{len(new)} new findings and {len(updates)} explicit corrections; {report["publishedRecordCount"]} total records. New findings include {report["localEvidenceRecords"]} named-locality evidence records and {report["datedRecords"]} supported calendar windows. Counts are records, not an equal number of new settlements.</p><p>Ten independent regional Consensus DEEP reviews ran one at a time. The full reports and quotations remain in the private research archive. Original publications, accessed abstracts and explicitly identified source excerpts support only the narrowed findings admitted here. Bibliographic membership is not verification.</p><p><a href="coverage-audit.html">Updated geographic/time coverage</a> · <a href="../round12-synthesis.json">Structured decisions</a> · <a href="../round12-bibliography.json">Bibliographic leads</a></p><h2>Corrections to existing records</h2>'
for u in updates:body+='<details><summary>'+esc(u['record']['title'])+'</summary><pre>'+esc(json.dumps({k:v for k,v in u.items() if k not in ['beforeRecord','record']},ensure_ascii=False,indent=2))+'</pre></details>'
body+='<h2>Added findings and source checks</h2>';lookup={r['id']:r for r in new}
for g in report['groups']:
 body+='<h3>'+esc(g['id'])+'</h3><ul>'+''.join('<li><a href="../index.html#review/'+esc(rid)+'">'+esc(lookup[rid]['title'])+'</a> — '+esc(lookup[rid]['time']['original'])+'</li>' for rid in g['recordIds'])+'</ul><details><summary>Source access and reconciliations</summary><pre>'+esc(json.dumps(g,ensure_ascii=False,indent=2))+'</pre></details>'
body+='<h2>Held leads and limitations</h2><p>No calendar date is invented from an uncalibrated age, query period or archaeological style. No population is inferred from artifacts or buildings. Genetic ancestry does not establish speech. Public locality anchors are not excavation coordinates. Unknown dates remain outside dated coverage cells. A modeled boundary mean is not a95% occupation interval.</p>'
for h in report['held']:body+='<details><summary>'+esc(h['topic'])+'</summary><p>'+esc(h['reason'])+'</p><pre>'+esc(json.dumps(h['details'],ensure_ascii=False,indent=2))+'</pre></details>'
body+='<h2>All topic decisions</h2><pre>'+esc(json.dumps(report['topicDecisions'],ensure_ascii=False,indent=2))+'</pre></html>'
(root/'docs/round12-synthesis.html').write_text(body,encoding='utf-8')
print(json.dumps({k:report[k] for k in ['newSourceCheckedRecords','publishedRecordCount','localEvidenceRecords','datedRecords']}))
