// Run after the release build: node tests/maritime-guides.browser.mjs
// BROWSER_PATH, DIST_PATH, ATLAS_ORIGIN and MARITIME_SCREENSHOTS are optional.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { createStaticServer } from '../scripts/static-server.mjs';

const guideIds = [
  'lanse-aux-meadows', 'northwest-passage', 'southern-ocean-routes',
  'graveyard-hatteras', 'graveyard-pacific-northwest', 'graveyard-sable-island',
  'graveyard-great-lakes', 'graveyard-scilly', 'graveyard-western-australia',
];
const mainGuides = new Set(guideIds.slice(0, 3));
const readJSON = async file => JSON.parse(await readFile(file, 'utf8'));
const [catalog, content, maps, terrain, media, northAtlantic] = await Promise.all([
  readJSON('data/site-guides.json'), readJSON('data/site-guide-content.json'),
  readJSON('data/guide-maps/manifest.json'), readJSON('data/guide-terrain/sources.json'),
  readJSON('data/guide-media/manifest.json'), readJSON('data/north-atlantic-stories.json'),
]);
const screenshots = process.env.MARITIME_SCREENSHOTS || 'test-results/maritime-guides';
await mkdir(screenshots, { recursive: true });
const server = createStaticServer(process.env.DIST_PATH || 'dist');
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = process.env.ATLAS_ORIGIN || `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();
page.setDefaultTimeout(20000);
const errors = [], failedLocalResponses = [], violations = [], reports = [], checkedPaths = new Set();
await context.addInitScript(() => {
  document.addEventListener('securitypolicyviolation', event => console.error(`CSP: ${event.violatedDirective}`));
});
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.text().startsWith('CSP:')) violations.push(message.text()); });
page.on('response', response => {
  if (response.url().startsWith(origin + '/') && response.status() >= 400)
    failedLocalResponses.push(`${response.status()} ${response.url()}`);
});

async function localLink(url) {
  const parsed = new URL(url, page.url());
  assert.equal(parsed.origin, new URL(origin).origin);
  if (checkedPaths.has(parsed.pathname)) return;
  const response = await page.request.get(parsed.origin + parsed.pathname);
  assert.equal(response.status(), 200, `Local link: ${parsed.pathname}`);
  checkedPaths.add(parsed.pathname);
}

async function decodeImage(url) {
  return page.evaluate(async source => {
    const image = new Image();
    image.src = source;
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  }, new URL(url, page.url()).href);
}

async function loadVisibleAndHiddenImages() {
  await page.locator('[data-map-viewer]').evaluateAll(viewers => {
    for (const viewer of viewers) {
      for (let parent = viewer.parentElement; parent; parent = parent.parentElement)
        if (parent.tagName === 'DETAILS') parent.open = true;
    }
  });
  await page.locator('main img').evaluateAll(async images => {
    await Promise.all(images.map(async image => { image.loading = 'eager'; await image.decode(); }));
  });
}

async function noOverflow(label) {
  const width = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(width.document <= width.viewport + 1, `${label}: ${JSON.stringify(width)}`);
}

async function checkViewers(id) {
  const viewers = page.locator('[data-map-viewer]');
  assert.ok(await viewers.count() > 0, `${id}: at least one usable map`);
  for (const viewer of await viewers.all()) {
    await viewer.scrollIntoViewIfNeeded();
    const viewport = viewer.locator('.guide-map-viewport');
    const graphic = viewport.locator(':scope > img, :scope > svg');
    const original = await graphic.boundingBox();
    assert.ok(original?.width > 100 && original.height > 50, `${id}: visible map dimensions`);
    assert.equal(await viewport.getAttribute('tabindex'), '0');
    await viewer.locator('[data-map-action="in"]').click();
    assert.equal((await viewer.locator('output').textContent()).trim(), '150%');
    assert.ok((await graphic.boundingBox()).width > original.width * 1.4, `${id}: map zoom changes size`);
    await viewer.locator('[data-map-action="reset"]').click();
    assert.equal((await viewer.locator('output').textContent()).trim(), '100%');
    await viewport.focus();
    await page.keyboard.press('+');
    assert.equal((await viewer.locator('output').textContent()).trim(), '150%');
    await page.keyboard.press('0');
    assert.equal((await viewer.locator('output').textContent()).trim(), '100%');
    assert.equal(await viewer.locator('[data-map-action="fullscreen"]').count(), 1);
  }
  return viewers.count();
}

async function checkMaps(id) {
  const expected = maps.assets.filter(map => map.guideIds.includes(id));
  assert.equal(await page.locator('.source-map').count(), expected.length, `${id}: all reference sheets rendered`);
  for (const map of expected) {
    const image = page.locator(`.source-map img[src="maps/${map.file}"]`);
    assert.equal(await image.count(), 1, `${id}: ${map.id}`);
    assert.deepEqual(await image.evaluate(img => [img.naturalWidth, img.naturalHeight]), map.pixels, `${map.id}: native dimensions`);
    const figure = image.locator('xpath=ancestor::figure[1]');
    const download = figure.locator(`.source-map-links a[href="maps/${map.file}"]`);
    assert.equal(await download.count(), 1, `${map.id}: full-resolution link`);
    await localLink(await download.getAttribute('href'));
    const sources = await figure.locator('.source-map-links a').evaluateAll(links => links.map(a => a.href));
    assert.ok(sources.includes(map.sourceUrl), `${map.id}: original-source link`);
    assert.match(await figure.locator('figcaption').innerText(), /\S/);
  }
  const reliefs = page.locator('.site-overview svg image');
  for (const image of await reliefs.all()) {
    const href = await image.getAttribute('href');
    const file = decodeURIComponent(new URL(href, page.url()).pathname.split('/').at(-1));
    const asset = terrain.maps.find(map => map.file === file);
    assert.ok(asset, `${id}: registered terrain ${file}`);
    assert.deepEqual(await decodeImage(href), asset.pixels, `${file}: actual terrain dimensions`);
    const figure = image.locator('xpath=ancestor::figure[1]');
    assert.equal(await figure.locator(`a[href="${href}"]`).count(), 1, `${file}: full-resolution terrain link`);
    await localLink(href);
    assert.equal(await figure.locator('a[href="../guide-terrain/sources.json"]').count(), 1, `${file}: source register link`);
    assert.ok(await figure.locator('a[href^="../#review/"]').count(), `${file}: linked evidence markers`);
  }
  for (const photo of media.images.filter(image => image.guideIds.includes(id))) {
    const image = page.locator(`img[src="guide-media/${photo.file}"]`);
    assert.equal(await image.count(), 1, `${id}: photo ${photo.id}`);
    assert.deepEqual(await image.evaluate(img => [img.naturalWidth, img.naturalHeight]), [photo.width, photo.height]);
  }
  return { referenceMaps: expected.length, terrainMaps: await reliefs.count() };
}

async function checkContent(id) {
  const expected = content.pages.find(p => p.id === id);
  assert.ok(expected);
  let weatherRows = 0;
  for (const section of expected.sections) {
    const element = page.locator('section').filter({ has: page.getByRole('heading', { name: section.heading, exact: true }) });
    assert.equal(await element.count(), 1, `${id}: ${section.heading}`);
    if (section.rows.length) {
      assert.equal(await element.locator('tbody tr').count(), section.rows.length);
      if (section.columns) assert.deepEqual(await element.locator('thead th').allTextContents(), section.columns);
    }
    if (/weather through the year|waves through the year/i.test(section.heading)) {
      assert.equal(section.rows.length, 12, `${id}: all twelve months`);
      weatherRows += 12;
      for (const [index, expectedRow] of section.rows.entries()) {
        const cells = await element.locator('tbody tr').nth(index).locator('th,td').allTextContents();
        assert.equal(cells[0], expectedRow.name);
        assert.equal(cells[1], expectedRow.dates);
        assert.equal(cells[2], expectedRow.architecture);
      }
    }
  }
  if (id === 'northwest-passage') {
    assert.equal(weatherRows, 24);
    assert.match(await page.locator('main').innerText(), /1979–2019/);
    assert.match(await page.locator('main').innerText(), /90th|Hs90/);
  }
  if (id === 'southern-ocean-routes') {
    assert.equal(weatherRows, 12);
    const waves = page.locator('section').filter({ has: page.getByRole('heading', { name: 'How high are the waves?', exact: true }) });
    assert.equal(await waves.locator('tbody tr').count(), 4);
    assert.match(await waves.innerText(), /not measurements assigned to Cape Horn/);
  }
  // SVG anchors expose an SVGAnimatedString as .href; resolve the attribute for both kinds.
  const links = await page.locator('main a[href]').evaluateAll(links => links.map(a => new URL(a.getAttribute('href'), document.baseURI).href));
  for (const href of new Set(links)) {
    const url = new URL(href);
    if (url.origin !== new URL(origin).origin) {
      assert.ok(['http:', 'https:'].includes(url.protocol));
      assert.ok(!url.username && !url.password);
      continue;
    }
    if (url.pathname === new URL(page.url()).pathname && url.hash) {
      assert.ok(await page.evaluate(hash => !!document.getElementById(decodeURIComponent(hash.slice(1))), url.hash), `Missing page anchor ${url.hash}`);
    } else if (!url.hash && !/\.(webp|png|jpg)$/.test(url.pathname)) await localLink(href);
  }
  const guide = catalog.guides.find(g => g.id === id);
  if (guide.storyId) assert.equal(await page.locator(`a[href="../#story/${guide.storyId}"]`).count(), 1);
  if (guide.topicId) assert.equal(await page.locator(`a[href="../#topic/${guide.topicId}"]`).count(), 1);
  return weatherRows;
}

try {
  for (const id of guideIds) {
    const response = await page.goto(`${origin}/sites/${id}.html`);
    assert.equal(response.status(), 200, id);
    assert.ok((await page.locator('h1').innerText()).trim());
    await loadVisibleAndHiddenImages();
    const sizes = await checkMaps(id);
    const viewers = await checkViewers(id);
    const weatherRows = await checkContent(id);
    await noOverflow(`${id} desktop`);
    if (mainGuides.has(id)) {
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: path.join(screenshots, `${id}-desktop.png`) });
      const firstMap = page.locator('.site-overview,.source-map').first();
      await firstMap.screenshot({ path: path.join(screenshots, `${id}-map-desktop.png`) });
    }
    reports.push({ id, ...sizes, viewers, weatherRows });
    console.log(`PASS desktop ${id}: ${viewers} viewers; ${sizes.referenceMaps} source sheets; ${sizes.terrainMaps} terrain maps; ${weatherRows} monthly rows.`);
  }

  // Exercise the actual guide-to-movie links, not just their href strings.
  await page.goto(`${origin}/sites/lanse-aux-meadows.html`);
  await page.getByRole('link', { name: 'Watch the contextual movie', exact: true }).click();
  const story = northAtlantic.stories.find(s => s.id === 'norse-north-atlantic');
  await page.getByRole('heading', { name: story.scenes[0].title, exact: true }).waitFor();
  await page.getByRole('button', { name: 'Next scene', exact: true }).click();
  await page.getByRole('heading', { name: story.scenes[1].title, exact: true }).waitFor();
  await page.goto(`${origin}/sites/graveyard-western-australia.html`);
  await page.getByRole('link', { name: 'Watch the independent movie', exact: true }).click();
  await page.getByRole('heading', { name: 'Shipwrecks: ancient cargoes and maritime graveyards', exact: true }).waitFor();
  assert.equal(new URL(page.url()).hash, '#topic/shipwrecks');
  assert.match(await page.locator('main').innerText(), /Shipwrecks|Dokos|Uluburun/i);

  await page.setViewportSize({ width: 390, height: 844 });
  for (const id of guideIds) {
    await page.goto(`${origin}/sites/${id}.html`);
    await loadVisibleAndHiddenImages();
    await noOverflow(`${id} mobile, all map disclosures open`);
    const viewer = page.locator('[data-map-viewer]').first();
    await viewer.scrollIntoViewIfNeeded();
    await viewer.locator('[data-map-action="in"]').click();
    await noOverflow(`${id} mobile, map zoomed`);
    await viewer.locator('[data-map-action="reset"]').click();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: path.join(screenshots, `${id}-mobile.png`) });
    if (mainGuides.has(id)) {
      await page.locator('.site-overview,.source-map').first().screenshot({ path: path.join(screenshots, `${id}-map-mobile.png`) });
    }
    console.log(`PASS mobile ${id}: no page overflow at 390px, including zoomed map.`);
  }
  assert.deepEqual(errors, [], 'Browser exceptions');
  assert.deepEqual(failedLocalResponses, [], 'Failed local resources');
  assert.deepEqual(violations, [], 'Content Security Policy violations');
  await Promise.all(['failure.png', 'failure.json'].map(file => rm(path.join(screenshots, file), { force: true })));
  await writeFile(path.join(screenshots, 'results.json'), JSON.stringify({ passed: true, reports, checkedLocalPaths: [...checkedPaths], screenshots: path.resolve(screenshots) }, null, 2) + '\n');
  console.log(`PASS maritime guides: ${guideIds.length} desktop/mobile pages, loaded native map/photo dimensions, zoom/reset/keyboard controls, full-map/source links, 36 monthly rows, contextual story and shipwreck topic navigation. Screenshots: ${path.resolve(screenshots)}`);
} catch (error) {
  await page.screenshot({ path: path.join(screenshots, 'failure.png'), timeout: 5000 }).catch(() => {});
  await writeFile(path.join(screenshots, 'failure.json'), JSON.stringify({ error: String(error), url: page.url(), errors, failedLocalResponses, violations, reports }, null, 2) + '\n');
  throw error;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
