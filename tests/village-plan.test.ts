import test from 'node:test';
import assert from 'node:assert/strict';
import { guideNarrativeHTML, type GuideMedia } from '../scripts/guide-enrichment';
import { collectSourceAttributions } from '../scripts/source-attribution-build';
import { villagePlansHTML, type VillagePlan } from '../scripts/village-plan-build';

const chart = {
  id: 'historical-chart',
  role: 'site-plan',
  file: 'historical-chart.jpg',
  title: 'Harbor & village chart',
  creator: 'Survey office',
  creatorUrl: 'https://example.org/survey',
  sourcePage: 'https://example.org/chart',
  sourceUrl: 'https://example.org/scan',
  license: 'Public domain',
  licenseUrl: 'https://example.org/rights',
  licenseEvidence: 'Institutional item-level rights statement.',
  checkedAt: '2026-11-17',
  changes: 'Resized from the archived scan.',
  guideIds: ['historic-village'],
  alt: 'Survey chart with labeled buildings near the harbor.',
  caption: 'A survey snapshot of the village.',
  width: 2400,
  height: 1800,
  bytes: 200000,
  sha256: '0'.repeat(64),
  projectLicenseApplies: false,
} as const;

const media = { images: [{ ...chart, guideIds: [...chart.guideIds] }] };
const photograph = {
  ...media.images[0],
  id: 'village-photo',
  role: undefined,
  file: 'village-photo.jpg',
  sourcePage: 'https://example.org/photograph',
  sourceUrl: 'https://example.org/photograph-scan',
};
const records = [
  { id: 'site-village.1', title: 'Village & harbor', time: { original: 'Observed during the 1874–75 survey' } },
  { id: 'site-building', title: 'Building', time: { original: 'Dated in a separate account' } },
];
const base = {
  id: 'village-layout',
  guideId: 'historic-village',
  title: 'Historic village',
  description: 'The labels identify some of the landmarks in the historical account.',
  landmarks: [{ label: 'Harbor & landing', description: 'The chart labels the landing.', recordIds: ['site-village.1'] }],
};
const mediaPlan = { ...base, mediaId: 'historical-chart', surveyDate: '1874–75' } satisfies VillagePlan;
const diagramPlan = {
  ...base,
  id: 'building-relationships',
  diagram: {
    width: 640,
    height: 240,
    features: [
      { id: 'first', label: 'Earlier house', shape: 'ellipse', x: 20, y: 60, width: 160, height: 120, recordIds: ['site-village.1'] },
      { id: 'second', label: 'Rebuilt house', shape: 'rect', x: 440, y: 60, width: 160, height: 120, recordIds: ['site-building'] },
    ],
    connections: [{ from: 'first', to: 'second', label: 'Rebuilt on the same site' }],
  },
  sources: [{ url: 'https://example.org/excavation?a=1&b=2', title: 'Excavation & dates' }],
} satisfies VillagePlan;

test('a village plan displays one local chart, its rights statement, and linked original dating', () => {
  const html = villagePlansHTML(base.guideId, [mediaPlan], media, records);
  assert.match(html, /id="village-plans"/);
  assert.match(html, /data-village-plan="village-layout"/);
  assert.match(html, /<img[^>]*class="village-plan-image"/);
  assert.match(html, /Historic village/);
  assert.match(html, /Survey date[^<]*<\/[^>]+>\s*1874–75|Survey date[^<]*1874–75/);
  assert.match(html, /Harbor &amp; landing/);
  assert.match(html, /href="\.\.\/#review\/site-village\.1"[^>]*>Village &amp; harbor/);
  assert.match(html, /Observed during the 1874–75 survey/);
  assert.match(html, /href="guide-media\/historical-chart\.jpg"[^>]*>[^<]*Open full-resolution chart/);
  assert.equal(html.match(/<img [^>]*src="guide-media\/historical-chart\.jpg"/g)?.length, 1);
  assert.match(html, /alt="Survey chart with labeled buildings near the harbor\."/);
  assert.match(html, /href="https:\/\/example.org\/survey">Survey office/);
  assert.match(html, /href="https:\/\/example.org\/chart">Image source/);
  assert.match(html, /href="https:\/\/example.org\/rights">Public domain/);
  assert.match(html, /Resized from the archived scan/);
  assert.ok(html.indexOf('Open full-resolution chart') < html.indexOf('<img'));
});

test('unrelated guides get no village-plan section', () => {
  assert.equal(villagePlansHTML('unrelated', [mediaPlan], media, records), '');
});

test('plans are excluded from narrative photographs', () => {
  const html = guideNarrativeHTML(base.guideId, { pages: [] }, { images: [...media.images, photograph] });
  assert.match(html, /src="guide-media\/village-photo\.jpg"/);
  assert.doesNotMatch(html, /historical-chart\.jpg/);
  assert.equal(guideNarrativeHTML(base.guideId, { pages: [] }, media), '');
});

test('atlas source register retains the chart rights without labeling it a photograph', () => {
  const entries = collectSourceAttributions({
    records: [], pages: [], enrichment: { pages: [] }, media: { images: [...media.images, photograph] }, manifests: [],
  });
  const chartEntry = entries.find(entry => entry.urls.includes(chart.sourcePage));
  assert.equal(chartEntry?.kind, 'Reused historical map / chart');
  assert.equal(chartEntry?.license, 'Public domain');
  assert.ok(chartEntry?.licenseUrls.includes(chart.licenseUrl));
  assert.equal(entries.find(entry => entry.urls.includes(photograph.sourcePage))?.kind, 'Reused photograph');
});

test('plan text is escaped in markup', () => {
  const plan = { ...mediaPlan, title: 'Village <b>plan</b>', landmarks: [{ ...base.landmarks[0], label: 'Building <10' }] };
  const html = villagePlansHTML(base.guideId, [plan], media, records);
  assert.match(html, /Village &lt;b&gt;plan&lt;\/b&gt;/);
  assert.match(html, /Building &lt;10/);
  assert.doesNotMatch(html, /<b>plan/);
});

test('chart media rejects unsafe filenames and URLs', () => {
  const badImages = [
    { ...media.images[0], file: '../chart.jpg' },
    { ...media.images[0], sourcePage: 'javascript:void(0)' },
    { ...media.images[0], sourceUrl: 'file:///private/chart.jpg' },
    { ...media.images[0], licenseUrl: 'https://user@example.org/rights' },
    { ...media.images[0], creatorUrl: '//example.org/survey' },
  ];
  for (const image of badImages) {
    assert.throws(() => villagePlansHTML(base.guideId, [mediaPlan], { images: [image] }, records), /Unsafe|Invalid/);
  }
});

test('a plan needs licensed site-plan media assigned to the guide', () => {
  const invalid: GuideMedia[] = [
    { images: [] },
    { images: [{ ...media.images[0], role: undefined }] },
    { images: [{ ...media.images[0], guideIds: ['another'] }] },
    { images: [{ ...media.images[0], projectLicenseApplies: true }] },
    { images: [...media.images, ...media.images] },
  ];
  for (const item of invalid) assert.throws(() => villagePlansHTML(base.guideId, [mediaPlan], item, records), /media|image/i);
});

test('blank plan labels, duplicate plan IDs, and invalid atlas record references fail', () => {
  assert.throws(() => villagePlansHTML(base.guideId, [{ ...mediaPlan, title: ' ' }], media, records), /title|label/i);
  assert.throws(() => villagePlansHTML(base.guideId, [mediaPlan, { ...mediaPlan, guideId: 'other' }], media, records), /duplicate/i);
  for (const id of ['missing', 'https://example.org/site']) {
    const plan = { ...mediaPlan, landmarks: [{ ...base.landmarks[0], recordIds: [id] }] };
    assert.throws(() => villagePlansHTML(base.guideId, [plan], media, [...records, { ...records[0], id: 'https://example.org/site' }]), /record/i);
  }
});

test('original diagrams qualify their spatial limits and link labeled features, sources, and relationships', () => {
  const html = villagePlansHTML(base.guideId, [diagramPlan], { images: [] }, records);
  assert.match(html, /<svg[^>]*class="village-plan-diagram"[^>]*viewBox="0 0 640 240"[^>]*aria-labelledby=/);
  assert.match(html, /<title[^>]*>Historic village<\/title>/);
  assert.match(html, /Explanatory diagram — not to scale or geographically positioned/);
  assert.match(html, /href="\.\.\/#review\/site-building"[^>]*>\s*<[^>]+/);
  assert.match(html, /<ellipse[^>]*>/);
  assert.match(html, /<rect[^>]*>/);
  assert.match(html, /marker-end="url\(#village-plan-building-relationships-arrow\)"/);
  assert.match(html, /Rebuilt on the same site/);
  assert.match(html, /aria-label="Earlier house to Rebuilt house\. Rebuilt on the same site"/);
  assert.match(html, /href="https:\/\/example.org\/excavation\?a=1&amp;b=2">Excavation &amp; dates/);
  assert.doesNotMatch(html, /<img|Survey date/);
});

test('diagram geometry, relationships, and source links are validated', () => {
  const { diagram } = diagramPlan;
  const first = diagram.features[0];
  const badFeatures = [
    { ...first, x: -1 },
    { ...first, width: NaN },
    { ...first, height: 0 },
    { ...first, x: diagram.width - 1 },
    { ...first, label: ' ' },
    { ...first, id: diagram.features[1].id },
    { ...first, recordIds: ['missing'] },
  ];
  for (const feature of badFeatures) {
    const plan = { ...diagramPlan, diagram: { ...diagram, features: [feature, diagram.features[1]] } };
    assert.throws(() => villagePlansHTML(base.guideId, [plan], media, records), /feature|record/i);
  }
  const badLink = { ...diagramPlan, diagram: { ...diagram, connections: [{ from: 'unknown', to: 'second', label: 'Relationship' }] } };
  assert.throws(() => villagePlansHTML(base.guideId, [badLink], media, records), /connection/i);
  assert.throws(() => villagePlansHTML(base.guideId, [{ ...diagramPlan, sources: [] }], media, records), /source/i);
  assert.throws(() => villagePlansHTML(base.guideId, [{ ...diagramPlan, sources: [{ title: 'Bad', url: 'javascript:void(0)' }] }], media, records), /Unsafe/);
  const mixed = { ...diagramPlan, mediaId: mediaPlan.mediaId, surveyDate: mediaPlan.surveyDate };
  assert.throws(() => villagePlansHTML(base.guideId, [mixed as unknown as VillagePlan], media, records), /exactly one/i);
});
