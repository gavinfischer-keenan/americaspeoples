"""Idempotent publication of explicit reviewed records; never infer facts from RIS."""
from pathlib import Path
import json,html
root=Path.cwd()
incoming=json.loads((root/'data/round9-reviewed.json').read_text(encoding='utf-8'))
path=root/'data/research-proposals.json';package=json.loads(path.read_text(encoding='utf-8'))
new=incoming['records'];ids={r['id'] for r in new};assert len(ids)==len(new)
base=json.loads((root/'data/evidence.json').read_text(encoding='utf-8'))['records']
assert not ids.intersection(r['id'] for r in base)
existing={p['record']['id']:p for p in package['proposals']}
for r in new:
 proposal=dict(id='author-'+r['id'],version=1,kind='new',targetId=None,baseRevision=None,baseRecord=None,record=r,rationale='Round-nine source-checked finding; regional counts and sample dates retain their scope.',state='ready',createdAt='2026-10-30T01:00:00Z',updatedAt='2026-10-30T01:00:00Z')
 if r['id'] in existing:existing[r['id']]['record']=r
 else:package['proposals'].append(proposal)
path.write_text(json.dumps(package,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={k:v for k,v in incoming.items() if k!='records'}
report.update(release=json.loads((root/'package.json').read_text())['version'],recordIds=[r['id'] for r in new],newSourceCheckedRecords=len(new),publishedRecordCount=len(base)+len(package['proposals']),localEvidenceRecords=sum(bool(r.get('location') and not r.get('overlay')) for r in new),datedRecords=sum(r['time']['kind']!='unplaced' for r in new),method='Narrow original-source findings admitted, prior claims reconciled, specific unresolved interpretations held. Topic accounting is comprehensive for receipts, not an assertion that every generated sentence or bibliography entry is verified. Raw reports remain private.')
(root/'data/round9-synthesis.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
style='body{font:16px/1.6 system-ui;background:#10242e;color:#eff6f7;max-width:1100px;margin:30px auto;padding:20px}a{color:#8be3dd}details{border:1px solid #647881;padding:12px;margin:12px 0}summary{cursor:pointer}table{border-collapse:collapse}td,th{border:1px solid #647881;padding:8px;text-align:left}small{color:#cbd8dc}'
body=f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Round nine research and source decisions</title><style>{style}</style><a href="../index.html#map">← Atlas</a><h1>Round nine: research, corrections and remaining leads</h1><p>{report["intakeFiles"]} files across {len(report["topicDecisions"])} topics, {report["pdfPages"]} report pages and {report["uniqueReferenceKeys"]} distinct bibliographic leads were captured, alongside the previously held whaling and official census material. {len(new)} source-checked records were added: {report["datedRecords"]} with calendar guidance and {report["localEvidenceRecords"]} individual-locality evidence records. {len(report["held"])} unresolved claim groups remain explicit below.</p>'
body+='<p>Generated syntheses are discovery leads. Original findings are narrowed to what the accessed paper, abstract, official source or community account supports. Buildings, rooms, samples, casualties and regional totals are not settlement populations. Relative BP ages are not silently recalibrated. Connections and climate correlations do not prove particular journeys or causes of war.</p><p><a href="coverage-audit.html">Updated coverage gaps and next research questions</a> · <a href="../round9-synthesis.json">Structured source decisions</a> · <a href="../round9-bibliography.json">Complete bibliography lead index</a> · <a href="../colonial-population-series.json">Official regional population series</a></p>'
body+='<h2>Regional census estimates</h2><p>These selected 1700, 1750 and 1780 colony totals are from the official historical Census compilation. They are not town populations, a complete Indigenous census, or language statistics; they do not resize settlement dots. Massachusetts includes Maine counties in 1700 and 1750, while 1780 lists Maine separately. The 1666 New France enumeration is a separate record.</p><table><thead><tr><th>Region</th><th>1700</th><th>1750</th><th>1780</th></tr></thead><tbody>'
for series in json.loads((root/'data/colonial-population-series.json').read_text(encoding='utf-8'))['series']:
 values={s['year']:s['estimate'] for s in series['samples']}
 body+='<tr><th><a href="../index.html#review/'+series['recordId']+'">'+html.escape(series['region'])+'</a></th>'+''.join('<td>'+ (f'{values[y]:,}' if y in values else 'Not included')+'</td>' for y in [1700,1750,1780])+'</tr>'
body+='</tbody></table><h2>Added source-linked findings</h2>'
for g in report['groups']:
 body+='<section><h3>'+html.escape(g['id'])+'</h3><ul>'
 for rid in g['recordIds']:
  r=next(r for r in new if r['id']==rid)
  body+='<li><a href="../index.html#review/'+rid+'">'+html.escape(r['title'])+'</a> — '+html.escape(r['time']['original'])+'</li>'
 body+='</ul><details><summary>Source checks and reconciliation</summary><pre style="white-space:pre-wrap">'+html.escape(json.dumps(dict(sourceChecks=g['sourceChecks'],reconciled=g['reconciled']),ensure_ascii=False,indent=2))+'</pre></details></section>'
body+='<h2>Unresolved claims and limits</h2>'
for h in report['held']:
 body+='<details><summary>'+html.escape(h['topic'])+'</summary><p>'+html.escape(h['reason'])+'</p></details>'
body+='<h2>Receipt accounting</h2><p>The repeated north–south Central American trade report was reconciled with prior findings. The later Inca PDF and second RIS export are retained alongside the first bibliography. Citation overlap alone never creates or removes a fact.</p><ul>'+''.join('<li>'+html.escape(t['topic'])+' — '+html.escape(t['status'])+'</li>' for t in report['topicDecisions'])+'</ul></html>'
(root/'docs/round9-synthesis.html').write_text(body,encoding='utf-8')
print(json.dumps({k:report[k] for k in ['newSourceCheckedRecords','publishedRecordCount','localEvidenceRecords','datedRecords']}))
