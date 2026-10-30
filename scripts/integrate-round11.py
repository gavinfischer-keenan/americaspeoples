"""Integrate reviewed proposals without changing prior published evidence."""
from pathlib import Path
import json,html
root=Path.cwd();incoming=json.loads((root/'data/round11-reviewed.json').read_text(encoding='utf-8'));path=root/'data/research-proposals.json';package=json.loads(path.read_text(encoding='utf-8'))
new=incoming['records'];ids={r['id'] for r in new};assert len(ids)==len(new)
base=json.loads((root/'data/evidence.json').read_text(encoding='utf-8'))['records'];assert not ids.intersection(r['id'] for r in base)
before={p['record']['id']:p for p in package['proposals'] if not p['record']['id'].startswith('r11v-')};package['proposals']=[p for p in package['proposals'] if not p['record']['id'].startswith('r11v-') or p['record']['id'] in ids];existing={p['record']['id']:p for p in package['proposals']}
for r in new:
 if r['id'] in existing:existing[r['id']]['record']=r
 else:package['proposals'].append(dict(id='author-'+r['id'],version=1,kind='new',targetId=None,baseRevision=None,baseRecord=None,record=r,rationale='Round11 original-source finding with explicit chronology, geography and access limits.',state='ready',createdAt='2026-10-30T03:00:00Z',updatedAt='2026-10-30T03:00:00Z'))
assert all(before[p['record']['id']]==p for p in package['proposals'] if p['record']['id'] in before)
path.write_text(json.dumps(package,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={k:v for k,v in incoming.items() if k!='records'}
report.update(release='0.4.5',recordIds=sorted(ids),newSourceCheckedRecords=len(new),publishedRecordCount=len({r['id'] for r in base}|{p['record']['id'] for p in package['proposals']}),localEvidenceRecords=sum(bool(r.get('location') and not r.get('overlay')) for r in new),datedRecords=sum(r['time']['kind']!='unplaced' for r in new),method='Source-specific findings supported by accessed originals, abstracts or institutional publications. A report or bibliography is a discovery trail, not verification. Raw reports remain private.')
(root/'data/round11-synthesis.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
esc=lambda value:html.escape(str(value))
style='body{font:16px/1.6 system-ui;background:#10242e;color:#eff6f7;max-width:1100px;margin:30px auto;padding:20px}a{color:#8be3dd}details{border:1px solid #647881;padding:12px;margin:12px 0}summary{cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere}'
body=f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Round eleven research and source decisions</title><style>{style}</style><a href="../index.html#map">← Atlas</a><h1>Round eleven: sites, source checks and remaining leads</h1><p>{len(new)} new findings; {report["localEvidenceRecords"]} named-locality evidence records and {report["datedRecords"]} with calendar windows. These are records, not an equal number of new settlements. {len(report["held"])} source/interpretation leads remain unresolved. The published collection now has {report["publishedRecordCount"]} records.</p>'
body+=f'<p>{report["intakeFiles"]} archived receipts resolve to {report["uniqueFileHashes"]} distinct file hashes and {report["pdfPagesIncludingRepeatReceipts"]} PDF pages. Repeated chat attachments do not generate extra evidence. {report["referenceOccurrences"]} RIS reference occurrences and {report["paperRows"]} paper-table rows retain their discovery trail. Generic filenames were matched by content and hash, not treated as permanent document identities.</p>'
body+='<p><a href="coverage-audit.html">Updated coverage gaps</a> · <a href="../round11-synthesis.json">Structured decisions</a> · <a href="../round11-bibliography.json">Bibliographic leads</a></p><h2>Interpretive limits</h2><p>Genetic affinity does not identify a language. Artifact sourcing does not establish a direct voyage or the identity of traders. Separate occupation phases do not establish continuous habitation. Regional counts of platforms, structures and samples are not settlement populations. Uncalibrated dates are not silently converted to calendar years. Named sites without reliable coordinates remain in the evidence catalog; regional display anchors are explicitly identified. Locality pins are unsuitable for navigation.</p><p>This release preserves critiques of Upano chronology, Southern California contact proposals, and ancient language attribution. Later ceramic continuity, modern genomes and generic regional arrival dates cannot supply missing early dates for named sites. A gap in dates is not proof of human absence.</p><h2>Added findings</h2>'
lookup={r['id']:r for r in new}
for g in report['groups']:
 body+='<h3>'+esc(g['id'])+'</h3><ul>'
 for rid in g['recordIds']:
  r=lookup[rid];body+='<li><a href="../index.html#review/'+esc(rid)+'">'+esc(r['title'])+'</a> — '+esc(r['time']['original'])+'</li>'
 body+='</ul><details><summary>Source access and reconciliations</summary><pre>'+esc(json.dumps({k:v for k,v in g.items() if k not in ['recordIds']},ensure_ascii=False,indent=2))+'</pre></details>'
body+='<h2>Held claims and unresolved leads</h2>'
for h in report['held']:body+='<details><summary>'+esc(h['topic'])+'</summary><p>'+esc(h['reason'])+'</p><pre>'+esc(json.dumps(h['details'],ensure_ascii=False,indent=2))+'</pre></details>'
body+='<h2>Topic and bibliography decisions</h2><p>These include reconciliations and held leads, not only new findings.</p>'
for d in report['topicDecisions']:
 body+='<details><summary>'+esc(d.get('title',d.get('topic',d.get('doi','Research lead'))))+'</summary><pre>'+esc(json.dumps(d,ensure_ascii=False,indent=2))+'</pre></details>'
body+='<h2>Archived topic receipts</h2><ul>'+''.join('<li>'+esc(x['title'])+'</li>' for x in report['intakeTopics'])+'</ul><h2>Paper-table discovery index</h2><ul>'
body+=''.join('<li>'+esc(p['title'])+' ('+esc(p['year'])+')</li>' for p in report['paperLeadIndex'])+'</ul></html>'
(root/'docs/round11-synthesis.html').write_text(body,encoding='utf-8');print(json.dumps({k:report[k] for k in ['newSourceCheckedRecords','publishedRecordCount','localEvidenceRecords','datedRecords']}))
