import { readFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export type GuideSource = { url: string; title: string };
export type Reading = GuideSource & { kind: string; language?: string; note?: string; checkedAt?: string };
export type Enrichment = { pages: { id: string; heading: string; narrative: { text: string; sources: string[] }[]; reading: Reading[]; citationTitles?: Record<string,string> }[] };
export type GuideMedia = { images: { id: string; role?: 'site-plan'; file: string; title: string; creator: string; creatorUrl?: string; sourcePage: string; sourceUrl: string; license: string; licenseUrl: string; licenseEvidence: string; checkedAt: string; changes: string; guideIds: string[]; alt: string; caption: string; width: number; height: number; bytes: number; sha256: string; projectLicenseApplies: boolean }[] };
export const htmlEscape = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
export function safeSourceURL(value: string): string {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || /[\u0000-\u0020]/.test(value)) throw new Error('Unsafe source URL');
  return htmlEscape(value);
}
const sourceName = (url: string) => new URL(url).hostname.replace(/^(www\.|home\.)/, '');

type GuideImage = GuideMedia['images'][number];

export function guideImagePath(image: GuideImage): string {
  if (!/^[a-z0-9-]+\.(jpg|png|webp)$/.test(image.file) || image.projectLicenseApplies !== false) throw new Error('Unsafe or unlicensed guide image: ' + image.id);
  return 'guide-media/' + image.file;
}

export function guideImageHTML(image: GuideImage, className?: string): string {
  if (![image.width, image.height].every(n => Number.isSafeInteger(n) && n > 0)) throw new Error('Invalid guide image dimensions: ' + image.id);
  const classAttribute = className ? ` class="${htmlEscape(className)}"` : '';
  return `<img${classAttribute} src="${guideImagePath(image)}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async" alt="${htmlEscape(image.alt)}">`;
}

export function guideImageCaptionHTML(image: GuideImage): string {
  const creator = image.creatorUrl ? `<a href="${safeSourceURL(image.creatorUrl)}">${htmlEscape(image.creator)}</a>` : htmlEscape(image.creator);
  return `<figcaption><p>${htmlEscape(image.caption)}</p><p class="photo-credit">${htmlEscape(image.title)} — ${creator}. <a href="${safeSourceURL(image.sourcePage)}">Image source</a> · <a href="${safeSourceURL(image.licenseUrl)}">${htmlEscape(image.license)}</a>. ${htmlEscape(image.changes)} This image is not subject to the atlas’s noncommercial license.</p></figcaption>`;
}

export function guideNarrativeHTML(id: string, enrichment: Enrichment, media: GuideMedia): string {
  const page = enrichment.pages.find(page => page.id === id);
  const images = media.images.filter(image => image.role !== 'site-plan' && image.guideIds.includes(id));
  if (!page && !images.length) return '';
  const prose = page ? `<div class="reading-prose">${page.narrative.map(p => `<p>${htmlEscape(p.text)}</p><p class="narrative-citations">Evidence: ${p.sources.map((url,index) => `<a href="${safeSourceURL(url)}" title="${htmlEscape(page.citationTitles?.[url] ?? url)}" aria-label="${htmlEscape(page.citationTitles?.[url] ?? url)}">${htmlEscape(sourceName(url))} [${index+1}] ↗</a>`).join(' · ')}</p>`).join('')}</div>` : '';
  const figures = images.map(image => `<figure class="guide-photo"><a href="${safeSourceURL(image.sourcePage)}">${guideImageHTML(image)}</a>${guideImageCaptionHTML(image)}</figure>`).join('');
  return `<section id="historical-narrative" class="historical-narrative"><div class="eyebrow">A closer reading</div><h2>${htmlEscape(page?.heading ?? 'History in photographs')}</h2>${prose}${figures ? `<div class="guide-photo-grid">${figures}</div>` : ''}</section>`;
}

export function guideReadingHTML(id: string, sources: GuideSource[], enrichment: Enrichment): string {
  const additions = enrichment.pages.find(page => page.id === id)?.reading ?? [];
  const seen = new Set<string>();
  const encyclopedia = sources.filter(s => /https:\/\/[a-z-]+\.wikipedia\.org\/wiki\//.test(s.url)).map(s => ({...s,kind:'encyclopedia'}));
  const evidence = sources.filter(s => !/wikipedia\.org|openstreetmap\.org|GeographicNames|~dap\/meridian/.test(s.url)).slice(0, 3).map(s => ({ ...s, kind: 'evidence' }));
  const reading = [...additions, ...encyclopedia, ...evidence].filter(s => !seen.has(s.url) && !!seen.add(s.url)) as Reading[];
  // Newly added guides can use their own institutional/scholarly source list immediately.
  return `<section id="further-reading" class="further-reading"><h2>Further reading</h2><p>Follow the history outward through these accounts. Encyclopedia links offer orientation; the studies and institutional sources provide the evidence behind this guide.</p><ul>${reading.map(s => `<li><a href="${safeSourceURL(s.url)}">${htmlEscape(s.title)} ↗</a>${s.language ? ` <span class="reading-language">${htmlEscape(s.language)}</span>` : ''}${s.note ? `<p>${htmlEscape(s.note)}</p>` : ''}</li>`).join('')}</ul><p class="reading-rights">Linked writing and images remain with their rights holders. Linking does not grant permission to copy. <a href="sources-attributions.html">Sources, attributions &amp; licenses</a> lists the atlas’s sources and separately licensed material.</p></section>`;
}

export async function copyGuideMedia(media: GuideMedia): Promise<void> {
  await mkdir('sites/guide-media', { recursive: true });
  for (const image of media.images) {
    const path = guideImagePath(image);
    const bytes = await readFile('data/' + path);
    if (bytes.length !== image.bytes || bytes.length > 2_000_000 || createHash('sha256').update(bytes).digest('hex') !== image.sha256) throw new Error('Guide image provenance mismatch: ' + image.id);
    if (!image.creator || !image.license || !image.licenseUrl || !image.licenseEvidence || !image.sourcePage) throw new Error('Missing guide image attribution: ' + image.id);
    await copyFile('data/' + path, 'sites/' + path);
  }
  await copyFile('data/guide-media/manifest.json', 'sites/guide-media/manifest.json');
}

export const guideReadingCSS = `.historical-narrative{padding:2rem 0;border-top:1px solid #c8d6dd;border-bottom:1px solid #c8d6dd;margin:2rem 0}.historical-narrative h2{margin:.5rem 0 1.3rem}.reading-prose{max-width:74ch;font-size:1.12rem;line-height:1.85}.narrative-citations{font: .8rem/1.6 system-ui,sans-serif;overflow-wrap:anywhere;margin-top:-.6rem;color:#4b6271}.guide-photo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:1.5rem;max-width:960px}.guide-photo{margin:1.6rem 0 .3rem;background:#fff;border:1px solid #d5e0e5}.guide-photo img{display:block;width:100%;height:auto;max-height:480px;object-fit:contain;background:#edf1f1}.guide-photo figcaption{padding:0 1.2rem .5rem;font-size:.95rem}.photo-credit{font-size:.78rem;line-height:1.6;color:#425766}.further-reading{max-width:85ch}.further-reading li{margin:1rem 0}.further-reading li p{font-size:.9rem;margin:.25rem 0}.reading-language{font-size:.75rem;padding:.15rem .4rem;background:#e4eef2;border-radius:3px;white-space:nowrap}.reading-rights{font-size:.9rem}#architecture section>p{max-width:78ch}a{overflow-wrap:anywhere}`;
