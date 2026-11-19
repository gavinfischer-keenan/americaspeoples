import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { esc } from '../src/dom';

export interface WorldGuideMedia {
  id: string;
  guideIds: string[];
  file: string;
  width: number;
  height: number;
  sha256: string;
  title: string;
  alt: string;
  caption: string;
  credit: string;
  sourceUrl: string;
  imageUrl: string;
  license: string;
  licenseUrl: string;
}

const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const filename = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpe?g|png|webp)$/;
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

function httpsURL(value: unknown): boolean {
  if (!nonempty(value) || /[\u0000-\u0020]/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function validateMedia(input: unknown): WorldGuideMedia[] {
  const manifest = input as { schemaVersion?: unknown; assets?: unknown } | null;
  if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.assets)) {
    throw new Error('Invalid world guide media manifest');
  }
  const ids = new Set<string>();
  const files = new Set<string>();
  for (const image of manifest.assets as WorldGuideMedia[]) {
    if (!image || !identifier.test(image.id) || ids.has(image.id)) {
      throw new Error('Invalid or duplicate media identity');
    }
    if (!filename.test(image.file) || files.has(image.file)) {
      throw new Error('Invalid media filename for ' + image.id);
    }
    if (!Array.isArray(image.guideIds) || !image.guideIds.length ||
        new Set(image.guideIds).size !== image.guideIds.length ||
        image.guideIds.some(id => !/^world-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))) {
      throw new Error('Invalid media guide references for ' + image.id);
    }
    if (![image.width, image.height].every(n => Number.isSafeInteger(n) && n > 0) ||
        !/^[0-9a-f]{64}$/.test(image.sha256)) {
      throw new Error('Invalid media dimensions or checksum for ' + image.id);
    }
    if (![image.title, image.alt, image.caption, image.credit, image.license].every(nonempty) ||
        ![image.sourceUrl, image.imageUrl, image.licenseUrl].every(httpsURL)) {
      throw new Error('Invalid media source or license for ' + image.id);
    }
    files.add(image.file);
    ids.add(image.id);
  }
  return manifest.assets as WorldGuideMedia[];
}

export async function copyWorldGuideMedia(rootDirectory = '.'): Promise<WorldGuideMedia[]> {
  const root = await realpath(rootDirectory);
  const input = join(root, 'data', 'world-guide-media');
  const output = join(root, 'sites', 'media');
  const media = validateMedia(JSON.parse(await readFile(join(root, 'data', 'world-guide-media.json'), 'utf8')));
  if (await realpath(input) !== input) {
    throw new Error('Media source directory must resolve within data/world-guide-media');
  }

  const verified = [];
  for (const image of media) {
    const file = join(input, image.file);
    if (await realpath(file) !== file) throw new Error('Invalid media source path for ' + image.id);
    const content = await readFile(file);
    if (createHash('sha256').update(content).digest('hex') !== image.sha256) {
      throw new Error('Media checksum mismatch for ' + image.id);
    }
    verified.push({ image, content });
  }

  await mkdir(output, { recursive: true });
  if (await realpath(output) !== output) {
    throw new Error('Media destination directory must resolve within sites/media');
  }
  for (const { image, content } of verified) {
    const file = join(output, image.file);
    const previous = await lstat(file).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
      return null;
    });
    if (previous && !previous.isFile()) throw new Error('Invalid media destination path for ' + image.id);
    await writeFile(file, content);
  }
  return media;
}

export function worldGuideMediaHTML(guideId: string, media: readonly WorldGuideMedia[]): string {
  const figures = media.filter(image => image.guideIds.includes(guideId)).map(image => {
    const url = 'media/' + esc(image.file);
    return `<figure><a href="${url}"><img src="${url}" width="${image.width}" height="${image.height}" alt="${esc(image.alt)}" loading="lazy" decoding="async"></a><figcaption><strong>${esc(image.title)}</strong><br>${esc(image.caption)}<span class="world-guide-media-credit">${esc(image.credit)} · <a href="${esc(image.sourceUrl)}">Image source</a> · <a href="${esc(image.licenseUrl)}">${esc(image.license)}</a> · <a href="${url}">Full-size image</a></span></figcaption></figure>`;
  });
  return figures.length ? `<section id="guide-media"><h2>Landscape and objects</h2><div class="world-guide-media">${figures.join('')}</div></section>` : '';
}

export const worldGuideMediaCSS = '.world-guide-media{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));gap:1rem}.world-guide-media figure{margin:0;min-width:0}.world-guide-media img{display:block;width:100%;height:auto;max-height:440px;object-fit:contain;background:#edf1eb}.world-guide-media figcaption{margin-top:.55rem}.world-guide-media-credit{display:block;margin-top:.35rem;font-size:.85rem;overflow-wrap:anywhere}';
