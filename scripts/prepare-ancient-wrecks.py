"""Small independently reviewed excavated-loss supplement to modern inventories."""
import importlib.util,json
from pathlib import Path
spec=importlib.util.spec_from_file_location('wrecks',Path(__file__).with_name('import-shipwrecks.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
rows=[
 ('dokos','Dokos — Early Helladic cargo assemblage',-2200,-2200,37.34,23.34,
  'Hellenic Institute of Marine Archaeology','The Early Bronze Age wreck at Dokos',
  'https://ienae.gr/ναυάγιο-δοκού/',
  'About 2200 BCE; ceramic dating to the Early Helladic II period.',
  'Pottery concentrated in Skindos Bay is interpreted by the excavators as a lost ship’s cargo. It is among the earliest excavated maritime-loss assemblages.',
  'No preserved ship hull establishes its outline. The approximate date and rounded bay-level marker do not identify a sinking day or a surveyed wreck footprint.'),
 ('uluburun','Uluburun — copper, tin and luxury cargo',-1335,-1305,36.13,29.68,
  'Institute of Nautical Archaeology','Uluburun Late Bronze Age Shipwreck Excavation',
  'https://nauticalarch.org/projects/uluburun-late-bronze-age-shipwreck-excavation/',
  'INA project chronology: ca. 1320 ± 15 BCE; archaeological and tree-ring evidence.',
  'Copper and tin ingots, glass, pottery and luxury materials reveal a wide Late Bronze Age maritime network. Hull fragments preserve pegged mortise-and-tenon construction.',
  'Cargo origins do not prove every port visited, the ship’s intended destination or a continuous mapped itinerary.'),
 ('gelidonya','Cape Gelidonya — metalworking cargo',-1200,-1200,36.19,30.40,
  'Institute of Nautical Archaeology','Cape Gelidonya Late Bronze Age Shipwreck Excavation',
  'https://nauticalarch.org/projects/cape-gelidonya-late-bronze-age-shipwreck-excavation/',
  'About 1200 BCE; archaeological cargo chronology, not an exact-year observation.',
  'A merchant vessel lost near the cape carried metal ingots, scrap and tools. The assemblage shows how maritime movement supplied metalworking.',
  'The point locates the cape and adjacent islands approximately. Tools suggest onboard metalworking; they do not identify a named crew.'),
 ('kyrenia','Kyrenia — a Hellenistic merchant ship',-296,-271,35.35,33.33,
  'Sturt W. Manning, Brita Lorentzen, Martin Bridge and colleagues','A revised radiocarbon calibration curve 350–250 BCE impacts high-precision dating of the Kyrenia Ship',
  'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0302645',
  '2024 radiocarbon/Bayesian reanalysis: preferred sinking interval 296–271 BCE, with higher probability at 286–272 BCE.',
  'A surviving wooden hull and cargo off northern Cyprus document a Hellenistic merchant vessel. Almonds and newly cleaned wood samples help constrain its final voyage.',
  'This is a probability interval, not 25 years of repeated wrecking. The rounded offshore marker is not the museum location or an excavation plan.')
]
out=[]
for key,title,start,end,lat,lon,author,publication,url,dates,summary,limits in rows:
 # Explicit BCE labels use astronomical numbering in the atlas (1 BCE = 0).
 start += 1; end += 1
 source=m.source('ancient-'+key,author,publication,url,'Linked excavation project or primary dating study. Independently written summary.')
 source['referenceType']='web-resource'
 if key=='kyrenia':source.update(year=2024,referenceType='journal-article',venue='PLOS ONE',doi='10.1371/journal.pone.0302645')
 r=m.evidence({},source,'ancient-'+key,start,None,lat,lon,title,'merchant vessel','',dates,title)
 r['title']=title;r['time'].update(start=start,end=end,original=dates,method=dates,approximate=True)
 r['location']['precision']='Approximate public locality, rounded to 0.01 degrees; see source maps for the archaeological site.'
 r['location']['provenance']='Public locality described by the excavation source; approximate geographic reference, not a survey coordinate.'
 r['claims'][0].update(text=summary,explanation=limits)
 r['claims'][0]['support'][0].update(locator='Project overview and dating discussion',note=dates)
 r['review'].update(summary=summary,limitations=limits,discussion='Archaeological dating is kept distinct from the modern discovery and excavation dates.',provenance='Original-source review of the linked excavation or chronology; no exact voyage is inferred.')
 if key=='uluburun':
  r['revision']=2
  r['review']['relatedIds']=['trade-deep-ae-uluburun']
  r['review']['discussion']+=' The related trade record concerns Cypriot copper in this same cargo assemblage, not a separate loss or independent cargo discovery.'
  r['review']['reviewedAt']='2026-11-18'
  r['review']['history'].append('2026-11-18: Cross-linked the Cypriot copper-provenance record while preserving this record’s wreck and cargo claim.')
 out.append(r)
Path('data/ancient-shipwreck-records.json').write_text(json.dumps({'records':out},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Prepared',len(out),'ancient wreck records')
