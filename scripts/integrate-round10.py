"""Publish reviewed findings idempotently; discovery reports never become facts automatically."""
from pathlib import Path
import json,html
root=Path.cwd()
incoming=json.loads((root/'data/round10-reviewed.json').read_text(encoding='utf-8'))
path=root/'data/research-proposals.json';package=json.loads(path.read_text(encoding='utf-8'))
new=incoming['records'];ids={r['id'] for r in new};assert len(ids)==len(new)
base=json.loads((root/'data/evidence.json').read_text(encoding='utf-8'))['records']
assert not ids.intersection(r['id'] for r in base)
before={p['record']['id']:p for p in package['proposals'] if not p['record']['id'].startswith('r10v-')}
existing={p['record']['id']:p for p in package['proposals']}
for r in new:
 if r['id'] in existing:existing[r['id']]['record']=r
 else:package['proposals'].append(dict(id='author-'+r['id'],version=1,kind='new',targetId=None,baseRevision=None,baseRecord=None,record=r,rationale='Round10 original-source or institutional finding with explicit access, geography and chronology limits.',state='ready',createdAt='2026-10-30T02:00:00Z',updatedAt='2026-10-30T02:00:00Z'))
assert all(before[p['record']['id']]==p for p in package['proposals'] if p['record']['id'] in before)
path.write_text(json.dumps(package,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={k:v for k,v in incoming.items() if k!='records'}
report.update(release=json.loads((root/'package.json').read_text())['version'],recordIds=sorted(ids),newSourceCheckedRecords=len(new),publishedRecordCount=len({r['id'] for r in base}|{p['record']['id'] for p in package['proposals']}),localEvidenceRecords=sum(bool(r.get('location') and not r.get('overlay')) for r in new),datedRecords=sum(r['time']['kind']!='unplaced' for r in new),method='Original publications, accessed abstracts and institutional summaries support narrowed findings. Regional/uncertain evidence remains separate from individual site activity. All bibliography leads are retained; inclusion is not verification. Raw uploads remain private.')
(root/'data/round10-synthesis.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
style='body{font:16px/1.6 system-ui;background:#10242e;color:#eff6f7;max-width:1100px;margin:30px auto;padding:20px}a{color:#8be3dd}details{border:1px solid #647881;padding:12px;margin:12px 0}summary{cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere}'
body=f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Round ten research and source decisions</title><style>{style}</style><a href="../index.html#map">← Atlas</a><h1>Round ten: sites, source checks and remaining leads</h1><p>{len(new)} new findings; {report["localEvidenceRecords"]} named-locality evidence records and {report["datedRecords"]} with calendar windows. These are records, not an equal number of new settlements. {len(report["held"])} interpretation groups remain unresolved. The published collection now has {report["publishedRecordCount"]} records.</p>'
body+=f'<p>{report["intakeFiles"]} file receipts resolve to {report["uniqueFileHashes"]} distinct file hashes. Six repeated files within this round and a repeated Inca PDF from the previous round do not generate extra evidence. Forty paper-table rows retain their discovery trail; reviews, incorrect references and incomplete rows are not treated as primary findings.</p>'
body+='<p><a href="coverage-audit.html">Updated coverage gaps</a> · <a href="../round10-synthesis.json">Structured source decisions</a> · <a href="../round10-bibliography.json">Bibliographic leads</a></p><h2>Interpretive limits</h2><p>Calibrated and uncalibrated ages remain distinct. Separate hearths, burials and construction episodes do not establish continuous village residence. Typological dates remain identified as such. Coarse locality points may be several kilometres from the actual site; they are unsuitable for navigation. Genetic ancestry does not establish a language. Material sourcing does not identify a direct journey or trader. Population counts remain unknown unless explicitly sourced.</p>'
body+='<p>Important reconciliations include the single-sided canoe-canal construction constraint, newer Anzick dating, separate Last Supper Cave hearths, Aleutian mortuary-reservoir revisions, and the distinction between old feast debris and later mound construction. Earlier Bayshore Homes phase windows and Cooper’s Ferry Area B evidence remain intact.</p><h2>Added findings</h2>'
lookup={r['id']:r for r in new}
for g in report['groups']:
 body+='<h3>'+html.escape(g['id'])+'</h3><ul>'
 for rid in g['recordIds']:
  r=lookup[rid];body+='<li><a href="../index.html#review/'+html.escape(rid)+'">'+html.escape(r['title'])+'</a> — '+html.escape(r['time']['original'])+'</li>'
 body+='</ul><details><summary>Source access and reconciliation</summary><pre>'+html.escape(json.dumps(dict(sourceChecks=g['sourceChecks'],reconciled=g['reconciled']),ensure_ascii=False,indent=2))+'</pre></details>'
body+='<h2>Held claims and unresolved leads</h2>'
for h in report['held']:
 body+='<details><summary>'+html.escape(str(h['topic']))+'</summary><p>'+html.escape(str(h['reason']))+'</p><pre>'+html.escape(json.dumps(h['details'],ensure_ascii=False,indent=2))+'</pre></details>'
body+='<h2>Topic receipt accounting</h2><ul>'
for t in report['topicDecisions']:body+='<li>'+html.escape(t['title'])+' — '+html.escape(t['status'])+'<p>'+html.escape(t['reviewFlags'])+'</p></li>'
body+='</ul><h2>Paper-table discovery index</h2><p>Bibliographic leads only; see source decisions above before using generated summaries.</p><ul>'
for p in report['paperLeadIndex']:body+='<li>'+html.escape(p['title'])+' ('+str(p['year'])+')</li>'
(root/'docs/round10-synthesis.html').write_text(body+'</ul></html>',encoding='utf-8')
print(json.dumps({k:report[k] for k in ['newSourceCheckedRecords','publishedRecordCount','localEvidenceRecords','datedRecords']}))
