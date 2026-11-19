import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { copyWorldGuideMedia, worldGuideMediaHTML } from '../scripts/world-guide-media';

const pixels = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jvYQAAAAASUVORK5CYII=', 'base64');
const photo = {
  id: 'mountain-pass',
  guideIds: ['world-otzi'],
  file: 'mountain-pass.png',
  width: 1,
  height: 1,
  sha256: createHash('sha256').update(pixels).digest('hex'),
  title: 'An Alpine pass',
  alt: 'Rock & snow at the pass',
  caption: 'The <recorded> find area',
  credit: 'A. Photographer',
  sourceUrl: 'https://example.com/photo',
  imageUrl: 'https://example.com/original.png',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
};

async function withFixture(assets: object[], run: (root: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'peoples-guide-media-'));
  try {
    await mkdir(join(root, 'data', 'world-guide-media'), { recursive: true });
    await writeFile(join(root, 'data', 'world-guide-media.json'), JSON.stringify({ schemaVersion: 1, assets }));
    await writeFile(join(root, 'data', 'world-guide-media', photo.file), pixels);
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('verified media is copied to the guide-relative media directory', async () => {
  await withFixture([photo], async root => {
    const assets = await copyWorldGuideMedia(root);
    assert.equal(assets[0].id, 'mountain-pass');
    assert.deepEqual(await readFile(join(root, 'sites', 'media', 'mountain-pass.png')), pixels);
  });
});

test('checksum failure leaves the batch unpublished', async () => {
  const changed = { ...photo, id: 'altered', file: 'altered.png', sha256: '0'.repeat(64) };
  await withFixture([photo, changed], async root => {
    await writeFile(join(root, 'data', 'world-guide-media', changed.file), pixels);
    await assert.rejects(copyWorldGuideMedia(root), /checksum mismatch.*altered/i);
    await assert.rejects(readFile(join(root, 'sites', 'media', photo.file)), { code: 'ENOENT' });
  });
});

test('a parent path in the manifest cannot address a file outside the media directory', async () => {
  await withFixture([{ ...photo, file: '../mountain-pass.png' }], async root => {
    await writeFile(join(root, 'data', 'mountain-pass.png'), pixels);
    await assert.rejects(copyWorldGuideMedia(root), /invalid media filename/i);
  });
});

test('media requires a secure source link and an explicit license link', async () => {
  await withFixture([{ ...photo, sourceUrl: 'http://example.com/photo' }], async root => {
    await assert.rejects(copyWorldGuideMedia(root), /invalid media source or license/i);
  });
  await withFixture([{ ...photo, licenseUrl: '' }], async root => {
    await assert.rejects(copyWorldGuideMedia(root), /invalid media source or license/i);
  });
});

test('only the assigned guide renders the image and its visible provenance', () => {
  assert.equal(worldGuideMediaHTML('world-greenland-history', [photo]), '');
  const html = worldGuideMediaHTML('world-otzi', [photo]);
  assert.match(html, /<figure/);
  assert.match(html, /<img[^>]+src="media\/mountain-pass\.png"/);
  assert.match(html, /alt="Rock &amp; snow at the pass"/);
  assert.match(html, /<figcaption>/);
  assert.match(html, /The &lt;recorded&gt; find area/);
  assert.match(html, /A\. Photographer/);
  assert.match(html, /href="https:\/\/example\.com\/photo"/);
  assert.match(html, />CC BY 4\.0<\/a>/);
});
