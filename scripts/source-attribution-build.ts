import {consensusResearch} from '../src/research-provenance';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { marked } from 'marked';
import { htmlEscape as esc, safeSourceURL, type Enrichment, type GuideMedia } from './guide-enrichment';
import { physicalSources } from '../src/physical-reference';
import {readWorldGuides} from './world-guide-data';
import {readWritingExamples,type WritingExample} from './writing-collection';
import {readEuropeData} from './europe-build';
import {normalizeEurope,type EuropeSource} from '../src/europe-data';
import {validateEuropeBoundaries,type EuropeBoundaryBundle} from '../src/europe-boundaries';
import type {BoundarySource} from '../src/boundaries';
import type {WorldGuideMedia} from './world-guide-media';

type Source = { url: string; title?: string; authors?: string; doi?: string };
type AttributionInputs = {
  records: { id: string; sources: Source[] }[];
  pages: { id: string; sources: Source[]; sections?: { paragraphs: { sources: string[] }[]; rows: { sources: string[] }[] }[] }[];
  enrichment: Enrichment;
  media: GuideMedia;
  manifests: { file: string; data: unknown; reused: boolean; license?: string }[];
  materials?: (Source & {license: string; licenseUrl: string; note: string})[];
  writing?: WritingExample[];
  europeSources?: EuropeSource[];
  europeBoundaries?: EuropeBoundaryBundle & {sources: (BoundarySource & {download?: string})[]};
  worldMedia?: WorldGuideMedia[];
};
export type AttributionEntry = { title: string; urls: string[]; creators: string[]; kind: string; license: string; licenseUrls: string[]; notes: string[]; usedIn: string[] };
const unknownLicense = 'Referenced only; reuse license not verified';
const doiKey = (value: string) => value.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').toLowerCase();
const keyFor = (url: string, doi?: string) => doi ? 'doi:' + doiKey(doi) : /^https?:\/\/(?:dx\.)?doi\.org\//i.test(url) ? 'doi:' + doiKey(url) : url.replace(/#.*$/, '').replace(/\/$/, '');
const urlsIn = (value: string) => [...value.matchAll(/https?:\/\/[^\s<>"`]+/g)].map(m => m[0].replace(/[.,;]+$/, '').replace(/\)$/, ''));

export function collectSourceAttributions(input: AttributionInputs): AttributionEntry[] {
  const entries = new Map<string, AttributionEntry>();
  const urlToKey = new Map<string, string>();
  const add = (source: Source, where: string, extra: Partial<AttributionEntry> = {}) => {
    if (!/^https?:\/\//.test(source.url)) return;
    safeSourceURL(source.url);
    const key = urlToKey.get(source.url) ?? keyFor(source.url, source.doi);
    const entry = entries.get(key) ?? { title: source.title || source.url, urls: [], creators: [], kind: 'Reference link', license: unknownLicense, licenseUrls: [], notes: [], usedIn: [] };
    if (entry.title === entry.urls[0] && source.title) entry.title = source.title;
    const urls = [source.url, ...(source.doi ? ['https://doi.org/' + doiKey(source.doi)] : []), ...(extra.urls ?? [])];
    for (const url of urls) { if (!entry.urls.includes(url)) entry.urls.push(url); urlToKey.set(url, key); }
    if (source.authors && !entry.creators.includes(source.authors)) entry.creators.push(source.authors);
    if (!entry.usedIn.includes(where)) entry.usedIn.push(where);
    // Item-specific reuse notices take precedence over a bibliographic occurrence.
    if (extra.kind) entry.kind = extra.kind;
    if (extra.license) entry.license = extra.license;
    for (const field of ['licenseUrls', 'notes'] as const) for (const value of extra[field] ?? []) if (!entry[field].includes(value)) entry[field].push(value);
    entries.set(key, entry);
  };
  for (const record of input.records) for (const source of record.sources) add(source, 'Record: ' + record.id);
  for (const source of input.europeSources ?? []) add(source, 'Europe source: ' + source.id);
  for (const page of input.pages) {
    for (const source of page.sources) add(source, 'Guide: ' + page.id);
    for (const section of page.sections ?? []) for (const block of [...section.paragraphs, ...section.rows]) for (const url of block.sources) add({url}, 'Guide: ' + page.id);
  }
  for (const page of input.enrichment.pages) {
    for (const paragraph of page.narrative) for (const url of paragraph.sources) add({url}, 'Guide narrative: ' + page.id);
    for (const source of page.reading) add(source, 'Further reading: ' + page.id);
  }
  for (const manifest of input.manifests) {
    if (manifest.file === 'data/voyages.json') {
      const archive = manifest.data as {sources: (Source & {id: string})[]};
      for (const source of archive.sources) add(source, 'Voyage source: ' + source.id);
    }
    if(manifest.file==='data/world-guide-context-sources.json'){
      const data=manifest.data as {assets:{sourceUrl:string;downloadUrl:string;title:string;copyright?:string;publisher?:string;license:string;licenseUrl:string;processing:string}[]};
      for(const a of data.assets)add({url:a.sourceUrl,title:a.title,authors:a.copyright??a.publisher},manifest.file,{kind:a.license.startsWith('SIL')?'Bundled font':'Reused geographic data',license:a.license,licenseUrls:[a.licenseUrl],urls:[a.downloadUrl],notes:[a.processing]});
      continue;
    }
    const walk = (value: unknown, inheritedLicense = manifest.license ?? '') => {
      if (typeof value === 'string') { for (const url of urlsIn(value)) add({url}, manifest.file); return; }
      if (!value || typeof value !== 'object') return;
      if (Array.isArray(value)) { for (const item of value) walk(item, inheritedLicense); return; }
      const object = value as Record<string, unknown>;
      const license = typeof object.license === 'string' ? object.license : inheritedLicense;
      for (const [field, item] of Object.entries(object)) {
        if (typeof item === 'string' && /^https?:\/\//.test(item) && !/\s/.test(item)) {
          const material = manifest.reused && /^(url|download|request|dataset|data|source|sourceUrl)$/.test(field) && object.referenceOnly !== true;
          add({url:item,title:typeof object.title === 'string' ? object.title : typeof object.source === 'string' && !object.source.startsWith('http') ? object.source : undefined}, manifest.file, material ? {kind:'Reused data / map source',license:license || 'Item-specific terms: consult the full third-party notices and linked provider; no blanket license is asserted.',notes:['Public provenance manifest: '+manifest.file]} : {});
        } else walk(item, license);
      }
    };
    walk(manifest.data);
  }
  for (const material of input.materials ?? []) add(material,'Geographic source notices',{kind:'Reused geographic data',license:material.license,licenseUrls:[material.licenseUrl],notes:[material.note]});
  const boundaryBundle = input.europeBoundaries;
  if (boundaryBundle) {
    for (const source of boundaryBundle.sources) {
      const licenseUrls = source.id === 'ristat'
        ? ['https://creativecommons.org/publicdomain/zero/1.0/', 'https://hdl.handle.net/10622/DN9QDM']
        : urlsIn(source.license);
      const reuse = 'download' in source && source.download ? {
        kind: 'Reused historical boundary data', license: source.license, licenseUrls, urls: [source.download],
      } : {};
      add(source, 'Boundary source: ' + source.id, {...reuse, notes: [source.note]});
      for (const boundary of boundaryBundle.boundaries) {
        if (boundary.sourceIds.includes(source.id)) add(source, 'Boundary: ' + boundary.id);
      }
    }
  }
  for (const image of input.media.images) {
    const label = image.role === 'site-plan' ? 'Historical map / chart' : 'Photograph';
    const kind = image.role === 'site-plan' ? 'Reused historical map / chart' : 'Reused photograph';
    add({url:image.sourcePage,title:image.title,authors:image.creator}, label + ': ' + image.file, {kind,license:image.license,licenseUrls:[image.licenseUrl],urls:[image.sourceUrl],notes:[image.licenseEvidence,image.changes,'The atlas’s noncommercial terms do not apply to this image. Used in: '+image.guideIds.join(', ')]});
  }
  for (const image of input.worldMedia ?? []) {
    const source = {url: image.sourceUrl, title: image.title, authors: image.credit};
    add(source, 'World guide image: ' + image.id, {
      kind: 'Reused photograph', license: image.license, licenseUrls: [image.licenseUrl], urls: [image.imageUrl],
      notes: ['The image file is reproduced unchanged under its own terms.'],
    });
    for (const guideId of image.guideIds) add(source, 'Guide: ' + guideId);
  }
  for(const e of input.writing??[]){
    const o=e.original,t=e.translation,where='Writing pair: '+e.id;
    add({url:o.sourceUrl,title:e.objectId,authors:o.creator},where,{kind:o.kind==='image'?'Reused object photograph':'Original-language transcription',license:o.license,licenseUrls:[o.licenseUrl],notes:[o.note]});
    add({url:t.sourceUrl,title:e.objectId,authors:t.translator},where,{kind:'Original / translated writing witness',license:[o.sourceUrl===t.sourceUrl?o.license:'',t.license??t.rightsNote].filter(Boolean).join(' · '),licenseUrls:t.licenseUrl?[t.licenseUrl]:[],notes:[t.rightsNote,'English '+t.kind+'; original and translation rights are displayed separately on the paired text.']});
  }
  // Individual gazetteer references keep the known provider terms too.
  for (const entry of entries.values()) {
    if (entry.kind === 'Reused photograph' || entry.kind === 'Reused historical map / chart') continue;
    if (entry.urls.some(url => /^https?:\/\/(?:www\.|download\.)?geonames\.org\//.test(url))) {
      entry.kind='Reused geographic data';entry.license='CC BY 4.0';entry.licenseUrls=['https://creativecommons.org/licenses/by/4.0/'];
      if(!entry.creators.includes('GeoNames'))entry.creators.push('GeoNames');
    }
    if (entry.urls.some(url => /^https?:\/\/(?:www\.|nominatim\.)?openstreetmap\.org\/(?:node|way|relation|search|reverse)/.test(url))) {
      entry.kind='Reused geographic reference';entry.license='Open Database License 1.0 (ODbL)';entry.licenseUrls=['https://www.openstreetmap.org/copyright'];
      if(!entry.creators.includes('© OpenStreetMap contributors'))entry.creators.push('© OpenStreetMap contributors');
    }
  }
  // A DOI can first appear after both its journal URL and resolver URL were seen.
  // Merge connected aliases after collection so input ordering never splits a source.
  const unique = new Set<AttributionEntry>(), aliases = new Map<string,AttributionEntry>();
  for (const entry of entries.values()) {
    const matches = new Set(entry.urls.map(url => aliases.get(keyFor(url))).filter((value): value is AttributionEntry => !!value));
    const target = matches.values().next().value ?? entry;
    for (const other of new Set([entry,...matches])) {
      if (other === target) continue;
      for (const field of ['urls','creators','licenseUrls','notes','usedIn'] as const) for (const value of other[field]) if (!target[field].includes(value)) target[field].push(value);
      if (other.kind !== 'Reference link') { target.kind=other.kind;target.license=other.license; }
      unique.delete(other);
    }
    unique.add(target);
    for (const url of target.urls) aliases.set(keyFor(url),target);
  }
  return [...unique].sort((a,b) => a.title.localeCompare(b.title));
}

export async function loadAttributionInputs(): Promise<AttributionInputs> {
  const [{dataset}, pages, enrichment, media, europe, europeBoundaries, worldMedia] = await Promise.all([
    import('../src/published-data'),
    readFile('data/site-guide-content.json','utf8').then(JSON.parse),
    readFile('data/guide-enrichment.json','utf8').then(JSON.parse),
    readFile('data/guide-media/manifest.json','utf8').then(JSON.parse),
    readEuropeData(),
    readFile('data/atlases/europe/boundaries.json','utf8').then(JSON.parse).then(validateEuropeBoundaries),
    readFile('data/world-guide-media.json','utf8').then(JSON.parse).then((manifest: {assets: WorldGuideMedia[]}) => manifest.assets),
  ]);
  const manifests: AttributionInputs['manifests'] = [];
  const walk = async (directory: string) => {
    for (const item of await readdir(directory, {withFileTypes:true})) {
      const file = directory + '/' + item.name;
      if (item.isDirectory()) { await walk(file); continue; }
      // Raw event pages are represented by their fetch manifest and cited records.
      if (!item.name.endsWith('.json') || (directory === 'data/physical-sources' && !/manifest|import/.test(item.name)) || ['site-guide-content.json','guide-enrichment.json','shipwreck-catalog-details.json'].includes(item.name) || directory === 'data/guide-media') continue;
      if (file === 'data/world-guide-media.json' || (directory === 'data/atlases/europe' && (item.name.endsWith('-evidence.json') || item.name === 'boundaries.json'))) continue;
      const reused = /(?:boundary-sources|terrain\/sources|guide-maps\/manifest|physical-sources\/fetch-manifest|rail-network\.json)/.test(file);
      const data = JSON.parse(await readFile(file,'utf8'));
      const license = file === 'data/guide-terrain/sources.json' ? 'Mixed elevation-source terms; preserve Mapzen/Tilezen and upstream credits in the linked attribution document.' : file === 'data/rail-network.json' ? data.provenance.license : undefined;
      manifests.push({file,data,reused,license});
    }
  };
  await walk('data');
  manifests.push({file:'src/physical-reference.ts',data:physicalSources.map(source => ({...source,referenceOnly:['nadi1','gergis2009','ocean','enso-mechanism'].includes(source.id)})),reused:true});
  for (const file of ['THIRD_PARTY.md','LICENSE.md','README.md','DEPLOYMENT.md']) manifests.push({file,data:await readFile(file,'utf8'),reused:false});
  const materials = [{url:'https://www.geonames.org/export/',title:'GeoNames gazetteer country extracts',authors:'GeoNames',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',note:'Selected modern reference coordinates from public country dumps, rounded for public display; feature IDs and source URLs remain in the relevant records. Historical claims are independently sourced. GeoNames data retains CC BY 4.0; the atlas’s noncommercial restriction does not replace it.'}];
  const world=await readWorldGuides();
  return {records:[...dataset.records,...normalizeEurope(europe)],pages:[...pages.pages,...world.map(g=>({id:g.id,sources:g.sources}))],enrichment,media,manifests,materials,writing:await readWritingExamples(),europeSources:europe.sources,europeBoundaries,worldMedia};
}

function noticeHTML(markdown: string): string {
  return marked.parse(markdown.replace(/</g,'&lt;'), {async:false,walkTokens(token) {
    if (token.type === 'link') {
      if (/^https?:\/\//.test(token.href)) safeSourceURL(token.href);
      else if (token.href === 'docs/guide-reuse.md') token.href = 'guide-reuse.html';
      else if (/^[a-zA-Z0-9_./#-]+$/.test(token.href) && !token.href.startsWith('#')) token.href = '../' + token.href;
      else if (!token.href.startsWith('#')) throw new Error('Unsafe notice link');
    }
  }}) as string;
}
const consensusDiscoveryAcknowledgement = `<section id="consensus-discovery"><h2>Primary paper discovery: Consensus</h2><p>We use <a href="https://consensus.app/" target="_blank" rel="noopener noreferrer">Consensus</a> a lot. Deep Research runs and paper lookups across archaeology, radiocarbon and luminescence dating, ancient DNA, linguistics and archival history have helped surface the primary studies behind this atlas.</p><p>We do not reproduce Consensus’s full Deep Research reviews here. Visit Consensus to explore its reviews and the literature yourself; access may require your own account. The atlas’s own <a href="../#dives">deep dives</a> are separately authored, mostly with AI assistance, and checked against cited primary sources.</p><p>We encourage you to read the Consensus reviews. We often find them especially useful for putting a region’s literature in perspective, alongside published review articles. We have tried several paper-discovery and research-summary tools, and this is the best we have found for getting to useful answers quickly. This acknowledgement is not paid for.</p><p>Thank you to the Consensus team for building such a useful research tool. <em>The Spread of Peoples</em> is an independent TripoFisch project and is not affiliated with, authorized by, sponsored by or endorsed by Consensus.</p><p class="fine">Research counters: 110+ Deep Research runs is the project owner’s total, including earlier PDF archives. The ${consensusResearch.citedPaperMatches} cited papers are distinct DOI-backed bibliography entries matched to retained Deep Research citations and Consensus API lookups (159 across 11 retained reports plus 274 net-new DOIs across Africa Holocene, Mediterranean trade, Mecca, Islam and Christianity); this is a documented subset, not a complete lifetime total or a count of clicks. <a href="../docs/reuse-and-contributing.html">Counter method and publication practice</a>.</p></section>`;

export function sourceAttributionHTML(entries: AttributionEntry[], thirdParty: string, projectLicense: string): string {
  const rows = entries.map((entry,index) => `<tr data-source-row><th scope="row"><span class="source-number">${index+1}</span> ${esc(entry.title)}<div class="source-urls">${entry.urls.map(url => `<a href="${safeSourceURL(url)}">${esc(url)}</a>`).join('<br>')}</div>${entry.creators.length ? `<p>${esc(entry.creators.join('; '))}</p>` : ''}</th><td><strong>${esc(entry.kind)}</strong><p>${esc(entry.license)}</p>${entry.licenseUrls.map(url => `<p><a href="${safeSourceURL(url)}">License / rights statement ↗</a></p>`).join('')}${entry.notes.map(note => `<p>${esc(note)}</p>`).join('')}</td><td><details><summary>${entry.usedIn.length} use${entry.usedIn.length===1?'':'s'} in the atlas</summary><ul>${entry.usedIn.map(use => `<li>${esc(use)}</li>`).join('')}</ul></details></td></tr>`).join('');
  return `<div class="eyebrow">Provenance and reuse</div><h1>Sources, attributions &amp; licenses</h1><p class="lead">The sources behind the atlas, together with the rights statements for material it reuses.</p><p>This register brings together the published evidence records, guide citations and reading links, public data and map manifests, and the project’s third-party notices. URLs and DOI aliases are grouped while retaining every cited address. The complete source details and qualifications remain in each evidence record.</p><nav class="local-nav" aria-label="Attribution sections"><a href="#consensus-discovery">Research discovery &amp; thanks</a><a href="#source-register">Search the source register</a><a href="#rights-overview">How the licenses apply</a><a href="#third-party-notices">Complete third-party notices</a><a href="#project-license">Project license</a></nav>${consensusDiscoveryAcknowledgement}<section id="rights-overview"><h2>How the licenses apply</h2><ul><li><strong>Original educational prose and data curation:</strong> Americas Peoples and its credited contributors, CC BY-NC-SA 4.0. Underlying facts and public-domain works are not restricted by that license.</li><li><strong>Original software:</strong> PolyForm Noncommercial 1.0.0. Incorporated libraries retain their own copyright and license notices below.</li><li><strong>Photographs and historical charts:</strong> each image keeps the creator, source, license and change statement shown beneath it and in the <a href="guide-media/manifest.json">guide image manifest</a>. The atlas does not add a noncommercial restriction to CC BY, CC0 or public-domain images.</li><li><strong>References:</strong> a citation is a link for evidence or further reading, not a claim that the source has an open license. “Reuse license not verified” does not mean permission to copy.</li><li><strong>Wikipedia and institutional websites:</strong> guide reading links do not reproduce their essays. No Wikipedia prose is relicensed under the atlas’s noncommercial terms. Government websites can contain third-party material; item-level rights must still be checked.</li><li><strong>Consensus and the atlas’s deep dives:</strong> Consensus helps us discover literature. Its full Deep Research reviews are not reproduced here; public source-status pages link to Consensus, where access may require an account. The atlas’s own deep dives are separately authored and link to primary sources.</li></ul><p><a href="guide-reuse.html">Guide writing and image reuse policy</a> · <a href="../THIRD_PARTY.md">Third-party notices as text</a> · <a href="../LICENSE.md">Project license as text</a></p></section><section id="source-register"><h2>Source register</h2><label for="source-search">Search sources, creators, licenses or places</label><input id="source-search" type="search" placeholder="Try Yap, NPS, CC BY, a DOI, or a record ID"><p id="source-count" role="status">${entries.length.toLocaleString('en-US')} sources</p><div class="table-scroll"><table class="attribution-table"><thead><tr><th>Source and creator</th><th>Use and rights</th><th>Where it appears</th></tr></thead><tbody>${rows}</tbody></table></div><noscript><p>All sources are listed above. Use your browser’s Find command to search without JavaScript.</p></noscript></section><section id="third-party-notices"><h2>Complete third-party notices</h2><p>These notices retain the original copyright statements, licenses and component-specific qualifications. They take precedence over a short register label.</p>${noticeHTML(thirdParty)}</section><section id="project-license"><h2>Project license</h2>${noticeHTML(projectLicense)}</section><script src="sources-attributions.js" defer></script>`;
}
export const sourceAttributionScript = `const search=document.getElementById('source-search'),rows=[...document.querySelectorAll('[data-source-row]')],texts=rows.map(r=>r.textContent.toLocaleLowerCase());const filterSources=()=>{const words=search.value.toLocaleLowerCase().trim().split(/\\s+/).filter(Boolean);let count=0;rows.forEach((row,i)=>{const show=words.every(w=>texts[i].includes(w));row.hidden=!show;if(show)count++});document.getElementById('source-count').textContent=count.toLocaleString()+' of '+rows.length.toLocaleString()+' sources'};search.addEventListener('input',filterSources);filterSources();`;

export const attributionCSS = '#source-search{display:block;width:min(100%,760px);font:inherit;padding:.8rem;margin-top:.6rem;border:1px solid #8297a6;border-radius:4px}.attribution-table{font-size:.85rem;table-layout:fixed}.attribution-table th:first-child{width:44%}.attribution-table th:last-child{width:24%}.attribution-table th[scope=row]{background:white;font-weight:500}.source-urls{font-size:.75rem;margin-top:.5rem;overflow-wrap:anywhere}.source-number{font-size:.7rem;color:#536874}.attribution-table td p{margin:.5rem 0}.attribution-table details{padding:.4rem;border:0;margin:0}.attribution-table li{overflow-wrap:anywhere}.attribution-table tr[hidden]{display:none}#third-party-notices,#project-license{max-width:95ch}#third-party-notices pre{white-space:pre-wrap}@media(max-width:650px){.attribution-table{min-width:750px}}';

export async function buildSourceAttributions(shell: (title: string, body: string) => string): Promise<void> {
  const inputs = await loadAttributionInputs();
  const entries = collectSourceAttributions(inputs);
  const [thirdParty, projectLicense] = await Promise.all([readFile('THIRD_PARTY.md','utf8'),readFile('LICENSE.md','utf8')]);
  await mkdir('sites',{recursive:true});
  await writeFile('sites/sources-attributions.js',sourceAttributionScript);
  await writeFile('sites/sources-attributions.html',shell('Sources, attributions & licenses',sourceAttributionHTML(entries,thirdParty,projectLicense)));
  await writeFile('sites/sources-attributions.json',JSON.stringify({generatedAt:'2026-11-18',scope:'Canonical and Europe evidence records, guide citations and images, boundary data, public data metadata and third-party notices',entries},null,2)+'\n');
}
