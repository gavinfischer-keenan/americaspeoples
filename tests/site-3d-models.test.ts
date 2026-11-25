import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dataset } from '../src/published-data';
import { siteGuides } from '../src/site-guides';
import type { GuideMedia } from '../scripts/guide-enrichment';
import {
  site3DHTML,
  validateSite3DManifest,
  type Site3DManifest,
} from '../scripts/site-3d-build';

const manifest = JSON.parse(
  await readFile('data/site-3d-models.json', 'utf8'),
) as Site3DManifest;
const media = JSON.parse(
  await readFile('data/guide-media/manifest.json', 'utf8'),
) as GuideMedia;

test('site-3d-models manifest validates against actual GLB, guide-media, and published records', async () => {
  await validateSite3DManifest(manifest, media, dataset.records);
  assert.ok(manifest.models.length >= 1);
  const model = manifest.models.find((m) => m.id === 'hovenweep-little-ruin-canyon-lidar');
  assert.ok(model, 'Hovenweep LiDAR model must be registered');
  assert.equal(model.classification, 'observed-survey');
  assert.equal(model.license.projectLicenseApplies, false);
  for (const gid of model.guideIds) {
    assert.ok(siteGuides.some((g) => g.id === gid), `Missing guide ${gid}`);
  }
});

test('Hovenweep LiDAR GLB has valid glTF 2.0 binary structure and finite metric bounds', async () => {
  const glb = await readFile('data/site-3d/hovenweep-little-ruin-canyon-lidar.glb');
  assert.equal(glb.readUInt32LE(0), 0x46546c67);
  assert.equal(glb.readUInt32LE(4), 2);
  assert.equal(glb.readUInt32LE(8), glb.length);
  const jsonLen = glb.readUInt32LE(12);
  assert.equal(glb.readUInt32LE(16), 0x4e4f534a);
  const gltf = JSON.parse(glb.subarray(20, 20 + jsonLen).toString('utf8'));
  const posAcc = gltf.accessors[gltf.meshes[0].primitives[0].attributes.POSITION];
  assert.equal(posAcc.type, 'VEC3');
  assert.ok(posAcc.count > 10000);
  assert.ok(posAcc.max[0] > posAcc.min[0]);
  assert.ok(posAcc.max[1] > posAcc.min[1]);
  assert.ok(posAcc.max[2] > posAcc.min[2]);
  assert.ok(gltf.meshes[0].primitives[0].attributes.NORMAL !== undefined);
  assert.ok(gltf.meshes[0].primitives[0].attributes.COLOR_0 !== undefined);
});

test('site3DHTML renders on-demand button, classification badge, static fallback, and provenance', () => {
  const html = site3DHTML('hovenweep-castle', manifest, media);
  assert.match(html, /data-load-3d/);
  assert.match(html, /Observed survey/);
  assert.match(html, /hovenweep-castle-habs-north\.jpg/);
  assert.match(html, /U\.S\. Geological Survey/);
  assert.match(html, /Hovenweep Castle/);
  assert.equal(site3DHTML('chaco', manifest, media), '');
});

test('validateSite3DManifest rejects tampered hash, wrong license flag, missing fallback, unsafe URL, and unknown record', async () => {
  const clone = () => structuredClone(manifest);

  const badHash = clone();
  badHash.models[0].sha256 = '0'.repeat(64);
  await assert.rejects(() => validateSite3DManifest(badHash, media, dataset.records), /SHA-256 mismatch/);

  const badLicense = clone();
  badLicense.models[0].license.projectLicenseApplies = true;
  await assert.rejects(() => validateSite3DManifest(badLicense, media, dataset.records), /Invalid 3D license/);

  const badFallback = clone();
  badFallback.models[0].fallback.mediaId = 'nonexistent-image';
  await assert.rejects(() => validateSite3DManifest(badFallback, media, dataset.records), /fallback image/);

  const badUrl = clone();
  badUrl.models[0].provenance.citations[0].url = 'http://insecure.example/test';
  await assert.rejects(() => validateSite3DManifest(badUrl, media, dataset.records), /Unsafe 3D provenance URL/);

  const badRec = clone();
  badRec.models[0].annotations[0].recordId = 'no-such-record';
  await assert.rejects(() => validateSite3DManifest(badRec, media, dataset.records), /Invalid 3D annotation/);
});
